import base64
import json
from decimal import Decimal

from boto3.dynamodb.conditions import Key

from common.aws import app_is_enabled, table
from common.config import IMAGE_BASE_URL, gallery_is_open
from common.http import error, path_parameter, response
from common.validation import ValidationError, validate_event


def _encode_cursor(key):
    return base64.urlsafe_b64encode(json.dumps(key).encode()).decode()


def _decode_cursor(value):
    return json.loads(base64.urlsafe_b64decode(value.encode()).decode()) if value else None


def _plain(value):
    if isinstance(value, Decimal):
        return int(value)
    return value


def handler(event, _context):
    try:
        event_id = path_parameter(event, "eventId")
        validate_event(event_id)
        if not app_is_enabled(event_id):
            return error(503, "APP_DISABLED", "Momente is temporarily disabled by its cost guard.")
        if not gallery_is_open():
            return error(410, "GALLERY_CLOSED", "The public gallery is closed.")
        query = event.get("queryStringParameters") or {}
        limit = min(max(int(query.get("limit", "100")), 1), 100)
        cursor = _decode_cursor(query.get("cursor"))
    except (ValidationError, ValueError, json.JSONDecodeError):
        return error(400, "INVALID_REQUEST", "Invalid event, limit, or cursor.")

    kwargs = {
        "KeyConditionExpression": Key("PK").eq(f"EVENT#{event_id}") & Key("SK").begins_with("PHOTO#"),
        "Limit": limit,
        "ScanIndexForward": True,
    }
    if cursor:
        kwargs["ExclusiveStartKey"] = cursor
    result = table.query(**kwargs)
    photos = []
    for item in result.get("Items", []):
        if item.get("status") != "ACTIVE":
            continue
        optimized_url = f"{IMAGE_BASE_URL}/{item['optimizedKey']}"
        photos.append(
            {
                "photoId": item["photoId"],
                "optimizedUrl": optimized_url,
                "originalFileName": item["originalFileName"],
                "originalContentType": item["originalContentType"],
                "originalSize": _plain(item["originalSize"]),
                "optimizedSize": _plain(item["optimizedSize"]),
                "guestName": item.get("guestName", ""),
                "message": item.get("message", ""),
                "uploadedAt": item["uploadedAt"],
                "sequence": _plain(item["sequence"]),
            }
        )
    stats_photos = []
    stats_cursor = None
    while True:
        stats_kwargs = {
            "KeyConditionExpression": Key("PK").eq(f"EVENT#{event_id}")
            & Key("SK").begins_with("PHOTO#"),
            "ProjectionExpression": "uploaderSessionId, uploadedAt, #status",
            "ExpressionAttributeNames": {"#status": "status"},
        }
        if stats_cursor:
            stats_kwargs["ExclusiveStartKey"] = stats_cursor
        stats_page = table.query(**stats_kwargs)
        stats_photos.extend(
            item for item in stats_page.get("Items", []) if item.get("status") == "ACTIVE"
        )
        stats_cursor = stats_page.get("LastEvaluatedKey")
        if not stats_cursor:
            break
    contributors = len(
        {item["uploaderSessionId"] for item in stats_photos if item.get("uploaderSessionId")}
    )
    latest = max((item["uploadedAt"] for item in stats_photos), default=None)
    last_key = result.get("LastEvaluatedKey")
    return response(
        200,
        {
            "photos": photos,
            "stats": {
                "photoCount": len(stats_photos),
                "contributorCount": contributors,
                "lastUploadedAt": latest,
            },
            "nextCursor": _encode_cursor(last_key) if last_key else None,
        },
    )
