import time

from common.aws import cloudfront, find_photo, s3, table
from common.config import BUCKET_NAME, DISTRIBUTION_ID
from common.http import error, path_parameter, response
from common.validation import ValidationError, validate_event


def handler(event, _context):
    try:
        event_id = path_parameter(event, "eventId")
        validate_event(event_id)
    except ValidationError as exc:
        return error(400, "INVALID_REQUEST", str(exc))
    photo = find_photo(event_id, path_parameter(event, "photoId"))
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
