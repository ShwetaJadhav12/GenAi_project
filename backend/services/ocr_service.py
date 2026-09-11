"""
OCR Service
Abstracts Tesseract so it can be replaced with another engine later.
If Tesseract is not installed, returns a clear error message.
"""
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Allow overriding Tesseract path via env variable
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "tesseract")


def _configure_pytesseract():
    try:
        import pytesseract
        if TESSERACT_CMD != "tesseract":
            pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
        return pytesseract
    except ImportError:
        return None


def extract_text_from_image(image_path: str) -> dict:
    """
    Extract text from an image file.
    Returns {"success": bool, "text": str, "error": str|None}
    Designed to be swappable — replace the body to use a different OCR engine.
    """
    if not Path(image_path).exists():
        return {"success": False, "text": "", "error": "Image file not found."}

    pytesseract = _configure_pytesseract()
    if pytesseract is None:
        return {
            "success": False,
            "text": "",
            "error": (
                "pytesseract is not installed. Run: pip install pytesseract\n"
                "Also ensure Tesseract OCR is installed on your system: "
                "https://github.com/UB-Mannheim/tesseract/wiki"
            ),
        }

    try:
        from PIL import Image
        img = Image.open(image_path)
        # Use OEM 3 (default) + PSM 6 (assume uniform block of text)
        custom_config = r"--oem 3 --psm 6"
        text = pytesseract.image_to_string(img, config=custom_config)
        text = text.strip()
        if not text:
            return {
                "success": False,
                "text": "",
                "error": "No text could be extracted from the image. Try a clearer image.",
            }
        return {"success": True, "text": text, "error": None}
    except Exception as e:
        logger.exception("OCR failed")
        return {"success": False, "text": "", "error": str(e)}


def extract_text_from_bytes(image_bytes: bytes, filename: str) -> dict:
    """Extract text from raw image bytes (e.g. uploaded file)."""
    import tempfile
    suffix = Path(filename).suffix.lower()
    if suffix not in (".jpg", ".jpeg", ".png"):
        return {
            "success": False,
            "text": "",
            "error": f"Unsupported image type '{suffix}'. Use JPG, JPEG, or PNG.",
        }
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name
    try:
        result = extract_text_from_image(tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
    return result
