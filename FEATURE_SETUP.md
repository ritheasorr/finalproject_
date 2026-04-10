# Resume Upload & AI Scoring Feature - Setup & Testing Guide

This guide covers the complete resume upload, OCR extraction, and AI scoring feature implementation.

## What's Implemented

✅ **Jobseeker can upload resume** (PDF or TXT)  
✅ **OCR extracts text** from Resume (using external OCR service or direct text read)  
✅ **AI Score calculated** (token-based Jaccard similarity, 0-100%)  
✅ **Score displayed to recruiter** (color-coded in applications list)  
✅ **Resume download link** (available in expanded application view)  

## Architecture

### Backend Flow
```
Jobseeker upload resume (PDF/TXT)
      ↓
Backend receives file (multipart/form-data)
      ↓
Save file to disk (/public/uploads/applications/)
      ↓
Extract text:
  - PDF: OCR service (http://localhost:5001/extract)
  - TXT: Direct UTF-8 read
      ↓
Compute score (token matching: resume vs job description)
      ↓
Store in MongoDB:
  - resume (metadata & URL)
  - resumeText (extracted text)
  - aiScore (0-100)
      ↓
Return to frontend → redirect to dashboard
```

### Frontend Flow
```
Jobseeker: Selects job → Uploads resume/TXT → Writes cover letter → Submits
Recruiter: Views applications → Sees AI score (color-coded) → Expands → Views resume
```

## Prerequisites

- **MongoDB** running on `localhost:27017`
- **OCR Service** running on `localhost:5001` (for PDF extraction)
- **Node.js/npm** (backend)
- **Node.js/npm** (frontend for Next.js)

## Setup Instructions

### 1. Backend Setup

```bash
cd finalproject_backend

# Install dependencies
npm install

# Verify .env configuration
echo "Check finalproject_backend/.env for:"
echo "  MONGODB_URI=mongodb://localhost:27017/finalproject"
echo "  OCR_SERVICE_URL=http://localhost:5001"

# Start backend
npm start
# Backend runs on http://localhost:3001 (or check bin/www)
```

### 2. Frontend Setup

```bash
cd finalproject_frontend

# Install dependencies
npm install

# Set environment variable for API URL
# .env.local should have:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Start frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### 3. Start OCR Service (for PDF processing)

The OCR service is needed to extract text from PDF files. You need to have a separate service running:

```bash
# Option A: If you have the OCR service code
cd path-to-ocr-service
npm install
npm start  # Should run on port 5001

# Option B: If using a standalone OCR service
# Ensure it's accessible at http://localhost:5001/extract
```

**Note:** If OCR service is unavailable, PDF uploads will fail with a 422 error. TXT uploads will work fine.

### 4. Create uploads directory

```bash
# Make sure this directory exists (created automatically by the app)
mkdir -p finalproject_backend/public/uploads/applications
```

## Testing the Feature

### Test 1: Jobseeker Uploads TXT Resume

1. Go to `http://localhost:3000/login`
2. Login as a jobseeker
3. Click "Browse Jobs"
4. Click on a job
5. Upload a text file (`.txt`)
6. Write a cover letter
7. Click "Submit Application"
8. **Expected:** Success message, redirected to dashboard

### Test 2: Jobseeker Uploads PDF Resume

1. Same steps as Test 1
2. Upload a PDF file instead
3. **Expected:** 
   - Success (if OCR service is running)
   - Error "OCR extraction failed" (if OCR service is down)

### Test 3: Recruiter Views Score

1. Go to `http://localhost:3000/login`
2. Login as a recruiter
3. Go to "Dashboard"
4. Click on a job to view applications
5. **Expected:** 
   - See list of applications
   - Each shows AI score (0-100%)
   - Color-coded: Green (85+), Blue (70-84), Amber (50-69), Red (<50)
   - Sorted by score (highest first)

### Test 4: View Resume

1. Continue from Test 3
2. Click on an application to expand
3. Click "Download Resume" link
4. **Expected:** Resume file downloads (PDF or TXT)

### Test 5: Verify Score Calculation

Check the score makes sense:
- Resume with many job keywords → High score (70-100%)
- Resume with few job keywords → Low score (0-50%)
- Empty resume → Very low score

## File Organization

```
finalproject_backend/
├── routes/
│   └── applications.js          # Resume upload, OCR extraction, scoring
├── models/
│   └── Application.js           # DB schema with resume, resumeText, aiScore
├── public/
│   └── uploads/
│       └── applications/        # Uploaded resume files stored here
└── .env                         # OCR_SERVICE_URL configuration

finalproject_frontend/
├── app/
│   ├── jobseeker/
│   │   └── jobs/[jobId]/page.tsx       # Upload form
│   └── recruiter/
│       └── jobs/[jobId]/applications/page.tsx  # Score display & resume download
└── store/
    └── applicationStore.ts      # API calls for uploads
```

## API Endpoints

### Create Application (Jobseeker)
```
POST /applications
Headers: Authorization: Bearer {token}
Body: multipart/form-data
  - jobId: string
  - resume: File (PDF or TXT)
  - coverLetter: string (optional)

Response: { application: {..., aiScore: 0-100, resumeText: string} }
```

### Get My Applications (Jobseeker)
```
GET /applications/my
Headers: Authorization: Bearer {token}

Response: { applications: [...] }
```

### Get Received Applications (Recruiter)
```
GET /applications/received
Headers: Authorization: Bearer {token}

Response: { applications: [...sorted by aiScore] }
```

### Update Application Status (Recruiter)
```
PATCH /applications/:id/status
Headers: Authorization: Bearer {token}
Body: { status: "hired" | "rejected" }

Response: { application: {...} }
```

## Troubleshooting

### Issue: "OCR extraction failed" error
**Solution:** 
- Check OCR service is running on `http://localhost:5001`
- Verify `OCR_SERVICE_URL` in `.env`
- Restart backend after changing env vars

### Issue: Resume file not serving
**Solution:**
- Verify `/public/uploads/applications/` directory exists
- Check backendnode process has write permissions
- Verify `express.static()` is configured in `app.js`

### Issue: Upload fails with 409 Conflict
**Solution:** 
- User already applied to this job
- Each candidate can only apply once per job

### Issue: AI score is 0
**Solution:**
- Resume and job description have no matching keywords
- This is normal if they're completely unrelated
- Check resume was successfully extracted

### Issue: Frontend can't reach backend
**Solution:**
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Ensure backend is running on configured port
- Check CORS is enabled (already configured)

## Score Interpretation Guide

| Score | Rating | Meaning | Background |
|-------|--------|---------|-----------|
| 85-100 | Excellent | Resume matches job very well | Green |
| 70-84  | Good | Most key requirements present | Blue |
| 50-69  | Fair | Some match, but gaps exist | Amber |
| 0-49   | Weak | Little to no match with job | Red |

The algorithm:
1. Tokenizes resume and job description
2. Filters out common stop words
3. Normalizes text (lowercase, remove special chars)
4. Calculates Jaccard similarity (intersection / union of tokens)
5. Multiplies by 1.15 to bias toward higher scores (avoids all 0s)
6. Rounds to nearest integer

## Next Steps (Optional Enhancements)

- [ ] Support for DOCX files
- [ ] Resume preview/viewer for recruiter
- [ ] Resume scoring breakdown (show which keywords matched)
- [ ] Batch import resumes
- [ ] Resume parsing for better keyword extraction
- [ ] Multiple resume uploads per applicant
- [ ] Resume versioning

## Support

For issues with the feature, check:
1. Backend logs (npm start output)
2. Browser console (F12 → Console tab)
3. MongoDB collections: `db.applications.find()`
4. File system: `finalproject_backend/public/uploads/applications/`
