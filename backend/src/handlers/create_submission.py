import json
from datetime import datetime, timezone
from decimal import Decimal

from botocore.exceptions import ClientError

from common.aws import app_is_enabled, s3, table
from common.config import BUCKET_NAME, gallery_is_open
from common.http import error, parse_json, path_parameter, response
from common.validation import ValidationError, validate_event, validate_submission


def _verify_object(key, expected_type, expected_size):
    head = s3.head_object(Bucket=BUCKET_NAME, Key=key)
    if head.get("ContentType") != expected_type or head.get("ContentLength") != expected_size:
        raise ValidationError("Uploaded object does not match the approved metadata.")


def handler(event, _context):
    try:
        event_id = path_parameter(event, "eventId")
        validate_event(event_id)
        if not app_is_enabled(event_id):
            return error(503, "APP_DISABLED", "Momente is temporarily disabled by its cost guard.")
        if not gallery_is_open():
            return error(410, "GALLERY_CLOSED", "The public gallery is closed.")
        photos = validate_submission(parse_json(event).get("photos"))
    except (ValidationError, json.JSONDecodeError) as exc:
        return error(400, "INVALID_REQUEST", str(exc))

    created = []
    for request_photo in photos:
        photo_id = request_photo["photoId"]
        pending_key = {"PK": f"EVENT#{event_id}", "SK": f"PENDING#{photo_id}"}
        pending = table.get_item(Key=pending_key, ConsistentRead=True).get("Item")
        if not pending:
            return error(409, "UPLOAD_NOT_FOUND", "The upload request expired or was already confirmed.")
        try:
            _verify_object(
                pending["originalKey"],
                pending["originalContentType"],
                int(pending["originalSize"]),
            )
            _verify_object(
                pending["optimizedKey"],
                "image/jpeg",
                int(pending["optimizedSize"]),
            )
        except (ClientError, ValidationError):
            return error(409, "UPLOAD_INCOMPLETE", "Both approved photo objects must be uploaded first.")

        counter = table.update_item(
            Key={"PK": f"EVENT#{event_id}", "SK": "COUNTER"},
            UpdateExpression="ADD photoCount :one SET lastUploadedAt = :now",
            ExpressionAttributeValues={
                ":one": Decimal(1),
                ":now": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            },
            ReturnValues="ALL_NEW",
        )["Attributes"]
        sequence = int(counter["photoCount"])
        uploaded_at = counter["lastUploadedAt"]
        item = {
            **{key: value for key, value in pending.items() if key not in {"PK", "SK", "expiresAt"}},
            "PK": f"EVENT#{event_id}",
            "SK": f"PHOTO#{sequence:012d}#{photo_id}",
            "GSI1PK": f"EVENT#{event_id}",
            "GSI1SK": f"PHOTOID#{photo_id}",
            "entityType": "PHOTO",
            "guestName": request_photo.get("guestName", "").strip(),
            "message": request_photo.get("message", "").strip(),
            "uploaderSessionId": request_photo["uploaderSessionId"],
            "uploadedAt": uploaded_at,
            "sequence": sequence,
            "status": "ACTIVE",
        }
        table.put_item(Item=item, ConditionExpression="attribute_not_exists(PK)")
        table.put_item(
            Item={
                "PK": f"EVENT#{event_id}",
                "SK": f"CONTRIBUTOR#{request_photo['uploaderSessionId']}",
                "entityType": "CONTRIBUTOR",
            }
        )
        table.delete_item(Key=pending_key)
        created.append({"photoId": photo_id, "uploadedAt": uploaded_at, "status": "ACTIVE"})
    return response(201, {"created": len(created), "photos": created})
