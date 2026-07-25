# API Contract

Base path:

```text
/api/events/{eventId}
```

## Create upload URLs

```http
POST /api/events/enis-agnesa-2026/uploads/presign
```

Request:

```json
{
  "files": [
    {
      "clientId": "temporary-browser-id",
      "originalFileName": "IMG_1234.JPG",
      "originalContentType": "image/jpeg",
      "originalSize": 5312450,
      "optimizedContentType": "image/jpeg",
      "optimizedSize": 1284450
    }
  ]
}
```

Response:

```json
{
  "uploads": [
    {
      "clientId": "temporary-browser-id",
      "photoId": "uuid",
      "originalKey": "originals/enis-agnesa-2026/2026/08/08/uuid.jpg",
      "optimizedKey": "optimized/enis-agnesa-2026/2026/08/08/uuid.jpg",
      "originalUploadUrl": "presigned-url",
      "optimizedUploadUrl": "presigned-url",
      "expiresIn": 600
    }
  ]
}
```

## Confirm submission

```http
POST /api/events/enis-agnesa-2026/submissions
```

Request:

```json
{
  "photos": [
    {
      "photoId": "uuid",
      "guestName": "Arta",
      "message": "Urime për një jetë plot dashuri 🤍",
      "uploaderSessionId": "anonymous-browser-session"
    }
  ]
}
```

The backend retrieves trusted object keys from the presign record, verifies both objects, and writes DynamoDB metadata.

Response:

```json
{
  "created": 1,
  "photos": [
    {
      "photoId": "uuid",
      "uploadedAt": "2026-08-08T18:43:21Z",
      "status": "ACTIVE"
    }
  ]
}
```

## List photos

```http
GET /api/events/enis-agnesa-2026/photos?cursor=&limit=100
```

Response order must be ascending by upload sequence/time.

```json
{
  "photos": [
    {
      "photoId": "uuid",
      "optimizedUrl": "signed-or-cloudfront-url",
      "guestName": "Arta",
      "message": "Urime!",
      "uploadedAt": "2026-08-08T18:43:21Z",
      "sequence": 349
    }
  ],
  "stats": {
    "photoCount": 349,
    "contributorCount": 87,
    "lastUploadedAt": "2026-08-08T18:43:21Z"
  },
  "nextCursor": null
}
```

## Request original download

Original URLs should not be included in the gallery list.

```http
POST /api/events/enis-agnesa-2026/photos/{photoId}/download
```

Response:

```json
{
  "downloadUrl": "short-lived-signed-url",
  "expiresIn": 120
}
```

## Emergency delete

```http
DELETE /api/admin/events/enis-agnesa-2026/photos/{photoId}
Authorization: Bearer <organizer-token>
```

The backend deletes or marks the metadata record as deleted and removes both S3 objects.
