'use client';

import { Application } from '../types/job';

const APPLICATIONS_KEY = 'careerlaunch_applications';

export const applicationStore = {
  getAllApplications(): Application[] {
    if (typeof window === 'undefined') return [];
    const apps = localStorage.getItem(APPLICATIONS_KEY);
    return apps ? JSON.parse(apps) : [];
  },

  getApplicationsByUserId(userId: string): Application[] {
    const applications = this.getAllApplications();
    return applications.filter(app => app.candidate_email.includes(userId)); // Mock relation
  },

  getApplicationById(id: string): Application | undefined {
    const applications = this.getAllApplications();
    return applications.find(app => app.id === id);
  },

  createApplication(
    jobId: string,
    userId: string,
    candidateName: string,
    candidateEmail: string,
    resumeId: string,
    coverLetter: string
  ): Application {
    const applications = this.getAllApplications();
    
    // Generate AI score (mock - between 60-95)
    const aiScore = Math.floor(Math.random() * 35) + 60;
    
    const newApplication: Application = {
      id: crypto.randomUUID(),
      job_id: jobId,
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      resume_url: `#resume-${resumeId}`,
      cover_letter: coverLetter,
      ai_score: aiScore,
      status: 'pending',
      applied_at: new Date().toISOString(),
    };
    
    applications.push(newApplication);
    if (typeof window !== 'undefined') {
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
    }
    return newApplication;
  },

  hasApplied(userId: string, jobId: string): boolean {
    const applications = this.getAllApplications();
    return applications.some(app => 
      app.candidate_email.includes(userId) && app.job_id === jobId
    );
  },
};
