from flask import Flask, request, jsonify
import io
import os
import pdfplumber
import easyocr
from pdf2image import convert_from_bytes

app = Flask(__name__)
ocr_reader = easyocr.Reader(['en'], gpu=False)

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def ocr_page(image):
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
            else:
                # Scanned page — convert to image and run EasyOCR
                images = convert_from_bytes(pdf_bytes, first_page=i + 1, last_page=i + 1)
                if images:
                    text += ocr_page(images[0]) + '\n'

    return text.strip()


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/extract', methods=['POST'])
def extract():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are supported'}), 400

    text = extract_text_from_pdf(file)
    if not text.strip():
        return jsonify({'error': 'Could not extract text from file'}), 422

    return jsonify({'text': text})


if __name__ == '__main__':
    app.run(port=5001, debug=True)
