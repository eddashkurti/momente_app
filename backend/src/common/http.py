import base64
import json

from common.config import ALLOWED_ORIGIN


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "content-type": "application/json; charset=utf-8",
            "access-control-allow-origin": ALLOWED_ORIGIN,
            "cache-control": "no-store",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }


def error(status_code, code, message):
    return response(status_code, {"error": {"code": code, "message": message}})


def parse_json(event):
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    return json.loads(raw)


def path_parameter(event, name):
    return (event.get("pathParameters") or {}).get(name)
