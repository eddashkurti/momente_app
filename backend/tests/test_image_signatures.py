import os
import sys
import unittest
from pathlib import Path

os.environ.setdefault("TABLE_NAME", "test-table")
os.environ.setdefault("BUCKET_NAME", "test-bucket")
sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from common.image_signatures import detect_image_content_type  # noqa: E402


def ftyp(major_brand, compatible_brand=b"mif1"):
    return (
        b"\x00\x00\x00\x18ftyp"
        + major_brand
        + b"\x00\x00\x00\x00"
        + compatible_brand
    )


class ImageSignatureTests(unittest.TestCase):
    def test_detects_common_and_camera_formats(self):
        samples = {
            b"\xff\xd8\xff\xe1": "image/jpeg",
            b"\x89PNG\r\n\x1a\n": "image/png",
            b"RIFF\x00\x00\x00\x00WEBP": "image/webp",
            b"GIF89a": "image/gif",
            b"BM\x00\x00": "image/bmp",
            b"II*\x00": "image/tiff",
            b"\xff\x0a": "image/jxl",
            b"\xffO\xffQ": "image/jp2",
            b"qoif": "image/qoi",
            b"8BPS": "image/vnd.adobe.photoshop",
        }
        for data, expected in samples.items():
            with self.subTest(expected=expected):
                self.assertEqual(detect_image_content_type(data), expected)

    def test_detects_heic_heif_and_avif_brands(self):
        self.assertEqual(detect_image_content_type(ftyp(b"heic")), "image/heic")
        self.assertEqual(detect_image_content_type(ftyp(b"mif1")), "image/heif")
        self.assertEqual(detect_image_content_type(ftyp(b"avif")), "image/avif")

    def test_rejects_unknown_binary_data(self):
        self.assertIsNone(detect_image_content_type(b"MZ\x90\x00"))


if __name__ == "__main__":
    unittest.main()
