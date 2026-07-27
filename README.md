# Momente

**Momente** is a mobile-first event photo-sharing application created for the wedding of **Enis & Agnesa** on **08.08.2026**.

Guests open one QR-code link, upload up to five photos, optionally add their name and a short message, browse the shared gallery, and download original photos from the opened-photo view. A separate full-screen route displays all uploaded photos in upload order.

## Current build

This repository contains the frontend plus a deployable AWS SAM backend. Local mode
uses IndexedDB for development; AWS mode uploads directly to private S3 through
presigned URLs and stores gallery metadata in DynamoDB.


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

The production frontend is hosted privately in S3 and delivered through CloudFront
at `https://momente-enis-agnesa.online`.

Although the frontend files are served from S3, the website is live and dynamic:
uploads and gallery refreshes use API Gateway, Lambda, DynamoDB, S3 and CloudFront.
The slideshow QR code points guests to the production website.

## Documentation

- [`docs/aws-integration-plan.md`](docs/aws-integration-plan.md)
- [`docs/api-contract.md`](docs/api-contract.md)
- [`docs/testing-checklist.md`](docs/testing-checklist.md)
- [`docs/wedding-day-runbook.md`](docs/wedding-day-runbook.md)

## Author

Created with care by **Edda Shkurti** for Enis and Agnesa.
