from flask import Flask, request, jsonify
import io
import os
from pathlib import Path
import numpy as np
import pdfplumber
import easyocr
from pdf2image import convert_from_bytes
from pdf2image.exceptions import PDFInfoNotInstalledError, PDFPageCountError, PDFSyntaxError

app = Flask(__name__)
ocr_reader = easyocr.Reader(['en'], gpu=False)

ALLOWED_EXTENSIONS = {'pdf'}
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_POPPLER_PATH = BASE_DIR / 'tools' / 'poppler' / 'poppler-24.08.0' / 'Library' / 'bin'
POPPLER_PATH = os.environ.get('POPPLER_PATH') or (str(DEFAULT_POPPLER_PATH) if DEFAULT_POPPLER_PATH.exists() else None)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def ocr_page(image):
    # EasyOCR expects path/bytes/numpy array; pdf2image yields PIL images.
    if hasattr(image, 'convert'):
        image = np.array(image.convert('RGB'))
    results = ocr_reader.readtext(image, detail=0)
    return ' '.join(results)


def extract_text_from_pdf(file):
    pdf_bytes = file.read()
    text = ''

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            if page_text:
                text += page_text + '\n'
                continue

            # Scanned page: convert to image and run EasyOCR.
            # If Poppler is unavailable, skip OCR fallback for this page.
            try:
                images = convert_from_bytes(
                    pdf_bytes,
                    first_page=i + 1,
                    last_page=i + 1,
                    poppler_path=POPPLER_PATH
                )
            except (PDFInfoNotInstalledError, PDFPageCountError, PDFSyntaxError, OSError):
                continue

            if images:
                try:
                    text += ocr_page(images[0]) + '\n'
                except Exception:
                    continue

    return text.strip()


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'popplerConfigured': bool(POPPLER_PATH),
        'popplerPath': POPPLER_PATH or '',
        'popplerExists': bool(POPPLER_PATH and Path(POPPLER_PATH).exists())
    })


@app.route('/extract', methods=['POST'])
def extract():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are supported'}), 400

    try:
        text = extract_text_from_pdf(file)
    except Exception:
        return jsonify({'error': 'Could not extract text from file'}), 422
    if not text.strip():
        return jsonify({'error': 'Could not extract text from file'}), 422

    return jsonify({'text': text})


if __name__ == '__main__':
    app.run(port=5001, debug=True)
