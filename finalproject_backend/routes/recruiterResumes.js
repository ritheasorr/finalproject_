const express = require('express');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const Application = require('../models/Application');
const Job = require('../models/Job');
const RecruiterSavedResume = require('../models/RecruiterSavedResume');

const router = express.Router();

function ensureRecruiter(req, res, next) {
  if (req.user && req.user.role === 'recruiter') {
    return next();
  }
  return res.status(403).json({ error: 'Recruiter access required' });
}

function makeFolderSlug(folderName) {
  return String(folderName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function makeSafeFilenameBase(name) {
  return String(name || 'resume')
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .slice(0, 80) || 'resume';
}

router.post('/save', authMiddleware, ensureRecruiter, async function(req, res, next) {
  try {
    const applicationId = req.body.applicationId;
    const folderName = String(req.body.folderName || '').trim();
    const note = String(req.body.note || '').trim();

    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId is required' });
    }

    if (!folderName) {
      return res.status(400).json({ error: 'folderName is required' });
    }

    const folderSlug = makeFolderSlug(folderName);
    if (!folderSlug) {
      return res.status(400).json({ error: 'Invalid folderName' });
    }

    const application = await Application.findById(applicationId).lean();
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const job = await Job.findById(application.job).select('recruiter').lean();
    if (!job || String(job.recruiter) !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!application.resume || !application.resume.url) {
      return res.status(400).json({ error: 'Application has no resume to save' });
    }

    const sourceRelative = String(application.resume.url).replace(/^\/+/, '');
    const sourcePath = path.join(__dirname, '..', 'public', sourceRelative);
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ error: 'Source resume file not found on server' });
    }

    const sourceExt = path.extname(sourcePath) || path.extname(application.resume.originalName || '') || '.pdf';
    const sourceBase = path.basename(application.resume.originalName || 'resume', path.extname(application.resume.originalName || ''));
    const safeBase = makeSafeFilenameBase(sourceBase);

    const folderPath = path.join(__dirname, '..', 'public', 'uploads', 'recruiter-resumes', req.user.id, folderSlug);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const savedFilename = `${safeBase}-${application._id}-${Date.now()}${sourceExt}`;
    const savedPath = path.join(folderPath, savedFilename);
    fs.copyFileSync(sourcePath, savedPath);

    const savedResumeUrl = `/uploads/recruiter-resumes/${req.user.id}/${folderSlug}/${savedFilename}`;

    const saved = await RecruiterSavedResume.findOneAndUpdate(
      {
        recruiter: req.user.id,
        application: application._id,
        folderSlug: folderSlug,
      },
      {
        recruiter: req.user.id,
        application: application._id,
        candidate: application.candidate,
        job: application.job,
        folderName: folderName,
        folderSlug: folderSlug,
        note: note,
        originalResumeUrl: application.resume.url,
        savedResumeUrl: savedResumeUrl,
        savedFilename: savedFilename,
        sourceResumeName: application.resume.originalName || '',
        sourceResumeMimeType: application.resume.mimeType || '',
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    )
      .populate('candidate', 'firstName lastName email avatarUrl')
      .populate('job', 'title company')
      .populate('application', 'aiScore status createdAt')
      .lean();

    return res.status(201).json({ savedResume: saved });
  } catch (err) {
    return next(err);
  }
});

router.get('/folders', authMiddleware, ensureRecruiter, async function(req, res, next) {
  try {
    const folders = await RecruiterSavedResume.aggregate([
      { $match: { recruiter: req.user._id } },
      {
        $group: {
          _id: '$folderSlug',
          folderName: { $first: '$folderName' },
          count: { $sum: 1 },
          updatedAt: { $max: '$updatedAt' },
        }
      },
      { $sort: { updatedAt: -1 } }
    ]);

    return res.json({ folders: folders.map(function(f) {
      return {
        folderSlug: f._id,
        folderName: f.folderName,
        count: f.count,
        updatedAt: f.updatedAt,
      };
    }) });
  } catch (err) {
    return next(err);
  }
});

router.get('/', authMiddleware, ensureRecruiter, async function(req, res, next) {
  try {
    const query = { recruiter: req.user.id };
    if (req.query.folderSlug) {
      query.folderSlug = String(req.query.folderSlug);
    }

    const savedResumes = await RecruiterSavedResume.find(query)
      .populate('candidate', 'firstName lastName email avatarUrl')
      .populate('job', 'title company')
      .populate('application', 'aiScore status createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ savedResumes });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id/note', authMiddleware, ensureRecruiter, async function(req, res, next) {
  try {
    const note = String(req.body.note || '').trim();

    const saved = await RecruiterSavedResume.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user.id },
      { note: note },
      { new: true }
    )
      .populate('candidate', 'firstName lastName email avatarUrl')
      .populate('job', 'title company')
      .populate('application', 'aiScore status createdAt')
      .lean();

    if (!saved) {
      return res.status(404).json({ error: 'Saved resume not found' });
    }

    return res.json({ savedResume: saved });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
