import unicodedata

from common.config import (
    ALLOWED_ORIGINAL_TYPES,
    EVENT_ID,
    MAX_FILE_SIZE,
    MAX_FILES,
)

EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
}


class ValidationError(ValueError):
    pass


def validate_event(event_id):
    if event_id != EVENT_ID:
        raise ValidationError("Unknown event.")


def validate_presign_files(files):
    if not isinstance(files, list) or not 1 <= len(files) <= MAX_FILES:
        raise ValidationError(f"Choose between 1 and {MAX_FILES} files.")
    client_ids = set()
    for item in files:
        if not isinstance(item, dict):
            raise ValidationError("Each file must be an object.")
        required = {
            "clientId",
            "originalFileName",
            "originalContentType",
            "originalSize",
            "optimizedContentType",
            "optimizedSize",
        }
        if not required.issubset(item):
            raise ValidationError("File metadata is incomplete.")
        client_id = item["clientId"]
        if not isinstance(client_id, str) or not 1 <= len(client_id) <= 100 or client_id in client_ids:
            raise ValidationError("Invalid or duplicate clientId.")
        client_ids.add(client_id)
        content_type = item["originalContentType"]
        if content_type not in ALLOWED_ORIGINAL_TYPES:
            raise ValidationError("Only JPG, PNG, WebP, HEIC, and HEIF originals are accepted.")
        if item["optimizedContentType"] != "image/jpeg":
            raise ValidationError("Optimized files must be JPEG.")
        for field in ("originalSize", "optimizedSize"):
            size = item[field]
            if not isinstance(size, int) or not 1 <= size <= MAX_FILE_SIZE:
                raise ValidationError(f"{field} must be between 1 byte and 10 MB.")
        filename = item["originalFileName"]
        normalized_filename = (
            unicodedata.normalize("NFC", filename) if isinstance(filename, str) else filename
        )
        if (
            not isinstance(normalized_filename, str)
            or not 1 <= len(normalized_filename) <= 180
            or "/" in normalized_filename
            or "\\" in normalized_filename
            or any(unicodedata.category(char).startswith("C") for char in normalized_filename)
        ):
            raise ValidationError("Invalid original filename.")
        item["originalFileName"] = normalized_filename
    return files


def validate_submission(photos):
    if not isinstance(photos, list) or not 1 <= len(photos) <= MAX_FILES:
        raise ValidationError(f"Choose between 1 and {MAX_FILES} photos.")
    ids = set()
    for photo in photos:
        if not isinstance(photo, dict):
            raise ValidationError("Each photo must be an object.")
        photo_id = photo.get("photoId")
        name = photo.get("guestName", "")
        message = photo.get("message", "")
        session = photo.get("uploaderSessionId")
        if not isinstance(photo_id, str) or not photo_id or photo_id in ids:
            raise ValidationError("Invalid or duplicate photoId.")
        ids.add(photo_id)
        if not isinstance(name, str) or len(name.strip()) > 40:
            raise ValidationError("Guest name must contain at most 40 characters.")
        if not isinstance(message, str) or len(message.strip()) > 120:
            raise ValidationError("Message must contain at most 120 characters.")
        if not isinstance(session, str) or not 8 <= len(session) <= 128:
            raise ValidationError("Invalid uploader session.")
    return photos
