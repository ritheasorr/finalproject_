# Final Year Project Report

## Project Title
AI-Enhanced Career Launch Platform: Intelligent Job Matching, Resume Processing, and Recruitment Workflow Management

## Student Information
- Name: [Enter Student Name]
- Student ID: [Enter Student ID]
- Program: [Enter Program Name]
- Faculty/Department: [Enter Faculty/Department]
- Supervisor: [Enter Supervisor Name]
- Submission Date: [Enter Date]

---

## Abstract
This project presents a full-stack recruitment platform designed to improve the efficiency and quality of hiring workflows for jobseekers and recruiters. The system provides secure authentication, job posting and management, application submission with resume upload, OCR-based text extraction from resumes, and AI-supported resume-job relevance scoring. The solution combines a Next.js frontend, an Express.js backend, MongoDB persistence, and a Python-based OCR microservice. In addition to standard recruitment functions, the platform introduces recruiter-oriented resume organization through foldered saved resumes and semantic scoring assisted by a large language model.

The system addresses common issues in manual recruitment such as inconsistent resume evaluation, high screening effort, and poor applicant tracking visibility. A hybrid scoring approach is implemented, combining lexical matching techniques with Gemini-based semantic evaluation to produce a final relevance score between 0 and 100. The architecture is modular, API-driven, and extensible, enabling future upgrades such as richer explainable scoring, analytics dashboards, and document format expansion.

The project demonstrates practical integration of web engineering, database design, security controls, and applied AI in a realistic domain. Results show that the platform can support end-to-end hiring flows while improving candidate prioritization and reducing initial recruiter screening time.

Keywords: recruitment platform, resume screening, OCR, semantic scoring, full-stack web development, AI in HR.

---

## Chapter 1: Introduction

### 1.1 Background
Recruitment activities in small and medium organizations are frequently managed with fragmented tools such as spreadsheets, email threads, and manual resume review. These methods are time-consuming, error-prone, and difficult to scale. Recruiters often process large volumes of applications under time pressure, which can reduce consistency and fairness in shortlisting.

Recent advances in AI and document processing provide opportunities to automate early-stage screening while preserving human oversight. By integrating resume text extraction and scoring against job requirements, organizations can prioritize candidates more effectively and accelerate decision-making.

### 1.2 Problem Statement
Traditional hiring pipelines face the following problems:
1. Manual resume review is slow and inconsistent.
2. Recruiters lack automated support for candidate-job relevance.
3. Uploaded resumes are not always structured for easy comparison.
4. End-to-end tracking of job postings and applications is fragmented.
5. Candidate and recruiter workflows are often handled in separate systems.

### 1.3 Aim
To design and implement a web-based recruitment platform that unifies job posting, candidate applications, resume processing, and AI-assisted candidate ranking in a secure and usable system.

### 1.4 Objectives
1. Build role-based authentication for jobseekers and recruiters.
2. Implement job management features for recruiters.
3. Enable candidates to apply with resume uploads and cover letters.
4. Extract resume text using OCR and text parsing.
5. Compute AI-assisted relevance scores for applications.
6. Provide recruiter-side application review and status updates.
7. Implement resume saving and folder organization for recruiters.
8. Document architecture, implementation, and testing outcomes.

### 1.5 Scope
Included scope:
1. Authentication and authorization with JWT.
2. Job posting, listing, filtering, and deletion.
3. Candidate application submission with PDF/TXT resumes.
4. Resume text extraction using OCR service.
5. Hybrid resume scoring (lexical + Gemini semantic scoring).
6. Recruiter application review and hiring/rejection status updates.
7. Recruiter saved-resume folders and note-taking.

Excluded scope:
1. Payment and premium subscription modules.
2. Video interview and scheduling integrations.
3. Fully automated final hiring decision making.
4. Enterprise-scale multi-tenant deployment.

### 1.6 Significance
The project demonstrates how practical AI can be embedded into recruitment software to reduce screening effort and improve candidate prioritization. It is academically significant as a full-stack case study and practically useful as a deployable foundation for HR technology enhancement.

---

## Chapter 2: Requirement Analysis

### 2.1 Functional Requirements
1. User registration and login for candidate/recruiter roles.
2. Token refresh support for authenticated sessions.
3. Candidate profile retrieval.
4. Recruiter job creation with optional attachments.
5. Job listing with filtering by type and title.
6. Candidate application creation with resume upload.
7. Resume file validation (PDF/TXT).
8. OCR extraction endpoint integration for PDF files.
9. Resume scoring and storage of score in database.
10. Candidate view of submitted applications.
11. Recruiter view of received applications.
12. Recruiter update of application status.
13. Recruiter save resume to named folder with optional note.
14. API documentation access through Swagger UI.

### 2.2 Non-Functional Requirements
1. Security: password hashing, JWT validation, role-based access checks.
2. Reliability: graceful fallback when OCR or LLM scoring is unavailable.
3. Performance: efficient API responses for common listing operations.
4. Maintainability: modular route/model structure and separated services.
5. Usability: responsive UI and clear workflow separation by role.
6. Portability: local deployment using standard Node.js, Python, and MongoDB stack.

### 2.3 Constraints
1. OCR quality depends on source PDF quality and scanned content.
2. Semantic scoring quality depends on external LLM API availability.
3. Local deployment requires MongoDB and OCR service setup.

---

## Chapter 3: System Design

### 3.1 High-Level Architecture
The solution follows a multi-service architecture:
1. Frontend client: Next.js application for candidate and recruiter interfaces.
2. Backend API: Express.js REST API for business logic and persistence.
3. Database: MongoDB with Mongoose schemas for users, jobs, applications, and saved resumes.
4. OCR Microservice: Flask service for PDF text extraction with pdfplumber and EasyOCR fallback.
5. AI Scoring Integration: Gemini API for semantic resume-job compatibility assessment.

### 3.2 Data Model Overview
Main entities:
1. User: identity, role, profile fields.
2. Job: title, type, company, location, description, skills, attachment, owner recruiter.
3. Application: candidate, job, status, cover letter, resume metadata, extracted text, AI score.
4. RecruiterSavedResume: recruiter-folder mapping of selected application resumes with notes.

### 3.3 Workflow Design
Candidate workflow:
1. Register/Login.
2. Browse available jobs.
3. Submit application with resume and cover letter.
4. View submitted applications.

Recruiter workflow:
1. Register/Login.
2. Create and manage jobs.
3. View received applications.
4. Inspect AI score and resume.
5. Update application status.
6. Save shortlisted resumes into folders.

### 3.4 Security Design
1. Passwords are hashed using bcrypt.
2. Access and refresh tokens are issued via JWT.
3. Protected routes use authentication middleware.
4. Role checks enforce candidate/recruiter access boundaries.
5. File upload handling validates format and storage location.

---

## Chapter 4: Implementation

### 4.1 Technology Stack
Frontend:
1. Next.js (App Router), React, TypeScript.
2. Tailwind CSS and Radix UI component ecosystem.
3. Zustand-style store modules for auth/jobs/applications.

Backend:
1. Node.js with Express.
2. Mongoose for MongoDB modeling.
3. Multer for multipart uploads.
4. Swagger UI for API documentation.

AI and Document Processing:
1. Flask OCR service.
2. pdfplumber + EasyOCR + pdf2image for extraction.
3. Gemini model integration for semantic score estimation.

### 4.2 Core Modules Implemented
1. Authentication module:
   - Register/login/refresh token endpoints.
   - Role-aware user mapping.
2. Jobs module:
   - Create/list/view/delete jobs.
   - Recruiter ownership enforcement.
3. Applications module:
   - Resume upload and text extraction.
   - Lexical keyword/phrase scoring.
   - Gemini semantic scoring blended with lexical anchor.
   - Duplicate application prevention.
4. Recruiter resume management module:
   - Save application resumes into named folders.
   - Folder listing and note update.

### 4.3 Resume Scoring Strategy
The implemented score combines:
1. Lexical features:
   - Token overlap, recall, skill/title/requirement coverage.
   - Phrase-level matching from job text.
2. Semantic AI score:
   - Prompt-based evaluation using Gemini.
3. Blending policy:
   - Final score = 15% lexical + 85% semantic (when semantic score available).
   - Lexical score used as fallback when external semantic service is unavailable.

This hybrid approach improves robustness while preserving meaningful baseline behavior under service interruptions.

### 4.4 API Documentation
Swagger/OpenAPI documentation is served through the backend for key routes including:
1. Auth endpoints.
2. Job endpoints.
3. Application endpoints.
4. Status update operations.

---

## Chapter 5: Testing and Evaluation

### 5.1 Testing Approach
The project primarily uses scenario-based functional testing and endpoint verification. Test scenarios focus on complete user journeys for both roles and integration points across services.

### 5.2 Key Test Scenarios
1. Candidate submits TXT resume application successfully.
2. Candidate submits PDF resume application with OCR extraction.
3. Recruiter views received applications and AI scores.
4. Recruiter downloads resume from application detail.
5. Recruiter updates application status.
6. Duplicate application submission is correctly rejected.
7. Unsupported file type upload is rejected.
8. OCR outage fallback behavior is handled without system crash.

### 5.3 Evaluation Summary
1. End-to-end workflows are operational for both user roles.
2. AI score values are stored and visible in recruiter review context.
3. Resume management and organization improves recruiter usability.
4. Security controls enforce role boundaries and authenticated access.
5. Architecture supports further feature growth without major redesign.

### 5.4 Limitations Observed
1. Some frontend features remain partially implemented in local fallback mode.
2. Scoring explainability to end users can be expanded.
3. OCR and external AI dependencies may introduce latency variability.

---

## Chapter 6: Conclusion and Future Work

### 6.1 Conclusion
The project successfully delivers an integrated recruitment platform that combines conventional applicant tracking features with AI-assisted resume evaluation. By connecting resume upload, OCR extraction, and hybrid scoring in one workflow, the system reduces recruiter effort in initial screening and provides a practical foundation for data-driven hiring support.

The architecture is modular and production-oriented at small-to-medium scale, with clear separation between frontend experience, backend API logic, and external AI/OCR services. The implementation meets the main project objectives and demonstrates applied engineering competency across full-stack development, AI integration, and system design.

### 6.2 Future Enhancements
1. Add DOCX resume support in the main API upload workflow.
2. Provide score explanation dashboard with matched/missing skill highlights.
3. Add advanced search and ranking filters for recruiters.
4. Integrate interview scheduling and communication modules.
5. Add automated test suites (unit, integration, end-to-end).
6. Improve deployment setup with containerized orchestration.
7. Introduce fairness and bias monitoring for AI-assisted scoring.
8. Implement analytics for recruiter productivity and hiring funnel metrics.

---

## References
1. Next.js Documentation. https://nextjs.org/docs
2. Express.js Documentation. https://expressjs.com/
3. Mongoose Documentation. https://mongoosejs.com/docs/
4. Flask Documentation. https://flask.palletsprojects.com/
5. EasyOCR Documentation. https://www.jaided.ai/easyocr/
6. pdfplumber Documentation. https://github.com/jsvine/pdfplumber
7. OpenAPI Specification. https://swagger.io/specification/
8. Google Generative AI Documentation. https://ai.google.dev/

---

## Appendix A: Deployment Notes
1. Backend requires environment variables for MongoDB URI, JWT secrets, OCR service URL, and Gemini API key.
2. Frontend requires API base URL configuration.
3. OCR service requires Python dependencies and runs as a separate process.

## Appendix B: Suggested Formatting Mapping to University Template
If your provided template has named sections such as Declaration, Acknowledgement, Table of Contents, List of Figures/Tables, and Chapter-wise headings, copy this report content into corresponding headings as follows:
1. Keep Abstract under Abstract.
2. Map Chapter 1 through Chapter 6 directly.
3. Keep References and Appendices as final sections.
4. Add institutional front matter required by your faculty (signature page, plagiarism statement, supervisor approval).
