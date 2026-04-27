const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { computeResumeScoreDetailed } = require('../lib/resumeScoring');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL;

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
    const resumeSource = req.body.resumeSource === 'vault' ? 'vault' : 'upload';

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
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

    let resumeText = '';
    let resumeMeta = {
      originalName: '',
      mimeType: '',
      size: 0,
      url: ''
    };

    if (resumeSource === 'vault') {
      const candidate = await User.findById(req.user.id).lean();
      if (!candidate || !candidate.resumeUrl || !candidate.resumeFilename) {
        return res.status(400).json({ error: 'No resume found in your profile vault' });
      }
      resumeText = candidate.resumeExtractedText || '';
      resumeMeta = {
        originalName: candidate.resumeFilename,
        mimeType: 'application/pdf',
        size: 0,
        url: candidate.resumeUrl
      };
    } else {
      if (!req.file) {
        return res.status(400).json({ error: 'Resume file is required' });
      }

      const isPdf = req.file.mimetype === 'application/pdf';
      const isTxt = req.file.mimetype === 'text/plain';
      if (!isPdf && !isTxt) {
        return res.status(400).json({ error: 'Only PDF and TXT files are supported' });
      }

      const safeOriginalBase = path.basename(req.file.originalname || 'resume', path.extname(req.file.originalname || ''));
      const timestamp = Date.now();
      const extension = isPdf ? '.pdf' : '.txt';
      const filename = safeOriginalBase.replace(/[^a-zA-Z0-9-_]/g, '') + '-' + req.user.id + '-' + timestamp + extension;
      const diskPath = path.join(uploadDir, filename);
      fs.writeFileSync(diskPath, req.file.buffer);

      if (isPdf) {
        try {
          resumeText = await extractTextFromPdfBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
        } catch (ocrErr) {
          if (ocrErr && ocrErr.status === 422) {
            return res.status(422).json({ error: ocrErr.message || 'OCR extraction failed' });
          }
          resumeText = '';
        }
        if (!String(resumeText || '').trim()) {
          return res.status(422).json({
            error: 'Could not extract text from this PDF resume. Please upload a text-based PDF/TXT resume or ensure OCR service dependencies are installed.'
          });
        }
      } else {
        resumeText = extractTextFromTxtBuffer(req.file.buffer);
      }

      resumeMeta = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: '/uploads/applications/' + filename
      };
    }

    const scoreResult = await computeResumeScoreDetailed(resumeText, job);

    const application = await Application.create({
      candidate: req.user.id,
      job: jobId,
      coverLetter: coverLetter,
      resume: resumeMeta,
      resumeText: resumeText,
      aiScore: scoreResult.score,
      aiExplanation: scoreResult.aiExplanation || '',
      aiMatchLevel: scoreResult.aiMatchLevel || scoreResult.matchLevel || 'unknown',
      aiMatchedSkills: Array.isArray(scoreResult.aiMatchedSkills) ? scoreResult.aiMatchedSkills : [],
      aiMissingSkills: Array.isArray(scoreResult.aiMissingSkills) ? scoreResult.aiMissingSkills : [],
      aiRecommendation: scoreResult.aiRecommendation || ''
    });

    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company type location status')
      .lean();

    // Backward-compatible response with optional explainability payload.
    populatedApplication.aiScoreReason = scoreResult.reason || '';
    populatedApplication.aiScoreBreakdown = scoreResult.breakdown || {};
    populatedApplication.aiScoreMatchLevel = scoreResult.matchLevel || 'partial';

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
      .populate('candidate', 'firstName lastName email phoneNumber school avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ applications: applications });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/re-evaluate', authMiddleware, ensureRecruiter, async function(req, res, next) {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title company type location status recruiter description skills');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!application.job || application.job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Recruiter access required' });
    }

    if (!String(application.resumeText || '').trim()) {
      return res.status(422).json({ error: 'Resume text unavailable. Ask candidate to re-upload a readable resume.' });
    }

    const scoreResult = await computeResumeScoreDetailed(application.resumeText, application.job);
    application.aiScore = scoreResult.score;
    application.aiExplanation = scoreResult.aiExplanation || '';
    application.aiMatchLevel = scoreResult.aiMatchLevel || scoreResult.matchLevel || 'unknown';
    application.aiMatchedSkills = Array.isArray(scoreResult.aiMatchedSkills) ? scoreResult.aiMatchedSkills : [];
    application.aiMissingSkills = Array.isArray(scoreResult.aiMissingSkills) ? scoreResult.aiMissingSkills : [];
    application.aiRecommendation = scoreResult.aiRecommendation || '';
    await application.save();

    const refreshed = await Application.findById(application._id)
      .populate('job', 'title company type location status')
      .populate('candidate', 'firstName lastName email phoneNumber school avatarUrl')
      .lean();

    res.json({ application: refreshed });
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
