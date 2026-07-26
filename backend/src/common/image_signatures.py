def detect_image_content_type(data):
    if not isinstance(data, (bytes, bytearray)):
        return None
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data[:6] in {b"GIF87a", b"GIF89a"}:
        return "image/gif"
    if data[:2] == b"BM":
        return "image/bmp"
    if data[:4] in {b"II*\x00", b"MM\x00*"}:
        return "image/tiff"
    if data.startswith(b"\xff\x0a") or data.startswith(b"\x00\x00\x00\x0cJXL \r\n\x87\n"):
        return "image/jxl"
    if data.startswith(b"\x00\x00\x00\x0cjP  \r\n\x87\n") or data.startswith(b"\xffO\xffQ"):
        return "image/jp2"
    if data[:4] == b"qoif":
        return "image/qoi"
    if data[:4] == b"8BPS":
        return "image/vnd.adobe.photoshop"
    if data[:4] == b"\x00\x00\x01\x00":
        return "image/x-icon"
    return _detect_iso_base_media_type(data)


def _detect_iso_base_media_type(data):
    if data[4:8] != b"ftyp":
        return None
    brands = {
        data[offset : offset + 4]
        for offset in range(8, min(len(data), 80) - 3, 4)
    }
    if brands & {b"avif", b"avis"}:
        return "image/avif"
    if brands & {b"heic", b"heix", b"hevc", b"hevx", b"heim", b"heis", b"hevm", b"hevs"}:
        return "image/heic"
    if brands & {b"mif1", b"msf1"}:
        return "image/heif"
    return None
