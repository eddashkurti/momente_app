# AWS Integration and Deployment Plan

Implementation status: the SAM infrastructure, Python Lambda handlers, and frontend
AWS repository adapter are now included in this repository. The remaining steps
require the target AWS account: configure budgets, deploy the stack, create the
organizer account, set the frontend environment variables, and perform device tests.

This phase begins only after the local frontend is visually approved and tested on phones.

## 1. Create cost controls first

- Create an AWS Budget.
- Alert at $5 actual spend.
- Alert at $10 actual spend.
- Alert at $25 forecasted spend.
- Do not create EC2, RDS, NAT Gateway, or OpenSearch resources.

## 2. Create private photo storage

Create one private S3 bucket with prefixes:

```text
originals/
optimized/
```

Required settings:

- Block all public access
- Server-side encryption
- CORS restricted to the final frontend domain
- Lifecycle rule after the family has downloaded the photos
- No bucket-list permission for guests

## 3. Create DynamoDB metadata table

Recommended table:

```text
MomentePhotoSubmissions
```

Primary key design:

```text
PK = EVENT#{eventId}
SK = PHOTO#{uploadedAt}#{photoId}
```

Fields:

- eventId
- photoId
- originalKey
- optimizedKey
- originalFileName
- originalContentType
- originalSize
- optimizedSize
- guestName
- message
- uploaderSessionId
- uploadedAt
- status = ACTIVE

A status/time index may be added if emergency deletion and multiple events require it.

## 4. Python Lambda functions

The backend includes five functions:

1. `create_upload_urls`
2. `create_submission`
3. `list_photos`
4. `delete_photo`
5. `get_download_url`

Do not add moderation workflows. Every successfully confirmed upload becomes `ACTIVE` and is immediately eligible for the gallery and slideshow.

## 5. Upload process

For each selected photo:

1. Browser validates the original.
2. Browser creates the optimized JPEG.
3. Browser requests upload URLs for both files.
4. Browser uploads original and optimized blobs directly to S3.
5. Browser confirms the submission metadata.
6. Lambda verifies both objects exist.
7. DynamoDB record is created as `ACTIVE`.
8. Gallery and slideshow receive the record on their next refresh.

The backend must not trust sizes, MIME types, keys, or event IDs supplied by the browser without validation.

## 6. Select the AWS repository

Implemented in:

```text
src/services/awsPhotoRepository.ts
```

It must implement the existing `PhotoRepository` contract. Then select the implementation through:

```text
VITE_STORAGE_MODE=aws
```

The pages, components, gallery, slideshow, and upload UX remain unchanged. Local
mode remains available through `VITE_STORAGE_MODE=local`.

## 7. Host frontend

Recommended first choice:

- AWS Amplify Hosting connected to GitHub

Reasons:

- automatic HTTPS
- easy Vite environment variables
- automatic deployment from pushes
- simpler than manually configuring frontend S3 and CloudFront

The photo bucket remains separate and private.

## 8. Delivery of images

Use CloudFront in front of the optimized-photo prefix, or have the list API return short-lived signed GET URLs.

For wedding reliability, CloudFront with private S3 origin is preferred because slideshow images can be cached efficiently.

## 9. Emergency admin control

The wedding does not use approval. Still provide one authenticated emergency page for deletion.

Production authentication options:

- one Cognito organizer account, or
- a backend-validated short-lived admin session

Do not use a secret query parameter or a password embedded in Vite environment variables.

## 10. Shut down public access

The public gallery is configured to close after 11.08.2026. The backend must enforce the same date; frontend-only enforcement is not security.

After closing:

- disable new presigned uploads
- disable public gallery API access
- keep private organizer access
- download and back up originals
- later apply lifecycle cleanup

## 11. Cost circuit breaker

The deployed stack includes:

- a `$20 USD` monthly gross-cost budget (credits excluded)
- email notification to the account owner
- SNS delivery to a shutdown Lambda
- a DynamoDB `CONTROL` record checked by all public handlers
- a private manual enable/disable Lambda
- API Gateway throttling of 10 requests/second with a burst of 20
- private CloudFront caching for optimized images
- 90-day S3 lifecycle expiration

This does not constitute a hard cap. AWS Budgets uses billing data refreshed at
least daily, so actual cost can exceed the threshold before shutdown occurs.
