from flask import Flask, request, jsonify
import os
import pdfplumber

app = Flask(__name__)

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_pdf(file):
    text = ''
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + '\n'
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
