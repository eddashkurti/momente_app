from common.aws import find_photo, s3, table
from common.config import BUCKET_NAME
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
    return response(200, {"deleted": True, "photoId": photo["photoId"]})
