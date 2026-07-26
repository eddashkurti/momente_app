import time

from boto3.dynamodb.conditions import Key

from common.aws import cloudfront, find_photo, s3, table
from common.config import BUCKET_NAME, DISTRIBUTION_ID
from common.http import error, path_parameter, response
from common.validation import ValidationError, validate_event


def _chunks(items, size):
    for index in range(0, len(items), size):
        yield items[index : index + size]


def _delete_all(event_id):
    photos = []
    cursor = None
    while True:
        query = {
            "KeyConditionExpression": Key("PK").eq(f"EVENT#{event_id}")
            & Key("SK").begins_with("PHOTO#"),
        }
        if cursor:
            query["ExclusiveStartKey"] = cursor
        page = table.query(**query)
        photos.extend(item for item in page.get("Items", []) if item.get("status") == "ACTIVE")
        cursor = page.get("LastEvaluatedKey")
        if not cursor:
            break

    object_keys = [
        key
        for photo in photos
        for key in (photo.get("originalKey"), photo.get("optimizedKey"))
        if key
    ]
    for keys in _chunks(object_keys, 1000):
        s3.delete_objects(
            Bucket=BUCKET_NAME,
            Delete={"Objects": [{"Key": key} for key in keys], "Quiet": True},
        )

    with table.batch_writer(overwrite_by_pkeys=["PK", "SK"]) as batch:
        for photo in photos:
            photo["status"] = "DELETED"
            batch.put_item(Item=photo)

    if photos and DISTRIBUTION_ID:
        cloudfront.create_invalidation(
            DistributionId=DISTRIBUTION_ID,
            InvalidationBatch={
                "Paths": {
                    "Quantity": 1,
                    "Items": [f"/optimized/{event_id}/*"],
                },
                "CallerReference": f"delete-all-{event_id}-{time.time_ns()}",
            },
        )
    return response(200, {"deleted": len(photos)})


def handler(event, _context):
    try:
        event_id = path_parameter(event, "eventId")
        validate_event(event_id)
    except ValidationError as exc:
        return error(400, "INVALID_REQUEST", str(exc))
    photo_id = path_parameter(event, "photoId")
    if not photo_id:
        return _delete_all(event_id)

    photo = find_photo(event_id, photo_id)
    if not photo or photo.get("status") != "ACTIVE":
        return error(404, "PHOTO_NOT_FOUND", "Photo not found.")
    table.update_item(
        Key={"PK": photo["PK"], "SK": photo["SK"]},
        UpdateExpression="SET #status = :deleted",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":deleted": "DELETED"},
    )
    s3.delete_objects(
        Bucket=BUCKET_NAME,
        Delete={
            "Objects": [
                {"Key": photo["originalKey"]},
                {"Key": photo["optimizedKey"]},
            ]
        },
    )
    if DISTRIBUTION_ID:
        cloudfront.create_invalidation(
            DistributionId=DISTRIBUTION_ID,
            InvalidationBatch={
                "Paths": {"Quantity": 1, "Items": [f"/{photo['optimizedKey']}"]},
                "CallerReference": f"delete-{photo['photoId']}-{time.time_ns()}",
            },
        )
    return response(200, {"deleted": True, "photoId": photo["photoId"]})
