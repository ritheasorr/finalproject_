const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
const Resume = require('../models/Resume');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const resumeUploadRoot = path.join(__dirname, '..', 'public', 'uploads', 'resumes');

if (!fs.existsSync(resumeUploadRoot)) {
  fs.mkdirSync(resumeUploadRoot, { recursive: true });
}

function ensureCandidate(req, res, next) {
  if (req.user && req.user.role === 'candidate') return next();
  return res.status(403).json({ error: 'Candidate access required' });
}

function extractTextFromTxtBuffer(buffer) {
  try {
    return buffer.toString('utf-8').trim();
  } catch {
    return '';
  }
}

async function generateCareerInsightsFromGemini(resumeText) {
  if (!GEMINI_API_KEY || !resumeText) return null;

  const prompt = [
    'You are an expert career advisor.',
    '',
    'Analyze this candidate resume.',
    '',
    'Generate 3 concise personalized career insights.',
    '',
    'Focus on:',
    '- strengths',
    '- likely suitable job paths',
    '- missing high-value skills',
    '- profile improvements',
    '- practical next steps',
    '',
    'Tone:',
    'Encouraging, professional, concise.',
    '',
    'Return JSON:',
    '{',
    '  "insights": [',
    '    "...",',
    '    "...",',
    '    "..."',
    '  ]',
    '}',
    '',
    `RESUME TEXT: ${String(resumeText || '').slice(0, 12000)}`
  ].join('\n');

  const models = [];
  [GEMINI_MODEL, 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'].forEach(function(model) {
    if (model && !models.includes(model)) models.push(model);
  });

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0.2,
            topP: 0.85,
            maxOutputTokens: 260
          },
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!resp.ok) continue;

      const data = await resp.json();
      const text = ((((data || {}).candidates || [])[0] || {}).content || {}).parts || [];
      const raw = (text[0] && text[0].text) ? text[0].text : '';
      const cleaned = String(raw || '').replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && Array.isArray(parsed.insights)) {
        const insights = parsed.insights
          .map(function(item) { return String(item || '').trim(); })
          .filter(Boolean)
          .slice(0, 3);
        if (insights.length > 0) return insights;
      }
    } catch {
      // Try next fallback model.
    }
  }
  return null;
}

function generateFallbackInsights(resumeText) {
  const text = String(resumeText || '').toLowerCase();
  const hasReact = text.includes('react');
  const hasNext = text.includes('next');
  const hasNode = text.includes('node');
  const hasPython = text.includes('python');
  const hasSql = text.includes('sql') || text.includes('postgres');
  const hasFreelance = text.includes('freelance') || text.includes('project');

  const insights = [];
  if (hasReact || hasNext) {
    insights.push('Your resume shows strong frontend signals. Target Frontend Engineer roles and highlight shipped UI outcomes.');
  } else if (hasNode || hasPython) {
    insights.push('You have meaningful backend foundations. Emphasize APIs, architecture decisions, and measurable project impact.');
  } else {
    insights.push('Your profile can be strengthened by adding clearer technical project summaries with specific technologies used.');
  }

  if (!hasSql) {
    insights.push('Add SQL or PostgreSQL project experience to unlock more backend and full-stack opportunities.');
  } else {
    insights.push('Your database exposure is a strong asset. Add one production-like case study with data modeling details.');
  }

  if (hasFreelance) {
    insights.push('Your freelance/project work is valuable. Quantify outcomes (performance, users, revenue, time saved) for stronger credibility.');
  } else {
    insights.push('Add practical project highlights with concrete outcomes to improve recruiter confidence during screening.');
  }

  return insights.slice(0, 3);
}

router.post('/', authMiddleware, ensureCandidate, upload.single('resume'), async function(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const isPdf = req.file.mimetype === 'application/pdf';
    const isTxt = req.file.mimetype === 'text/plain';
    if (!isPdf && !isTxt) {
      return res.status(400).json({ error: 'Only PDF and TXT files are supported' });
    }

    const candidateFolder = path.join(resumeUploadRoot, String(req.user.id));
    if (!fs.existsSync(candidateFolder)) {
      fs.mkdirSync(candidateFolder, { recursive: true });
    }

    const safeOriginalBase = path.basename(req.file.originalname || 'resume', path.extname(req.file.originalname || ''));
    const ext = isPdf ? '.pdf' : '.txt';
    const filename = `${safeOriginalBase.replace(/[^a-zA-Z0-9-_]/g, '')}-${Date.now()}${ext}`;
    const diskPath = path.join(candidateFolder, filename);
    fs.writeFileSync(diskPath, req.file.buffer);
    const vaultUrl = `/uploads/resumes/${req.user.id}/${filename}`;

    let extractedText = '';
    if (isPdf) {
      if (OCR_SERVICE_URL) {
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
        if (ocrResponse.ok) {
          const parsed = await ocrResponse.json();
          extractedText = parsed && parsed.text ? String(parsed.text) : '';
        }
      }
      if (!String(extractedText || '').trim()) {
        return res.status(422).json({
          error: 'Could not extract text from this PDF resume. Please upload a text-based PDF/TXT resume or ensure OCR service dependencies are installed.'
        });
      }
    } else {
      extractedText = extractTextFromTxtBuffer(req.file.buffer);
    }

    const careerInsights = await generateCareerInsightsFromGemini(extractedText)
      || generateFallbackInsights(extractedText);

    const resume = await Resume.findOneAndUpdate(
      { candidate: req.user.id },
      {
        $set: {
          filename: req.file.originalname,
          parsedText: extractedText
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        resumeUrl: vaultUrl,
        resumeFilename: req.file.originalname,
        resumeExtractedText: extractedText,
        resumeUpdatedAt: new Date(),
        careerInsights: careerInsights
      }
    });

    res.status(201).json({
      resume: {
        id: resume._id,
        filename: resume.filename,
        extractedText: resume.parsedText,
        url: vaultUrl,
        updatedAt: resume.updatedAt
      },
      careerInsights: careerInsights
    });
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

router.get('/mine/current', authMiddleware, ensureCandidate, async function(req, res, next) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      resume: {
        url: user.resumeUrl || '',
        filename: user.resumeFilename || '',
        extractedText: user.resumeExtractedText || '',
        updatedAt: user.resumeUpdatedAt || null
      },
      careerInsights: Array.isArray(user.careerInsights) ? user.careerInsights : []
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/mine/current', authMiddleware, ensureCandidate, async function(req, res, next) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.resumeUrl) {
      const relativeResumePath = String(user.resumeUrl).replace(/^\/+/, '');
      const absolutePath = path.join(__dirname, '..', 'public', relativeResumePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        resumeUrl: '',
        resumeFilename: '',
        resumeExtractedText: '',
        resumeUpdatedAt: null,
        careerInsights: []
      }
    });
    await Resume.deleteMany({ candidate: req.user.id });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
