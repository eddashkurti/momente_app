import json
from datetime import datetime, timezone

import time

from common.aws import cloudfront, set_photo_distribution_enabled, table
from common.config import DISTRIBUTION_ID, EVENT_ID


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
    distribution_changed = set_photo_distribution_enabled(DISTRIBUTION_ID, False)
    if DISTRIBUTION_ID:
        cloudfront.create_invalidation(
            DistributionId=DISTRIBUTION_ID,
            InvalidationBatch={
                "Paths": {"Quantity": 1, "Items": ["/*"]},
                "CallerReference": f"budget-shutdown-{time.time_ns()}",
            },
        )
    return {
        "disabled": True,
        "eventId": EVENT_ID,
        "disabledAt": disabled_at,
        "distributionDisableStarted": distribution_changed,
    }
