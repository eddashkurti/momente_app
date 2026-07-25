import json
import time
import uuid
from datetime import datetime, timezone

from common.aws import s3, table
from common.config import BUCKET_NAME, UPLOAD_URL_TTL, gallery_is_open
from common.http import error, parse_json, path_parameter, response
from common.validation import EXTENSIONS, ValidationError, validate_event, validate_presign_files


def handler(event, _context):
    try:
        event_id = path_parameter(event, "eventId")
        validate_event(event_id)
        if not gallery_is_open():
            return error(410, "GALLERY_CLOSED", "The public gallery is closed.")
        files = validate_presign_files(parse_json(event).get("files"))
    except (ValidationError, json.JSONDecodeError) as exc:
        return error(400, "INVALID_REQUEST", str(exc))

    date_path = datetime.now(timezone.utc).strftime("%Y/%m/%d")
    uploads = []
    for item in files:
        photo_id = str(uuid.uuid4())
        original_key = f"originals/{event_id}/{date_path}/{photo_id}{EXTENSIONS[item['originalContentType']]}"
        optimized_key = f"optimized/{event_id}/{date_path}/{photo_id}.jpg"
        pending = {
            "PK": f"EVENT#{event_id}",
            "SK": f"PENDING#{photo_id}",
            "entityType": "PENDING",
            "eventId": event_id,
            "photoId": photo_id,
            "originalKey": original_key,
            "optimizedKey": optimized_key,
            "originalFileName": item["originalFileName"],
            "originalContentType": item["originalContentType"],
            "originalSize": item["originalSize"],
            "optimizedContentType": "image/jpeg",
            "optimizedSize": item["optimizedSize"],
            "expiresAt": int(time.time()) + UPLOAD_URL_TTL,
        }
        table.put_item(Item=pending, ConditionExpression="attribute_not_exists(PK)")
        common = {"Bucket": BUCKET_NAME}
        original_url = s3.generate_presigned_url(
            "put_object",
            Params={
                **common,
                "Key": original_key,
                "ContentType": item["originalContentType"],
            },
            ExpiresIn=UPLOAD_URL_TTL,
        )
        optimized_url = s3.generate_presigned_url(
            "put_object",
            Params={**common, "Key": optimized_key, "ContentType": "image/jpeg"},
            ExpiresIn=UPLOAD_URL_TTL,
        )
        uploads.append(
            {
                "clientId": item["clientId"],
                "photoId": photo_id,
                "originalKey": original_key,
                "optimizedKey": optimized_key,
                "originalUploadUrl": original_url,
                "optimizedUploadUrl": optimized_url,
                "expiresIn": UPLOAD_URL_TTL,
            }
        )
    return response(200, {"uploads": uploads})
