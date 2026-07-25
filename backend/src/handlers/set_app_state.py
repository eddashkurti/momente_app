from datetime import datetime, timezone

from common.aws import table
from common.config import EVENT_ID


def handler(event, _context):
    enabled = bool(event.get("enabled"))
    changed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    table.put_item(
        Item={
            "PK": f"EVENT#{EVENT_ID}",
            "SK": "CONTROL",
            "entityType": "CONTROL",
            "enabled": enabled,
            "changedAt": changed_at,
            "reason": event.get("reason", "MANUAL"),
        }
    )
    return {"enabled": enabled, "eventId": EVENT_ID, "changedAt": changed_at}
