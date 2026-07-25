import os

import boto3
from botocore.config import Config

from common.config import BUCKET_NAME, TABLE_NAME

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
s3 = boto3.client(
    "s3",
    region_name=os.environ.get("AWS_REGION"),
    config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
)
cloudfront = boto3.client("cloudfront")


def find_photo(event_id, photo_id):
    result = table.query(
        IndexName="ByPhotoId",
        KeyConditionExpression="GSI1PK = :pk AND GSI1SK = :sk",
        ExpressionAttributeValues={
            ":pk": f"EVENT#{event_id}",
            ":sk": f"PHOTOID#{photo_id}",
        },
        Limit=1,
    )
    items = result.get("Items", [])
    return items[0] if items else None


def app_is_enabled(event_id):
    control = table.get_item(
        Key={"PK": f"EVENT#{event_id}", "SK": "CONTROL"},
        ConsistentRead=True,
    ).get("Item")
    return not control or control.get("enabled", True)
