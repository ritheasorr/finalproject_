'use client';

import { apiClient } from '../lib/api';
import { Application } from '../types/job';

// Backend API response types
interface BackendApplication {
  _id: string;
  candidate: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    school?: string;
    avatarUrl?: string;
    avatar_url?: string;
    profileImageUrl?: string;
  };
  job: string | {
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

// Map backend application to frontend Application type
function mapBackendApplication(backendApp: BackendApplication): Application {
  const candidate = typeof backendApp.candidate === 'string' 
    ? { firstName: 'Unknown', lastName: '', email: '' } 
    : backendApp.candidate;
  const candidateAvatar =
    typeof backendApp.candidate === 'string'
      ? ''
      : (candidate.avatarUrl || candidate.avatar_url || candidate.profileImageUrl || '');
  
  const job = typeof backendApp.job === 'string'
    ? { _id: backendApp.job, title: '', company: '', type: '', location: '', status: '' }
    : backendApp.job;

  return {
    id: backendApp._id,
    candidate_id: typeof backendApp.candidate === 'string' ? '' : candidate._id,
    candidate_avatar_url: candidateAvatar,
    job_id: typeof backendApp.job === 'string' ? backendApp.job : job._id,
    job_title: typeof backendApp.job === 'string' ? '' : (backendApp.job.title || ''),
    job_company: typeof backendApp.job === 'string' ? '' : (backendApp.job.company || ''),
    candidate_name: `${candidate.firstName} ${candidate.lastName}`.trim(),
    candidate_email: candidate.email,
    candidate_phone: typeof backendApp.candidate === 'string' ? '' : (backendApp.candidate.phoneNumber || ''),
    candidate_school: typeof backendApp.candidate === 'string' ? '' : (backendApp.candidate.school || ''),
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

export const applicationStore = {
  async getAllApplications(): Promise<Application[]> {
    // Not available in backend yet
    return [];
  },

  async getApplicationsByUserId(userId: string): Promise<Application[]> {
    try {
      // Candidates use /applications/my to get their applications
      const response = await apiClient.get<{ applications: BackendApplication[] }>('/applications/my');
      return response.applications.map(mapBackendApplication);
    } catch (error) {
      console.error('Error fetching user applications:', error);
      return [];
    }
  },

  async getApplicationById(id: string): Promise<Application | undefined> {
    // Not available in backend yet - would need implementation
    console.warn('Get application by ID not yet implemented in backend');
    return undefined;
  },

  async createApplication(
    jobId: string,
    coverLetter: string,
    resume?: File,
    options?: {
      resumeSource?: 'vault' | 'upload';
    }
  ): Promise<Application> {
    try {
      const formData = new FormData();
      formData.append('jobId', jobId);
      if (coverLetter) formData.append('coverLetter', coverLetter);
      const source = options?.resumeSource || (resume ? 'upload' : 'vault');
      formData.append('resumeSource', source);
      if (source === 'upload' && resume) {
        formData.append('resume', resume);
      }

      const response = await apiClient.postFormData<{ application: BackendApplication }>('/applications', formData);
      return mapBackendApplication(response.application);
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  },

  async hasApplied(userId: string, jobId: string): Promise<boolean> {
    try {
      const applications = await this.getApplicationsByUserId(userId);
      return applications.some(app => app.job_id === jobId);
    } catch {
      return false;
    }
  },
};
