'use client';

import { apiClient } from '../lib/api';
import { Job, Application } from '../types/job';

// Backend API response types
interface BackendJob {
  _id: string;
  title: string;
  type: string;
  company: string;
  salary?: string;
  imageUrl?: string;
  location?: string;
  description?: string;
  skills?: string[];
  attachment?: {
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  };
  status: 'open' | 'closed';
  recruiter: string | {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BackendApplication {
  _id: string;
  candidate: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    school?: string;
  };
  job: {
    _id: string;
    title: string;
    company: string;
    type: string;
    location?: string;
    status: string;
  };
  status: 'submitted' | 'reviewing' | 'interview' | 'rejected' | 'hired';
  coverLetter?: string;
  resume?: {
    originalName?: string;
    mimeType?: string;
    size?: number;
    url?: string;
  };
  aiScore?: number;
  aiExplanation?: string;
  aiMatchLevel?: 'excellent' | 'strong' | 'good' | 'partial' | 'weak' | 'unknown';
  aiMatchedSkills?: string[];
  aiMissingSkills?: string[];
  aiRecommendation?: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendSavedResume {
  _id: string;
  application: string | {
    _id: string;
    aiScore?: number;
    status?: string;
    createdAt?: string;
  };
  candidate?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  job?: {
    _id: string;
    title?: string;
    company?: string;
  };
  folderName: string;
  folderSlug: string;
  note?: string;
  savedResumeUrl: string;
  savedFilename: string;
  sourceResumeName?: string;
  updatedAt: string;
}

interface BackendResumeFolder {
  folderSlug: string;
  folderName: string;
  count: number;
  updatedAt: string;
}

interface BackendRecruiterPublicProfile {
  recruiter: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    company: string;
    location: string;
    totalActiveJobs: number;
    totalApplicants: number;
  };
}

export interface RecruiterPublicProfile {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  company: string;
  location: string;
  totalActiveJobs: number;
  totalApplicants: number;
}

export interface RecruiterSavedResume {
  id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  candidateName: string;
  candidateEmail: string;
  applicationScore: number;
  folderName: string;
  folderSlug: string;
  note: string;
  savedResumeUrl: string;
  savedFilename: string;
  sourceResumeName: string;
  updatedAt: string;
}

export interface RecruiterResumeFolder {
  folderSlug: string;
  folderName: string;
  count: number;
  updatedAt: string;
}

// Map backend job to frontend Job type
function mapBackendJob(backendJob: BackendJob): Job {
  const recruiterId = typeof backendJob.recruiter === 'string'
    ? backendJob.recruiter
    : backendJob.recruiter?._id
      ? String(backendJob.recruiter._id)
      : '';
  const recruiterName = typeof backendJob.recruiter === 'string'
    ? ''
    : `${backendJob.recruiter?.firstName || ''} ${backendJob.recruiter?.lastName || ''}`.trim();
  const recruiterEmail = typeof backendJob.recruiter === 'string'
    ? ''
    : backendJob.recruiter?.email || '';

  return {
    id: backendJob._id,
    title: backendJob.title,
    job_type: backendJob.type.toUpperCase() as 'FULLTIME' | 'PARTTIME' | 'INTERNSHIP',
    company: backendJob.company || '',
    salary: backendJob.salary || '',
    image_url: backendJob.imageUrl || '',
    status: backendJob.status || 'open',
    description: backendJob.description || '',
    requirements: backendJob.skills?.join(', ') || '',
    skills: backendJob.skills || [],
    location: backendJob.location || '',
    recruiter_id: recruiterId,
    recruiter_name: recruiterName,
    recruiter_email: recruiterEmail,
    created_at: backendJob.createdAt,
  };
}

// Map backend application to frontend Application type
function mapBackendApplication(backendApp: BackendApplication): Application {
  return {
    id: backendApp._id,
    job_id: backendApp.job._id,
    job_title: backendApp.job.title || '',
    job_company: backendApp.job.company || '',
    candidate_name: `${backendApp.candidate.firstName} ${backendApp.candidate.lastName}`,
    candidate_email: backendApp.candidate.email,
    candidate_phone: backendApp.candidate.phoneNumber || '',
    candidate_school: backendApp.candidate.school || '',
    resume_url: backendApp.resume?.url || '',
    cover_letter: backendApp.coverLetter || '',
    ai_score: typeof backendApp.aiScore === 'number' ? backendApp.aiScore : 0,
    ai_explanation: backendApp.aiExplanation || '',
    ai_match_level: backendApp.aiMatchLevel || 'unknown',
    ai_matched_skills: Array.isArray(backendApp.aiMatchedSkills) ? backendApp.aiMatchedSkills : [],
    ai_missing_skills: Array.isArray(backendApp.aiMissingSkills) ? backendApp.aiMissingSkills : [],
    ai_recommendation: backendApp.aiRecommendation || '',
    application_stage: backendApp.status,
    status: backendApp.status === 'hired' ? 'accepted' : backendApp.status === 'rejected' ? 'rejected' : 'pending',
    applied_at: backendApp.createdAt,
  };
}

function mapBackendSavedResume(item: BackendSavedResume): RecruiterSavedResume {
  const applicationId = typeof item.application === 'string' ? item.application : item.application?._id || '';
  const applicationScore = typeof item.application === 'string' ? 0 : (item.application?.aiScore || 0);
  const jobId = item.job?._id || '';
  const jobTitle = item.job?.title || '';
  const jobCompany = item.job?.company || '';
  const candidateName = item.candidate
    ? `${item.candidate.firstName || ''} ${item.candidate.lastName || ''}`.trim()
    : '';
  const candidateEmail = item.candidate?.email || '';

  return {
    id: item._id,
    applicationId,
    jobId,
    jobTitle,
    jobCompany,
    candidateName,
    candidateEmail,
    applicationScore,
    folderName: item.folderName,
    folderSlug: item.folderSlug,
    note: item.note || '',
    savedResumeUrl: item.savedResumeUrl,
    savedFilename: item.savedFilename,
    sourceResumeName: item.sourceResumeName || '',
    updatedAt: item.updatedAt,
  };
}

export const jobStore = {
  // Jobs
  async getAllJobs(): Promise<Job[]> {
    try {
      const response = await apiClient.get<{ jobs: BackendJob[] }>('/jobs');
      return response.jobs.map(mapBackendJob);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  },

  async getJobById(id: string): Promise<Job | undefined> {
    try {
      const response = await apiClient.get<{ job: BackendJob }>(`/jobs/${id}`);
      return mapBackendJob(response.job);
    } catch (error) {
      console.error('Error fetching job:', error);
      return undefined;
    }
  },

  async getJobsByRecruiterId(recruiterId: string): Promise<Job[]> {
    try {
      const response = await apiClient.get<{ jobs: BackendJob[] }>(`/jobs/recruiter/${recruiterId}`);
      return response.jobs.map(mapBackendJob);
    } catch (error) {
      console.error('Error fetching recruiter jobs:', error);
      return [];
    }
  },

  async getRecruiterPublicProfile(recruiterId: string): Promise<RecruiterPublicProfile | undefined> {
    try {
      const response = await apiClient.get<BackendRecruiterPublicProfile>(`/users/${recruiterId}/public`);
      return {
        id: response.recruiter.id,
        fullName: response.recruiter.fullName,
        firstName: response.recruiter.firstName,
        lastName: response.recruiter.lastName,
        email: response.recruiter.email,
        phoneNumber: response.recruiter.phoneNumber,
        company: response.recruiter.company,
        location: response.recruiter.location,
        totalActiveJobs: response.recruiter.totalActiveJobs,
        totalApplicants: response.recruiter.totalApplicants,
      };
    } catch (error) {
      console.error('Error fetching recruiter public profile:', error);
      return undefined;
    }
  },

  async createJob(jobData: {
    title: string;
    type: string;
    company: string;
    salary?: string;
    imageUrl?: string;
    location?: string;
    description?: string;
    skills?: string[];
    attachment?: File;
  }): Promise<Job | undefined> {
    try {
      if (jobData.attachment) {
        const formData = new FormData();
        formData.append('title', jobData.title);
        formData.append('type', jobData.type);
        formData.append('company', jobData.company);
        if (jobData.salary) formData.append('salary', jobData.salary);
        if (jobData.imageUrl) formData.append('imageUrl', jobData.imageUrl);
        if (jobData.location) formData.append('location', jobData.location);
        if (jobData.description) formData.append('description', jobData.description);
        if (jobData.skills) formData.append('skills', jobData.skills.join(','));
        formData.append('attachment', jobData.attachment);

        const response = await apiClient.postFormData<{ job: BackendJob }>('/jobs', formData);
        return mapBackendJob(response.job);
      } else {
        const response = await apiClient.post<{ job: BackendJob }>('/jobs', {
          title: jobData.title,
          type: jobData.type,
          company: jobData.company,
          salary: jobData.salary,
          imageUrl: jobData.imageUrl,
          location: jobData.location,
          description: jobData.description,
          skills: jobData.skills,
        });
        return mapBackendJob(response.job);
      }
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    try {
      const response = await apiClient.patch<{ job: BackendJob }>(`/jobs/${id}`, {
        title: updates.title,
        type: updates.job_type ? updates.job_type.toLowerCase() : undefined,
        company: updates.company,
        salary: updates.salary,
        imageUrl: updates.image_url,
        location: updates.location,
        description: updates.description,
        skills: updates.requirements
          ? updates.requirements.split(',').map((item) => item.trim()).filter(Boolean)
          : updates.skills,
      });
      return mapBackendJob(response.job);
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  async deleteJob(id: string): Promise<boolean> {
    try {
      await apiClient.delete<{ success: boolean }>(`/jobs/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  // Applications
  async getAllApplications(): Promise<Application[]> {
    // This would need a backend endpoint to get all applications
    // For now, returning empty array
    console.warn('Get all applications not available');
    return [];
  },

  async getApplicationsByJobId(jobId: string): Promise<Application[]> {
    try {
      // Recruiters will use /applications/received to get their applications
      const response = await apiClient.get<{ applications: BackendApplication[] }>('/applications/received');
      const allApps = response.applications.map(mapBackendApplication);
      return allApps.filter(app => app.job_id === jobId);
    } catch (error) {
      console.error('Error fetching applications:', error);
      return [];
    }
  },

  async updateApplicationStatus(id: string, status: 'accepted' | 'rejected'): Promise<Application | undefined> {
    try {
      const backendStatus = status === 'accepted' ? 'hired' : 'rejected';
      const response = await apiClient.patch<{ application: BackendApplication }>(
        `/applications/${id}/status`,
        { status: backendStatus }
      );
      return mapBackendApplication(response.application);
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  },

  async getRecruiterResumeFolders(): Promise<RecruiterResumeFolder[]> {
    try {
      const response = await apiClient.get<{ folders: BackendResumeFolder[] }>('/recruiter-resumes/folders');
      return response.folders || [];
    } catch (error) {
      console.error('Error fetching recruiter resume folders:', error);
      return [];
    }
  },

  async getRecruiterSavedResumes(folderSlug?: string): Promise<RecruiterSavedResume[]> {
    try {
      const endpoint = folderSlug
        ? `/recruiter-resumes?folderSlug=${encodeURIComponent(folderSlug)}`
        : '/recruiter-resumes';
      const response = await apiClient.get<{ savedResumes: BackendSavedResume[] }>(endpoint);
      return (response.savedResumes || []).map(mapBackendSavedResume);
    } catch (error) {
      console.error('Error fetching saved recruiter resumes:', error);
      return [];
    }
  },

  async saveRecruiterResume(applicationId: string, folderName: string, note?: string): Promise<RecruiterSavedResume> {
    try {
      const response = await apiClient.post<{ savedResume: BackendSavedResume }>('/recruiter-resumes/save', {
        applicationId,
        folderName,
        note: note || '',
      });
      return mapBackendSavedResume(response.savedResume);
    } catch (error) {
      console.error('Error saving recruiter resume:', error);
      throw error;
    }
  },

  async updateRecruiterSavedResumeNote(savedResumeId: string, note: string): Promise<RecruiterSavedResume> {
    try {
      const response = await apiClient.patch<{ savedResume: BackendSavedResume }>(
        `/recruiter-resumes/${savedResumeId}/note`,
        { note }
      );
      return mapBackendSavedResume(response.savedResume);
    } catch (error) {
      console.error('Error updating recruiter resume note:', error);
      throw error;
    }
  },
};
