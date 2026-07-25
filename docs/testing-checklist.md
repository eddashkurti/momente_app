# Testing Checklist

## Backend before production

- [ ] `sam validate --lint`
- [ ] `sam build`
- [ ] Deploy to a non-production AWS stack
- [ ] Confirm S3 Block Public Access is enabled
- [ ] Confirm S3 CORS contains only the frontend origin
- [ ] Confirm API CORS contains only the frontend origin
- [ ] Confirm an unsupported MIME type is rejected
- [ ] Confirm an object larger than 10 MB is rejected
- [ ] Confirm submission fails unless both objects exist
- [ ] Confirm gallery output never contains an original URL
- [ ] Confirm original URL expires after two minutes
- [ ] Confirm delete returns 401 without a Cognito token
- [ ] Confirm public endpoints return 410 after the closing timestamp
- [ ] Configure AWS Budget alerts before production deployment

## Upload

- [ ] Select one photo
- [ ] Select five photos
- [ ] Attempt six photos
- [ ] Add photos in two separate selections without exceeding five
- [ ] Remove a selected photo
- [ ] Duplicate-file warning
- [ ] JPG from iPhone
- [ ] JPG from Android
- [ ] PNG
- [ ] WebP
- [ ] HEIC warning
- [ ] Empty file rejection
- [ ] File larger than 10 MB rejection
- [ ] Optional name blank
- [ ] Optional message blank
- [ ] Albanian characters
- [ ] Emoji
- [ ] 40-character name limit
- [ ] 120-character message limit
- [ ] Original remains downloadable
- [ ] Optimized image is used in gallery
- [ ] Success hearts display once
- [ ] Upload-another action resets the form

## Gallery

- [ ] Empty state
- [ ] Upload order is oldest to newest
- [ ] Mosaic works on mobile
- [ ] Mosaic works on desktop
- [ ] Portrait photo
- [ ] Landscape photo
- [ ] Very tall photo
- [ ] Photo modal closes by X
- [ ] Photo modal closes by backdrop
- [ ] Photo modal closes with Escape
- [ ] Download action is available only inside modal
- [ ] Original filename is retained
- [ ] Live statistics update
- [ ] Cross-tab refresh works

## Slideshow

- [ ] Empty state
- [ ] One photo
- [ ] Many photos
- [ ] Queue follows upload order
- [ ] New upload joins without page reload
- [ ] Portrait photo uses contain behavior
- [ ] Landscape photo uses contain behavior
- [ ] Name/message occupies no more than two lines
- [ ] QR code opens the correct main URL
- [ ] Pause and play
- [ ] Keyboard arrows
- [ ] F key/full-screen button
- [ ] Featured moment remains longer
- [ ] Thank-you mode with `?thankyou=1`
- [ ] Thank-you mode continues back to photos

## Devices and venue

- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Laptop Chrome
- [ ] Projector or television resolution
- [ ] Venue Wi-Fi
- [ ] Mobile hotspot fallback
- [ ] Laptop sleep disabled
- [ ] Charger and HDMI adapter prepared
- [ ] Printed QR tested from table distance
- [ ] Printed QR tested from display distance
