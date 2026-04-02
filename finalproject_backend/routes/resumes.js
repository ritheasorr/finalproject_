const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const Resume = require('../models/Resume');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:5001';

function ensureCandidate(req, res, next) {
  if (req.user && req.user.role === 'candidate') return next();
  return res.status(403).json({ error: 'Candidate access required' });
}

router.post('/', authMiddleware, ensureCandidate, upload.single('resume'), async function(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    // Forward PDF to OCR service
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const ocrResponse = await fetch(`${OCR_SERVICE_URL}/extract`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    if (!ocrResponse.ok) {
      const err = await ocrResponse.json();
      return res.status(422).json({ error: err.error || 'OCR extraction failed' });
    }

    const { text } = await ocrResponse.json();

    const resume = await Resume.create({
      candidate: req.user.id,
      filename: req.file.originalname,
      parsedText: text
    });

    res.status(201).json({ resume });
  } catch (err) {
    next(err);
  }
});

router.get('/mine', authMiddleware, ensureCandidate, async function(req, res, next) {
  try {
    const resumes = await Resume.find({ candidate: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ resumes });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
