'use client';

import { apiClient } from '../lib/api';
import { Job, Application } from '../types/job';

// Backend API response types
interface BackendJob {
  _id: string;
  title: string;
  type: string;
  company: string;
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
  recruiter: string;
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
  createdAt: string;
  updatedAt: string;
}

// Map backend job to frontend Job type
function mapBackendJob(backendJob: BackendJob): Job {
  return {
    id: backendJob._id,
    title: backendJob.title,
    job_type: backendJob.type.toUpperCase() as 'FULLTIME' | 'PARTTIME' | 'INTERNSHIP',
    salary: '', // Backend doesn't have salary field yet
    description: backendJob.description || '',
    requirements: backendJob.skills?.join(', ') || '',
    location: backendJob.location || '',
    created_at: backendJob.createdAt,
  };
}

// Map backend application to frontend Application type
function mapBackendApplication(backendApp: BackendApplication): Application {
  return {
    id: backendApp._id,
    job_id: backendApp.job._id,
    candidate_name: `${backendApp.candidate.firstName} ${backendApp.candidate.lastName}`,
    candidate_email: backendApp.candidate.email,
    resume_url: '#', // Backend doesn't have resume URLs yet
    cover_letter: backendApp.coverLetter || '',
    ai_score: Math.floor(Math.random() * 35) + 60, // Mock AI score for now
    status: backendApp.status === 'hired' ? 'accepted' : backendApp.status === 'rejected' ? 'rejected' : 'pending',
    applied_at: backendApp.createdAt,
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

  async createJob(jobData: {
    title: string;
    type: string;
    company: string;
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
    // Note: Backend doesn't have update endpoint yet
    // This would need to be implemented in the backend
    console.warn('Job update not yet implemented in backend');
    return undefined;
  },

  async deleteJob(id: string): Promise<boolean> {
    // Note: Backend doesn't have delete endpoint yet
    // This would need to be implemented in the backend
    console.warn('Job delete not yet implemented in backend');
    return false;
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
};
