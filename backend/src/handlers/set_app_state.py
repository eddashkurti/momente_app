from datetime import datetime, timezone

from common.aws import set_photo_distribution_enabled, table
from common.config import DISTRIBUTION_ID, EVENT_ID


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
    distribution_changed = set_photo_distribution_enabled(DISTRIBUTION_ID, enabled)
    return {
        "enabled": enabled,
        "eventId": EVENT_ID,
        "changedAt": changed_at,
        "distributionChangeStarted": distribution_changed,
    }
