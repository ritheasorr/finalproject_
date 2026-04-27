var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var multer = require('multer');
var authMiddleware = require('../middleware/auth');
var User = require('../models/User');
var Job = require('../models/Job');
var Application = require('../models/Application');

var avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

var avatarUploadRoot = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
if (!fs.existsSync(avatarUploadRoot)) {
  fs.mkdirSync(avatarUploadRoot, { recursive: true });
}

router.get('/me', authMiddleware, function(req, res) {
  User.findById(req.user.id).lean()
    .then(function(user) {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({
        user: {
          id: user._id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          role: user.role,
          phoneNumber: user.phoneNumber || '',
          school: user.school || '',
          location: user.location || '',
          professionalTitle: user.professionalTitle || '',
          bio: user.bio || '',
          skills: Array.isArray(user.skills) ? user.skills : [],
          experienceEntries: Array.isArray(user.experienceEntries) ? user.experienceEntries : [],
          educationEntries: Array.isArray(user.educationEntries) ? user.educationEntries : [],
          portfolio: user.portfolio || { github: '', linkedin: '', website: '' },
          avatarUrl: user.avatarUrl || '',
          coverImageUrl: user.coverImageUrl || '',
          resumeUrl: user.resumeUrl || '',
          resumeFilename: user.resumeFilename || '',
          resumeExtractedText: user.resumeExtractedText || '',
          resumeUpdatedAt: user.resumeUpdatedAt || null,
          careerInsights: Array.isArray(user.careerInsights) ? user.careerInsights : [],
          savedJobs: Array.isArray(user.savedJobs) ? user.savedJobs : []
        }
      });
    })
    .catch(function() {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    });
});

router.patch('/me', authMiddleware, async function(req, res, next) {
  try {
    const allowed = {};
    const stringFields = [
      'firstName',
      'lastName',
      'phoneNumber',
      'school',
      'location',
      'professionalTitle',
      'bio',
      'avatarUrl',
      'coverImageUrl',
      'resumeUrl',
      'resumeFilename',
      'resumeExtractedText'
    ];

    stringFields.forEach(function(key) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        const value = req.body[key];
        if (typeof value === 'string') {
          allowed[key] = value.trim();
        }
      }
    });

    if (Array.isArray(req.body.skills)) {
      allowed.skills = req.body.skills
        .map(function(item) { return String(item || '').trim(); })
        .filter(Boolean)
        .slice(0, 50);
    }

    if (Array.isArray(req.body.experienceEntries)) {
      allowed.experienceEntries = req.body.experienceEntries
        .map(function(entry) {
          return {
            role: String((entry && entry.role) || '').trim(),
            company: String((entry && entry.company) || '').trim(),
            period: String((entry && entry.period) || '').trim(),
            description: String((entry && entry.description) || '').trim()
          };
        })
        .filter(function(entry) {
          return entry.role || entry.company || entry.period || entry.description;
        })
        .slice(0, 20);
    }

    if (Array.isArray(req.body.educationEntries)) {
      allowed.educationEntries = req.body.educationEntries
        .map(function(entry) {
          return {
            school: String((entry && entry.school) || '').trim(),
            degree: String((entry && entry.degree) || '').trim(),
            year: String((entry && entry.year) || '').trim()
          };
        })
        .filter(function(entry) {
          return entry.school || entry.degree || entry.year;
        })
        .slice(0, 20);
    }

    if (req.body.portfolio && typeof req.body.portfolio === 'object') {
      allowed.portfolio = {
        github: String(req.body.portfolio.github || '').trim(),
        linkedin: String(req.body.portfolio.linkedin || '').trim(),
        website: String(req.body.portfolio.website || '').trim()
      };
    }

    if (Array.isArray(req.body.careerInsights)) {
      allowed.careerInsights = req.body.careerInsights
        .map(function(item) { return String(item || '').trim(); })
        .filter(Boolean)
        .slice(0, 6);
    }

    if (Array.isArray(req.body.savedJobs)) {
      allowed.savedJobs = req.body.savedJobs
        .map(function(id) { return String(id || '').trim(); })
        .filter(Boolean)
        .slice(0, 100);
    }

    if (req.body.resumeUpdatedAt) {
      const parsedDate = new Date(req.body.resumeUpdatedAt);
      if (!Number.isNaN(parsedDate.getTime())) {
        allowed.resumeUpdatedAt = parsedDate;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: allowed },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        phoneNumber: updatedUser.phoneNumber || '',
        school: updatedUser.school || '',
        location: updatedUser.location || '',
        professionalTitle: updatedUser.professionalTitle || '',
        bio: updatedUser.bio || '',
        skills: Array.isArray(updatedUser.skills) ? updatedUser.skills : [],
        experienceEntries: Array.isArray(updatedUser.experienceEntries) ? updatedUser.experienceEntries : [],
        educationEntries: Array.isArray(updatedUser.educationEntries) ? updatedUser.educationEntries : [],
        portfolio: updatedUser.portfolio || { github: '', linkedin: '', website: '' },
        avatarUrl: updatedUser.avatarUrl || '',
        coverImageUrl: updatedUser.coverImageUrl || '',
        resumeUrl: updatedUser.resumeUrl || '',
        resumeFilename: updatedUser.resumeFilename || '',
        resumeExtractedText: updatedUser.resumeExtractedText || '',
        resumeUpdatedAt: updatedUser.resumeUpdatedAt || null,
        careerInsights: Array.isArray(updatedUser.careerInsights) ? updatedUser.careerInsights : [],
        savedJobs: Array.isArray(updatedUser.savedJobs) ? updatedUser.savedJobs : []
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/me/avatar', authMiddleware, avatarUpload.single('avatar'), async function(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar file uploaded' });
    }

    var mime = String(req.file.mimetype || '').toLowerCase();
    var allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(mime)) {
      return res.status(400).json({ error: 'Only JPG, PNG, and WEBP images are supported' });
    }

    var userFolder = path.join(avatarUploadRoot, String(req.user.id));
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    var ext = mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : '.jpg';
    var filename = 'avatar-' + Date.now() + ext;
    var absolutePath = path.join(userFolder, filename);
    fs.writeFileSync(absolutePath, req.file.buffer);
    var avatarUrl = '/uploads/avatars/' + req.user.id + '/' + filename;

    var existing = await User.findById(req.user.id).select('avatarUrl').lean();
    if (existing && existing.avatarUrl && String(existing.avatarUrl).startsWith('/uploads/avatars/')) {
      var relativeExisting = String(existing.avatarUrl).replace(/^\/+/, '');
      var oldPath = path.join(__dirname, '..', 'public', relativeExisting);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch {
          // ignore old file cleanup errors
        }
      }
    }

    var user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatarUrl: avatarUrl } },
      { new: true, runValidators: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ avatarUrl: user.avatarUrl || '' });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/public', authMiddleware, async function(req, res, next) {
  try {
    const recruiter = await User.findById(req.params.id)
      .select('firstName lastName email phoneNumber role')
      .lean();

    if (!recruiter || recruiter.role !== 'recruiter') {
      return res.status(404).json({ error: 'Recruiter not found' });
    }

    const activeJobs = await Job.find({ recruiter: recruiter._id, status: 'open' })
      .select('title company location createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const recruiterJobIds = activeJobs.map(function(job) { return job._id; });
    const totalApplicants = recruiterJobIds.length
      ? await Application.countDocuments({ job: { $in: recruiterJobIds } })
      : 0;

    const company = activeJobs.find(function(job) { return !!job.company; })?.company || 'CareerLaunch Hiring Team';
    const location = activeJobs.find(function(job) { return !!job.location; })?.location || '';

    return res.json({
      recruiter: {
        id: recruiter._id,
        fullName: [recruiter.firstName, recruiter.lastName].filter(Boolean).join(' ').trim(),
        firstName: recruiter.firstName || '',
        lastName: recruiter.lastName || '',
        email: recruiter.email,
        phoneNumber: recruiter.phoneNumber || '',
        company: company,
        location: location,
        totalActiveJobs: activeJobs.length,
        totalApplicants: totalApplicants,
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
