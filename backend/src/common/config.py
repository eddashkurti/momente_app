import os
from datetime import datetime, timezone

TABLE_NAME = os.environ["TABLE_NAME"]
BUCKET_NAME = os.environ["BUCKET_NAME"]
EVENT_ID = os.environ.get("EVENT_ID", "enis-agnesa-2026")
GALLERY_CLOSES_AT = os.environ.get("GALLERY_CLOSES_AT", "2026-08-11T21:59:59Z")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "")
IMAGE_BASE_URL = os.environ.get("IMAGE_BASE_URL", "").rstrip("/")
DISTRIBUTION_ID = os.environ.get("DISTRIBUTION_ID", "")
FRONTEND_DISTRIBUTION_ID = os.environ.get("FRONTEND_DISTRIBUTION_ID", "")
UPLOAD_URL_TTL = 600
DOWNLOAD_URL_TTL = 120
MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_FILES = 5


def gallery_is_open(now=None):
    now = now or datetime.now(timezone.utc)
    closing = datetime.fromisoformat(GALLERY_CLOSES_AT.replace("Z", "+00:00"))
    return now <= closing
