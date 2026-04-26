const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const Application = require('../models/Application');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'applications');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function ensureCandidate(req, res, next) {
  if (req.user && req.user.role === 'candidate') {
    return next();
  }
  return res.status(403).json({ error: 'Candidate access required' });
}

function ensureRecruiter(req, res, next) {
  if (req.user && req.user.role === 'recruiter') {
    return next();
  }
  return res.status(403).json({ error: 'Recruiter access required' });
}

function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str) {
  const stop = new Set([
    'a','an','the','and','or','but','if','then','else','when','while','with','without','to','of','in','on','for','at','by','from',
    'is','are','was','were','be','been','being','as','it','this','that','these','those','you','your','we','our','they','their',
    'i','me','my','he','she','his','her','them','us','can','could','should','would','will','may','might','must','do','does','did'
  ]);
  const parts = normalizeText(str).split(' ').filter(Boolean);
  return parts
    .filter(function(t) {
      return t.length >= 2 && !stop.has(t);
    })
    .map(function(t) {
      const alias = {
        javascript: 'js',
        typescript: 'ts',
        nodejs: 'node',
        reactjs: 'react',
        restful: 'api',
        apis: 'api',
        mysql: 'database',
        postgresql: 'database',
        mongodb: 'database',
        nosql: 'database',
        ui: 'frontend',
        ux: 'frontend'
      };

      let token = alias[t] || t;
      if (token.endsWith('ies') && token.length > 5) {
        token = token.slice(0, -3) + 'y';
      } else if (token.endsWith('s') && token.length > 4 && !token.endsWith('ss')) {
        token = token.slice(0, -1);
      }
      return token;
    });
}

function extractJobKeywords(job) {
  const noisy = new Set([
    'role', 'overview', 'responsibility', 'responsibilities', 'looking', 'join', 'team',
    'work', 'working', 'real', 'world', 'experience', 'modern', 'preferred', 'basic',
    'understanding', 'knowledge', 'familiarity', 'related', 'field', 'developer', 'development'
  ]);

  const titleTokens = tokenize(job.title || '').filter(function(t) { return t.length >= 3; });
  const skillTokens = tokenize((job.skills || []).join(' ')).filter(function(t) { return t.length >= 3; });
  const descriptionTokens = tokenize(job.description || '').filter(function(t) { return t.length >= 3; });

  const ordered = [];
  const seen = new Set();
  [titleTokens, skillTokens, descriptionTokens].forEach(function(list) {
    list.forEach(function(t) {
      if (!seen.has(t) && !noisy.has(t)) {
        seen.add(t);
        ordered.push(t);
      }
    });
  });

  return ordered.slice(0, 60);
}

function extractRequirementKeywords(job) {
  const noisy = new Set(['preferred', 'basic', 'understanding', 'knowledge', 'familiarity', 'related', 'field']);
  const tokens = tokenize([job.title || '', (job.skills || []).join(' ')].join(' ')).filter(function(t) {
    return t.length >= 3 && !noisy.has(t);
  });
  return Array.from(new Set(tokens)).slice(0, 80);
}

function extractDescriptionKeywords(job) {
  const noisy = new Set([
    'role', 'overview', 'responsibility', 'responsibilities', 'looking', 'join', 'team',
    'work', 'working', 'real', 'world', 'experience', 'modern'
  ]);
  const tokens = tokenize(job.description || '').filter(function(t) {
    return t.length >= 3 && !noisy.has(t);
  });
  return Array.from(new Set(tokens)).slice(0, 80);
}

function buildPhrases(tokens, minSize, maxSize) {
  const phrases = [];
  for (let size = minSize; size <= maxSize; size += 1) {
    for (let i = 0; i <= tokens.length - size; i += 1) {
      phrases.push(tokens.slice(i, i + size).join(' '));
    }
  }
  return phrases;
}

function computeLexicalResumeScore(resumeText, job) {
  if (!job) return 0;

  const jobText = [job.title, job.company, job.location, job.description, (job.skills || []).join(' ')].filter(Boolean).join('\n');
  const resumeTokens = tokenize(resumeText);
  const jobTokens = tokenize(jobText);
  if (resumeTokens.length === 0 || jobTokens.length === 0) return 0;

  const resumeSet = new Set(resumeTokens);
  const jobSet = new Set(jobTokens);
  let intersection = 0;
  jobSet.forEach(function(tok) {
    if (resumeSet.has(tok)) intersection += 1;
  });

  const keywords = extractJobKeywords(job);
  const keywordMatches = keywords.filter(function(t) { return resumeSet.has(t); }).length;
  const keywordCoverage = keywords.length === 0 ? 0 : keywordMatches / keywords.length;

  const requirementKeywords = extractRequirementKeywords(job);
  const requirementMatches = requirementKeywords.filter(function(t) { return resumeSet.has(t); }).length;
  const requirementCoverage = requirementKeywords.length === 0 ? 0 : requirementMatches / requirementKeywords.length;

  const descriptionKeywords = extractDescriptionKeywords(job);
  const descriptionMatches = descriptionKeywords.filter(function(t) { return resumeSet.has(t); }).length;
  const descriptionCoverage = descriptionKeywords.length === 0 ? 0 : descriptionMatches / descriptionKeywords.length;

  // Requested weighting: description : requirement = 25 : 75
  const weightedRequirementCoverage = (descriptionCoverage * 0.25) + (requirementCoverage * 0.75);

  const titleTokens = tokenize(job.title || '').filter(function(t) { return t.length >= 3; });
  const titleMatch = titleTokens.filter(function(t) { return resumeSet.has(t); }).length;
  const titleCoverage = titleTokens.length === 0 ? 0 : titleMatch / titleTokens.length;

  const skillTokens = tokenize((job.skills || []).join(' ')).filter(function(t) { return t.length >= 3; });
  const skillMatch = skillTokens.filter(function(t) { return resumeSet.has(t); }).length;
  const skillCoverage = skillTokens.length === 0 ? 0 : skillMatch / skillTokens.length;

  const jobPhrases = buildPhrases(jobTokens.filter(function(t) { return t.length >= 3; }), 2, 3);
  const phraseCandidates = Array.from(new Set(jobPhrases)).slice(0, 120);
  const phraseMatches = phraseCandidates.filter(function(phrase) {
    return normalizeText(resumeText).includes(phrase);
  }).length;
  const phraseCoverage = phraseCandidates.length === 0 ? 0 : phraseMatches / phraseCandidates.length;

  const union = resumeSet.size + jobSet.size - intersection;
  const jaccard = union === 0 ? 0 : intersection / union;
  const recall = jobSet.size === 0 ? 0 : intersection / jobSet.size;

  // Favor matching required signals and semantic phrase overlap; reduce punishment
  // from long descriptions by lowering strict union-heavy weight.
  const blended =
    (jaccard * 0.10) +
    (recall * 0.25) +
    (weightedRequirementCoverage * 0.30) +
    (titleCoverage * 0.15) +
    (skillCoverage * 0.15) +
    (phraseCoverage * 0.05);

  let score = Math.round(blended * 100);

  // Reward clearly relevant resumes even when job posts are verbose.
  if (keywordCoverage >= 0.20) {
    score += 6;
  }
  if (skillCoverage >= 0.20) {
    score += 6;
  }
  if (titleCoverage >= 0.30) {
    score += 4;
  }

  if (score > 0 && score < 30 && (keywordCoverage >= 0.20 || skillCoverage >= 0.20 || recall >= 0.25)) {
    score += 6;
  }

  return Math.min(100, Math.max(0, score));
}

async function computeGeminiResumeScore(resumeText, job) {
  if (!GEMINI_API_KEY || !resumeText || !job) {
    return null;
  }

  const requirements = Array.isArray(job.skills) ? job.skills : [];
  const prompt = [
    'You are an expert technical recruiter.',
    'Task: evaluate how suitable this candidate is for this role based on resume text and job details.',
    'Scoring scale: 0 to 100.',
    'Scoring policy:',
    '- Reward direct skill and experience matches strongly.',
    '- Be lenient with wording differences and synonyms.',
    '- Do not over-penalize missing generic or boilerplate terms.',
    '- Prioritize practical relevance to the role requirements.',
    'Return ONLY JSON: {"score": <integer 0-100>, "reason": "<short reason>"}',
    '',
    `JOB TITLE: ${job.title || ''}`,
    `JOB DESCRIPTION: ${job.description || ''}`,
    `JOB REQUIREMENTS: ${requirements.join(' | ')}`,
    '',
    `RESUME EXTRACTED TEXT: ${(resumeText || '').slice(0, 14000)}`
  ].join('\n');

  const models = [];
  [
    GEMINI_MODEL,
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ].forEach(function(model) {
    if (model && !models.includes(model)) {
      models.push(model);
    }
  });

  function parseScore(rawText) {
    const cleaned = String(rawText || '').replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      const fromJson = Number(parsed && parsed.score);
      if (Number.isFinite(fromJson)) {
        return Math.min(100, Math.max(0, Math.round(fromJson)));
      }
    } catch {
      // Continue with regex fallback.
    }

    const m = cleaned.match(/"?score"?\s*:\s*(\d{1,3})/i) || cleaned.match(/\b(\d{1,3})\b/);
    if (!m) return null;
    const n = Number(m[1]);
    if (!Number.isFinite(n)) return null;
    return Math.min(100, Math.max(0, Math.round(n)));
  }

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            maxOutputTokens: 200
          },
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!resp.ok) {
        continue;
      }

      const data = await resp.json();
      const text = (((data || {}).candidates || [])[0] || {}).content;
      const raw = (((text || {}).parts || [])[0] || {}).text || '';
      const parsedScore = parseScore(raw);
      if (parsedScore !== null) {
        return parsedScore;
      }
    } catch {
      // Try next model.
    }
  }

  return null;
}

async function computeResumeScore(resumeText, job) {
  const lexicalScore = computeLexicalResumeScore(resumeText, job);

  // Gemini is the primary semantic scorer; lexical score remains an anchor/fallback.
  const geminiScore = await computeGeminiResumeScore(resumeText, job);
  if (geminiScore === null) {
    return lexicalScore;
  }

  return Math.round((lexicalScore * 0.15) + (geminiScore * 0.85));
}

async function extractTextFromPdfBuffer(buffer, originalName, mimeType) {
  if (!OCR_SERVICE_URL) {
    return '';
  }

  const form = new FormData();
  form.append('file', buffer, {
    filename: originalName || 'resume.pdf',
    contentType: mimeType || 'application/pdf'
  });

  const ocrResponse = await fetch(`${OCR_SERVICE_URL}/extract`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  });

  if (!ocrResponse.ok) {
    // If OCR endpoint is unavailable (misconfigured URL/service down), do not block submission.
    if (ocrResponse.status === 404 || ocrResponse.status >= 500) {
      return '';
    }

    let errJson = null;
    try {
      errJson = await ocrResponse.json();
    } catch {
      // ignore
    }
    const msg = (errJson && errJson.error) ? errJson.error : 'OCR extraction failed';
    const error = new Error(msg);
    error.status = 422;
    throw error;
  }

  const { text } = await ocrResponse.json();
  return text || '';
}

function extractTextFromTxtBuffer(buffer) {
  try {
    const text = buffer.toString('utf-8');
    return text.trim();
  } catch (err) {
    throw new Error('Failed to read text file');
  }
}

router.post('/', authMiddleware, ensureCandidate, upload.single('resume'), async function(req, res, next) {
  try {
    const jobId = req.body.jobId;
    const coverLetter = req.body.coverLetter;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    // Support both PDF and TXT files
    const isPdf = req.file.mimetype === 'application/pdf';
    const isTxt = req.file.mimetype === 'text/plain';

    if (!isPdf && !isTxt) {
      return res.status(400).json({ error: 'Only PDF and TXT files are supported' });
    }

    const job = await Job.findById(jobId);
    if (!job || job.status !== 'open') {
      return res.status(404).json({ error: 'Job not found or not open' });
    }

    const existingApplication = await Application.findOne({
      candidate: req.user.id,
      job: jobId
    });

    if (existingApplication) {
      return res.status(409).json({ error: 'You have already applied to this job' });
    }

    const safeOriginalBase = path.basename(req.file.originalname || 'resume', path.extname(req.file.originalname || ''));
    const timestamp = Date.now();
    const extension = isPdf ? '.pdf' : '.txt';
    const filename = safeOriginalBase.replace(/[^a-zA-Z0-9-_]/g, '') + '-' + req.user.id + '-' + timestamp + extension;
    const diskPath = path.join(uploadDir, filename);
    fs.writeFileSync(diskPath, req.file.buffer);

    // Extract text based on file type
    let resumeText;
    if (isPdf) {
      try {
        resumeText = await extractTextFromPdfBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
      } catch (ocrErr) {
        if (ocrErr && ocrErr.status === 422) {
          return res.status(422).json({ error: ocrErr.message || 'OCR extraction failed' });
        }
        resumeText = '';
      }
    } else {
      resumeText = extractTextFromTxtBuffer(req.file.buffer);
    }

    const aiScore = await computeResumeScore(resumeText, job);

    const application = await Application.create({
      candidate: req.user.id,
      job: jobId,
      coverLetter: coverLetter,
      resume: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: '/uploads/applications/' + filename
      },
      resumeText: resumeText,
      aiScore: aiScore
    });

    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company type location status')
      .lean();

    res.status(201).json({ application: populatedApplication });
  } catch (err) {
    next(err);
  }
});

router.get('/my', authMiddleware, ensureCandidate, async function(req, res, next) {
  try {
    const applications = await Application.find({ candidate: req.user.id })
      .populate('job', 'title company type location status')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ applications: applications });
  } catch (err) {
    next(err);
  }
});

router.get('/received', authMiddleware, ensureRecruiter, async function(req, res, next) {
  try {
    const jobIds = await Job.find({ recruiter: req.user.id }).distinct('_id');
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('job', 'title company type location status')
      .populate('candidate', 'firstName lastName email phoneNumber school')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ applications: applications });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authMiddleware, ensureRecruiter, async function(req, res, next) {
  try {
    const nextStatus = req.body.status;
    if (!['hired', 'rejected'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id).populate('job', 'recruiter');
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!application.job || application.job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Recruiter access required' });
    }

    application.status = nextStatus;
    await application.save();

    res.json({ application: application });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
