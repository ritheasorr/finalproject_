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
  createdAt: string;
  updatedAt: string;
}

// Map backend application to frontend Application type
function mapBackendApplication(backendApp: BackendApplication): Application {
  const candidate = typeof backendApp.candidate === 'string' 
    ? { firstName: 'Unknown', lastName: '', email: '' } 
    : backendApp.candidate;
  
  const job = typeof backendApp.job === 'string'
    ? { _id: backendApp.job, title: '', company: '', type: '', location: '', status: '' }
    : backendApp.job;

  return {
    id: backendApp._id,
    job_id: typeof backendApp.job === 'string' ? backendApp.job : job._id,
    candidate_name: `${candidate.firstName} ${candidate.lastName}`.trim(),
    candidate_email: candidate.email,
    resume_url: '#', // Backend doesn't have resume URLs yet
    cover_letter: backendApp.coverLetter || '',
    ai_score: Math.floor(Math.random() * 35) + 60, // Mock AI score for now
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
    userId: string,
    candidateName: string,
    candidateEmail: string,
    resumeId: string,
    coverLetter: string
  ): Promise<Application> {
    try {
      const response = await apiClient.post<{ application: BackendApplication }>('/applications', {
        jobId,
        coverLetter,
      });
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
