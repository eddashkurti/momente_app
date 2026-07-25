import json
from datetime import datetime, timezone

from common.aws import table
from common.config import EVENT_ID


def handler(event, _context):
    messages = []
    for record in event.get("Records", []):
        message = record.get("Sns", {}).get("Message", "")
        try:
            messages.append(json.loads(message))
        except (json.JSONDecodeError, TypeError):
            messages.append(message)
    disabled_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    table.put_item(
        Item={
            "PK": f"EVENT#{EVENT_ID}",
            "SK": "CONTROL",
            "entityType": "CONTROL",
            "enabled": False,
            "disabledAt": disabled_at,
            "reason": "AWS_BUDGET_THRESHOLD",
            "budgetMessages": messages,
        }
    )
    return {"disabled": True, "eventId": EVENT_ID, "disabledAt": disabled_at}
