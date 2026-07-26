# Momente

**Momente** is a mobile-first event photo-sharing application created for the wedding of **Enis & Agnesa** on **08.08.2026**.

Guests open one QR-code link, upload up to five photos, optionally add their name and a short message, browse the shared gallery, and download original photos from the opened-photo view. A separate full-screen route displays all uploaded photos in upload order.

## Current build

This repository contains the frontend plus a deployable AWS SAM backend. Local mode
uses IndexedDB for development; AWS mode uploads directly to private S3 through
presigned URLs and stores gallery metadata in DynamoDB.

### Included

- Albanian interface
- Minimal cream and champagne visual theme
- Responsive invitation-style landing page
- Up to five photos per submission
- JPG, PNG, and WebP validation
- 10 MB pre-compression limit per image
- Client-side optimization to JPEG, maximum 1920 px, approximately 84% quality
- Original and optimized copies retained locally
- Optional guest name, maximum 40 characters
- Optional message, maximum 120 characters
- Upload progress and elegant success animation
- Live photo, contributor, and latest-upload statistics
- Shared photo mosaic in upload order
- Full-screen photo viewer
- Original-photo download only after opening a photo
- Automatic slideshow queue
- Background refresh every 15 seconds
- Small name/message caption
- Random “Momenti i veçantë” treatment
- QR code displayed on the slideshow
- End-of-wedding thank-you sequence
- Public-gallery closing date configured for 11.08.2026 at 23:59
- Developer-only local controls for demo seeding and deletion
- Signature footer: “Momente u krijua me 🤍 nga Edda për Enisin dhe Agnesën.”

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS Vite plugin
- IndexedDB through `idb`
- `browser-image-compression`
- React Router
- `qrcode.react`
- Lucide icons
- Locally bundled Cormorant Garamond and Manrope fonts

## Live AWS website

The production frontend is hosted privately in S3 and delivered through CloudFront:

- Website: https://dyy02nv8viwmb.cloudfront.net
- TV slideshow: https://dyy02nv8viwmb.cloudfront.net/slideshow

Although the frontend files are served from S3, the website is live and dynamic:
uploads and gallery refreshes use API Gateway, Lambda, DynamoDB, S3 and CloudFront.
The slideshow QR code points guests to the production website.

## Run locally

Requirements:

- Node.js 20.19+ or 22.12+
- npm

```bash
npm install
npm run dev
```

Open the URL shown by Vite, normally:

```text
http://localhost:5173
```

### Local routes

- `/` — landing page
- `/upload` — guest upload form
- `/gallery` — shared ordered gallery
- `/slideshow` — television/projector mode
- `/organizer` — private organizer login and emergency photo removal
- `/dev-admin` — development-only controls; unavailable in production mode

To preview the closing slideshow before the configured time:

```text
http://localhost:5173/slideshow?thankyou=1
```

## Test the complete local flow

1. Open `/dev-admin`.
2. Choose **Mbush me fotografi demo**.
3. Return to `/` to inspect the homepage and live counters.
4. Open `/gallery` and select any photo.
5. Confirm the original download action appears only inside the open-photo view.
6. Open `/slideshow` in another tab.
7. Upload new photos from `/upload`.
8. Confirm the gallery and slideshow receive the new photos without a full-page reload.

The local prototype stores images in IndexedDB. It is intended for UX testing, not for collecting real wedding photos across devices.

## Storage architecture

The UI depends on the `PhotoRepository` interface:

```text
React pages and hooks
        |
        v
PhotoRepository interface
        |
        +-- LocalPhotoRepository  (current IndexedDB prototype)
        |
        +-- AwsPhotoRepository    (production API + private S3)
```

This separation is intentional. The AWS integration will implement the same operations:

- list photos
- upload photo records
- read statistics
- delete emergency uploads

No page should need to know whether data comes from IndexedDB, API Gateway, S3, or DynamoDB.

## AWS architecture

```text
Guest phone
    |
    v
React app hosted on AWS Amplify
    |
    | POST /uploads/presign
    v
API Gateway + Python Lambda
    |
    +--> Presigned PUT: private S3 original bucket path
    +--> Presigned PUT: private S3 optimized bucket path
    |
    | POST /submissions
    v
DynamoDB metadata record (ACTIVE)
    |
    +--> GET /photos for gallery and slideshow
    +--> DELETE /admin/photos/{photoId} for emergency removal
```

Recommended S3 keys:

```text
originals/enis-agnesa-2026/2026/08/08/{photoId}.{extension}
optimized/enis-agnesa-2026/2026/08/08/{photoId}.jpg
```

The original remains private. The optimized copy is delivered through CloudFront or time-limited signed URLs. The public gallery never lists the bucket directly.

## Configuration

Event configuration is centralized in:

```text
src/config/event.ts
```

It contains:

- names
- wedding date
- gallery closing date
- thank-you start time
- upload limits
- slideshow timing
- footer text

Environment placeholders are documented in `.env.example`.

For local IndexedDB development:

```text
VITE_STORAGE_MODE=local
```

For the deployed backend:

```text
VITE_STORAGE_MODE=aws
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com
VITE_EVENT_ID=enis-agnesa-2026
```

Backend deployment instructions are in [`backend/README.md`](backend/README.md).

## Security decisions

- No AWS keys in the browser
- Private S3 storage
- Presigned uploads only
- Server-side validation repeated in Lambda
- File type and size validation in both browser and backend
- API throttling before sharing the QR code
- Emergency-delete route authenticated on the backend
- No fake frontend password included
- The local `/dev-admin` route exists only during Vite development

## Before the wedding

The production system must be tested with:

- multiple iPhones
- multiple Android phones
- weak venue Wi-Fi
- a mobile hotspot backup
- the actual projector or television
- portrait and landscape photos
- 5-photo batches
- emoji and Albanian characters
- temporary internet interruption
- full-screen slideshow mode
- real printed QR codes at several distances

## Documentation

- [`docs/aws-integration-plan.md`](docs/aws-integration-plan.md)
- [`docs/api-contract.md`](docs/api-contract.md)
- [`docs/testing-checklist.md`](docs/testing-checklist.md)
- [`docs/wedding-day-runbook.md`](docs/wedding-day-runbook.md)

## Author

Created with care by **Edda Shkurti** for Enis and Agnesa.
