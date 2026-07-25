# Momente AWS backend

Deployable AWS SAM backend for the Momente wedding gallery.

## Resources

- HTTP API Gateway
- Five Python 3.12 Lambda functions
- Private, encrypted S3 photo bucket
- DynamoDB metadata table with on-demand billing
- Cognito user pool and app client for the organizer-only delete route
- Private CloudFront delivery for optimized photos
- Account-wide $20 gross-cost budget connected to an automatic application circuit breaker

No EC2, RDS, NAT Gateway, or public S3 access is created.

## Prerequisites

- AWS CLI configured for the target account
- AWS SAM CLI
- Python 3.12

## Deploy

```bash
cd backend
sam build
sam deploy --guided
```

During the guided deployment, set `AllowedOrigin` to the exact production frontend
origin (for example, `https://main.example.amplifyapp.com`). The first deployment
creates a bucket with a generated name.

After deployment, copy the `ApiBaseUrl` output into the frontend environment:

```text
VITE_STORAGE_MODE=aws
VITE_API_BASE_URL=https://...execute-api...amazonaws.com
VITE_EVENT_ID=enis-agnesa-2026
```

## Organizer account

Create the Cognito organizer after deployment:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <OrganizerUserPoolId output> \
  --username <organizer-email>
```

The emergency delete endpoint requires a valid Cognito access token. There is no
admin secret in the browser bundle.

## Local tests

```bash
python -m unittest discover -s tests -v
```

## Operational notes

- Presigned upload URLs expire after 10 minutes.
- Original download URLs expire after 2 minutes.
- Uploads accept JPEG, PNG, and WebP originals up to 10 MB.
- Optimized objects must be JPEG and at most 10 MB.
- Public upload, gallery, and download endpoints close at the configured timestamp.
- Public endpoints also return `503 APP_DISABLED` when the cost guard is active.
- Pending presign records expire automatically through DynamoDB TTL.
- Confirmed photos become `ACTIVE` immediately.
- Originals and optimized objects expire after 90 days by default.

## Cost guard

`EmergencyCostBudget` monitors gross account cost (credits excluded) and publishes to
SNS after actual monthly cost exceeds `$20`. The shutdown Lambda writes a disabled
control record to DynamoDB. Upload, confirmation, gallery, and original-download
handlers check that record before doing work.

AWS billing data is updated at least daily. This is an emergency circuit breaker,
not a real-time or guaranteed hard spending cap. Costs can pass the threshold before
the notification arrives. The budget is account-wide, so unrelated AWS usage can
also disable Momente.

The stack output `SetAppStateFunctionName` identifies a private Lambda that can
manually disable or restore the application. Invoke it with:

```json
{"enabled": false, "reason": "MANUAL_EMERGENCY_STOP"}
```

or:

```json
{"enabled": true, "reason": "MANUAL_RESTORE"}
```

Optimized photos use stable private CloudFront URLs so browser and edge caches can
avoid repeated S3 downloads. Emergency deletion creates a CloudFront invalidation.
