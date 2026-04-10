const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Job = require('../models/Job');
const Application = require('../models/Application');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'jobs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname || '');
    const safeBase = path.basename(file.originalname || 'attachment', ext);
    const timestamp = Date.now();
    cb(null, safeBase.replace(/[^a-zA-Z0-9-_]/g, '') + '-' + timestamp + ext);
  }
});

const upload = multer({ storage: storage });

function ensureRecruiter(req, res, next) {
  if (req.user && req.user.role === 'recruiter') {
    return next();
  }
  return res.status(403).json({ error: 'Recruiter access required' });
}

function ensureCandidate(req, res, next) {
  if (req.user && req.user.role === 'candidate') {
    return next();
  }
  return res.status(403).json({ error: 'Candidate access required' });
}

router.post('/', authMiddleware, ensureRecruiter, upload.single('attachment'), async function(req, res, next) {
  try {
    let skills = req.body.skills;
    if (typeof skills === 'string') {
      skills = skills.split(',').map(function(item) {
        return item.trim();
      }).filter(Boolean);
    }

    const jobData = {
      title: req.body.title,
      type: req.body.type,
      company: req.body.company,
      location: req.body.location,
      description: req.body.description,
      skills: skills,
      recruiter: req.user.id
    };

    if (!jobData.title || !jobData.type || !jobData.company) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (req.file) {
      jobData.attachment = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: '/uploads/jobs/' + req.file.filename
      };
    }

    const job = await Job.create(jobData);
    res.status(201).json({ job: job });
  } catch (err) {
    next(err);
  }
});

router.get('/', authMiddleware, async function(req, res, next) {
  try {
    const query = { status: 'open' };

    // If recruiter, show their jobs; if candidate, show all jobs
    if (req.user.role === 'recruiter') {
      query.recruiter = req.user.id;
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    if (req.query.title) {
      query.title = { $regex: req.query.title, $options: 'i' };
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 }).lean();
    res.json({ jobs: jobs });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authMiddleware, async function(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job || job.status !== 'open') {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Recruiters can only view their own jobs, candidates can view all
    if (req.user.role === 'recruiter' && job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ job: job });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, ensureRecruiter, async function(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove associated attachment file if present.
    if (job.attachment && job.attachment.url) {
      const attachmentPath = path.join(__dirname, '..', 'public', job.attachment.url.replace(/^\//, ''));
      if (fs.existsSync(attachmentPath)) {
        fs.unlinkSync(attachmentPath);
      }
    }

    await Application.deleteMany({ job: job._id });
    await Job.deleteOne({ _id: job._id });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
