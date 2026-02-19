'use client';

import { Job, Application } from '../types/job';

// Mock data storage
const JOBS_KEY = 'careerlaunch_jobs';
const APPLICATIONS_KEY = 'careerlaunch_applications';

// Initialize with mock data
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Junior Frontend Developer',
    job_type: 'FULLTIME',
    salary: '$25-30/hour',
    description: 'We are looking for a passionate Junior Frontend Developer to join our growing team. You will work on building modern web applications using React and TypeScript.',
    requirements: 'Knowledge of React, TypeScript, and CSS. Strong problem-solving skills. Good communication abilities.',
    location: 'Remote',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Marketing Intern',
    job_type: 'INTERNSHIP',
    salary: '$18-22/hour',
    description: 'Join our marketing team to learn about digital marketing, social media strategy, and content creation.',
    requirements: 'Currently enrolled in Marketing, Communications, or related field. Familiarity with social media platforms. Creative mindset.',
    location: 'New York, NY',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Data Analyst - Part Time',
    job_type: 'PARTTIME',
    salary: '$28-32/hour',
    description: 'Seeking a part-time Data Analyst to help with data collection, analysis, and visualization projects.',
    requirements: 'Proficiency in Python, SQL, and Excel. Experience with data visualization tools like Tableau or Power BI.',
    location: 'San Francisco, CA',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockApplications: Application[] = [
  {
    id: 'app1',
    job_id: '1',
    candidate_name: 'Alex Martinez',
    candidate_email: 'alex.martinez@email.com',
    resume_url: '#',
    cover_letter: 'I am excited to apply for the Junior Frontend Developer position. With my recent bootcamp graduation and passion for React development, I believe I would be a great fit for your team.',
    ai_score: 87,
    status: 'pending',
    applied_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'app2',
    job_id: '1',
    candidate_name: 'Sarah Chen',
    candidate_email: 'sarah.chen@email.com',
    resume_url: '#',
    cover_letter: 'As a Computer Science student with hands-on experience building React applications, I am eager to contribute to your team and continue learning.',
    ai_score: 92,
    status: 'pending',
    applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'app3',
    job_id: '1',
    candidate_name: 'Michael Johnson',
    candidate_email: 'mjohnson@email.com',
    resume_url: '#',
    cover_letter: 'I have been working on personal projects using React and TypeScript for the past year and would love the opportunity to work professionally in this field.',
    ai_score: 78,
    status: 'pending',
    applied_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'app4',
    job_id: '2',
    candidate_name: 'Emily Rodriguez',
    candidate_email: 'emily.r@email.com',
    resume_url: '#',
    cover_letter: 'As a Marketing major with experience managing social media for campus organizations, I am excited about this internship opportunity.',
    ai_score: 85,
    status: 'pending',
    applied_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'app5',
    job_id: '3',
    candidate_name: 'David Kim',
    candidate_email: 'david.kim@email.com',
    resume_url: '#',
    cover_letter: 'I have strong analytical skills and experience with Python and SQL from my Data Science courses. I am looking for part-time work that fits my schedule.',
    ai_score: 88,
    status: 'pending',
    applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Initialize localStorage with mock data if empty
if (typeof window !== 'undefined') {
  if (!localStorage.getItem(JOBS_KEY)) {
    localStorage.setItem(JOBS_KEY, JSON.stringify(mockJobs));
  }
  if (!localStorage.getItem(APPLICATIONS_KEY)) {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(mockApplications));
  }
}

export const jobStore = {
  // Jobs
  getAllJobs(): Job[] {
    if (typeof window === 'undefined') return [];
    const jobs = localStorage.getItem(JOBS_KEY);
    return jobs ? JSON.parse(jobs) : [];
  },

  getJobById(id: string): Job | undefined {
    const jobs = this.getAllJobs();
    return jobs.find(job => job.id === id);
  },

  createJob(job: Omit<Job, 'id' | 'created_at'>): Job {
    const jobs = this.getAllJobs();
    const newJob: Job = {
      ...job,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    jobs.push(newJob);
    if (typeof window !== 'undefined') {
      localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
    }
    return newJob;
  },

  updateJob(id: string, updates: Partial<Job>): Job | undefined {
    if (typeof window === 'undefined') return undefined;
    const jobs = this.getAllJobs();
    const index = jobs.findIndex(job => job.id === id);
    if (index === -1) return undefined;
    
    jobs[index] = { ...jobs[index], ...updates };
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
    return jobs[index];
  },

  deleteJob(id: string): boolean {
    if (typeof window === 'undefined') return false;
    const jobs = this.getAllJobs();
    const filtered = jobs.filter(job => job.id !== id);
    if (filtered.length === jobs.length) return false;
    
    localStorage.setItem(JOBS_KEY, JSON.stringify(filtered));
    
    // Also delete associated applications
    const applications = this.getAllApplications();
    const filteredApps = applications.filter(app => app.job_id !== id);
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(filteredApps));
    
    return true;
  },

  // Applications
  getAllApplications(): Application[] {
    if (typeof window === 'undefined') return [];
    const apps = localStorage.getItem(APPLICATIONS_KEY);
    return apps ? JSON.parse(apps) : [];
  },

  getApplicationsByJobId(jobId: string): Application[] {
    const applications = this.getAllApplications();
    return applications.filter(app => app.job_id === jobId);
  },

  updateApplicationStatus(id: string, status: 'accepted' | 'rejected'): Application | undefined {
    if (typeof window === 'undefined') return undefined;
    const applications = this.getAllApplications();
    const index = applications.findIndex(app => app.id === id);
    if (index === -1) return undefined;
    
    applications[index] = { ...applications[index], status };
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
    return applications[index];
  },
};
