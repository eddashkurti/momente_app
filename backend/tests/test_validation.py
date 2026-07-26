import os
import sys
import unittest
from pathlib import Path

os.environ.setdefault("TABLE_NAME", "test-table")
os.environ.setdefault("BUCKET_NAME", "test-bucket")
sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from common.validation import (  # noqa: E402
    ValidationError,
    validate_event,
    validate_presign_files,
    validate_submission,
)


def valid_file(**overrides):
    value = {
        "clientId": "client-1",
        "originalFileName": "IMG_1234.JPG",
        "originalContentType": "image/jpeg",
        "originalSize": 1024,
        "optimizedContentType": "image/jpeg",
        "optimizedSize": 512,
    }
    value.update(overrides)
    return value


class ValidationTests(unittest.TestCase):
    def test_accepts_supported_upload(self):
        self.assertEqual(len(validate_presign_files([valid_file()])), 1)

    def test_rejects_more_than_five_files(self):
        files = [valid_file(clientId=f"client-{index}") for index in range(6)]
        with self.assertRaises(ValidationError):
            validate_presign_files(files)

    def test_accepts_capability_based_raster_types(self):
        for content_type in (
            "image/heic",
            "image/heif-sequence",
            "image/avif",
            "image/tiff",
            "image/x-camera-raw",
            "application/octet-stream",
        ):
            with self.subTest(content_type=content_type):
                validate_presign_files([valid_file(originalContentType=content_type)])

    def test_rejects_non_image_type(self):
        with self.assertRaises(ValidationError):
            validate_presign_files([valid_file(originalContentType="application/pdf")])

    def test_rejects_svg_active_content(self):
        with self.assertRaises(ValidationError):
            validate_presign_files([valid_file(originalContentType="image/svg+xml")])

    def test_rejects_oversized_original(self):
        with self.assertRaises(ValidationError):
            validate_presign_files([valid_file(originalSize=10 * 1024 * 1024 + 1)])

    def test_rejects_path_traversal_filename(self):
        with self.assertRaises(ValidationError):
            validate_presign_files([valid_file(originalFileName="../photo.jpg")])

    def test_accepts_international_filename_with_combining_marks(self):
        filename = "تَذْكِرَةٌ قُرْآنِيَّةٌ مِنَ الْأَنْوَاءِ.png"
        result = validate_presign_files(
            [valid_file(originalFileName=filename, originalContentType="image/png")]
        )
        self.assertEqual(result[0]["originalFileName"], filename)

    def test_rejects_windows_path_filename(self):
        with self.assertRaises(ValidationError):
            validate_presign_files([valid_file(originalFileName=r"..\photo.jpg")])

    def test_rejects_unknown_event(self):
        with self.assertRaises(ValidationError):
            validate_event("another-event")

    def test_accepts_submission_boundaries(self):
        photos = [
            {
                "photoId": "photo-1",
                "guestName": "A" * 40,
                "message": "M" * 120,
                "uploaderSessionId": "session-123",
            }
        ]
        self.assertEqual(len(validate_submission(photos)), 1)

    def test_rejects_duplicate_submission_ids(self):
        photo = {
            "photoId": "photo-1",
            "guestName": "",
            "message": "",
            "uploaderSessionId": "session-123",
        }
        with self.assertRaises(ValidationError):
            validate_submission([photo, photo.copy()])


if __name__ == "__main__":
    unittest.main()
