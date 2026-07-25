import boto3

from common.config import BUCKET_NAME, TABLE_NAME

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
s3 = boto3.client("s3")


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
