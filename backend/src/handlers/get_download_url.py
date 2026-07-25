from common.aws import find_photo, s3
from common.config import BUCKET_NAME, DOWNLOAD_URL_TTL, gallery_is_open
from common.http import error, path_parameter, response
from common.validation import ValidationError, validate_event


def handler(event, _context):
    try:
        event_id = path_parameter(event, "eventId")
        validate_event(event_id)
    except ValidationError as exc:
        return error(400, "INVALID_REQUEST", str(exc))
    if not gallery_is_open():
        return error(410, "GALLERY_CLOSED", "The public gallery is closed.")
    photo = find_photo(event_id, path_parameter(event, "photoId"))
    if not photo or photo.get("status") != "ACTIVE":
        return error(404, "PHOTO_NOT_FOUND", "Photo not found.")
    url = s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": photo["originalKey"],
            "ResponseContentDisposition": f"attachment; filename=\"{photo['originalFileName']}\"",
        },
        ExpiresIn=DOWNLOAD_URL_TTL,
    )
    return response(200, {"downloadUrl": url, "expiresIn": DOWNLOAD_URL_TTL})
