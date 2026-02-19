'use client';

import { User, JobSeekerProfile, Resume } from '../types/user';

const USERS_KEY = 'careerlaunch_users';
const CURRENT_USER_KEY = 'careerlaunch_current_user';
const JOBSEEKER_PROFILES_KEY = 'careerlaunch_jobseeker_profiles';
const RESUMES_KEY = 'careerlaunch_resumes';

// Initialize mock users
const mockUsers: User[] = [
  {
    id: 'jobseeker1',
    email: 'jobseeker@example.com',
    full_name: 'Alex JobSeeker',
    role: 'jobseeker',
    created_at: new Date().toISOString(),
  },
  {
    id: 'recruiter1',
    email: 'recruiter@example.com',
    full_name: 'Sarah Recruiter',
    role: 'recruiter',
    created_at: new Date().toISOString(),
  },
];

const mockProfiles: JobSeekerProfile[] = [
  {
    userId: 'jobseeker1',
    full_name: 'Alex JobSeeker',
    education: 'Computer Science - State University, Expected 2026',
    skills: 'React, JavaScript, TypeScript, Python, SQL',
    location: 'San Francisco, CA',
  },
];

if (typeof window !== 'undefined') {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem(JOBSEEKER_PROFILES_KEY)) {
    localStorage.setItem(JOBSEEKER_PROFILES_KEY, JSON.stringify(mockProfiles));
  }
  if (!localStorage.getItem(RESUMES_KEY)) {
    localStorage.setItem(RESUMES_KEY, JSON.stringify([]));
  }
}

export const authStore = {
  // Auth
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser(user: User | null) {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  login(email: string, password: string): User | null {
    const users = this.getAllUsers();
    const user = users.find(u => u.email === email);
    // In a real app, we'd verify password. For demo, any password works
    if (user && password) {
      this.setCurrentUser(user);
      return user;
    }
    return null;
  },

  signup(email: string, password: string, full_name: string, role: 'jobseeker' | 'recruiter'): User {
    const users = this.getAllUsers();
    const newUser: User = {
      id: Date.now().toString(),
      email,
      full_name,
      role,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Create jobseeker profile if jobseeker
    if (role === 'jobseeker') {
      const profiles = this.getAllJobSeekerProfiles();
      profiles.push({
        userId: newUser.id,
        full_name,
        education: '',
        skills: '',
        location: '',
      });
      localStorage.setItem(JOBSEEKER_PROFILES_KEY, JSON.stringify(profiles));
    }
    
    this.setCurrentUser(newUser);
    return newUser;
  },

  logout() {
    this.setCurrentUser(null);
  },

  // Users
  getAllUsers(): User[] {
    if (typeof window === 'undefined') return [];
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  },

  // Job Seeker Profiles
  getAllJobSeekerProfiles(): JobSeekerProfile[] {
    if (typeof window === 'undefined') return [];
    const profiles = localStorage.getItem(JOBSEEKER_PROFILES_KEY);
    return profiles ? JSON.parse(profiles) : [];
  },

  getJobSeekerProfile(userId: string): JobSeekerProfile | undefined {
    const profiles = this.getAllJobSeekerProfiles();
    return profiles.find(p => p.userId === userId);
  },

  updateJobSeekerProfile(userId: string, updates: Partial<JobSeekerProfile>): JobSeekerProfile | undefined {
    if (typeof window === 'undefined') return undefined;
    const profiles = this.getAllJobSeekerProfiles();
    const index = profiles.findIndex(p => p.userId === userId);
    if (index === -1) return undefined;
    
    profiles[index] = { ...profiles[index], ...updates };
    localStorage.setItem(JOBSEEKER_PROFILES_KEY, JSON.stringify(profiles));
    return profiles[index];
  },

  // Resumes
  getAllResumes(): Resume[] {
    if (typeof window === 'undefined') return [];
    const resumes = localStorage.getItem(RESUMES_KEY);
    return resumes ? JSON.parse(resumes) : [];
  },

  getResumesByUserId(userId: string): Resume[] {
    const resumes = this.getAllResumes();
    return resumes.filter(r => r.user_id === userId);
  },

  addResume(userId: string, fileName: string, fileContent: string): Resume {
    const resumes = this.getAllResumes();
    const resumeId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newResume: Resume = {
      id: resumeId,
      user_id: userId,
      file_url: `#resume-${resumeId}`,
      parsed_text: fileContent,
      uploaded_at: new Date().toISOString(),
      fileName,
    };
    resumes.push(newResume);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes));
    }
    return newResume;
  },

  deleteResume(id: string): boolean {
    if (typeof window === 'undefined') return false;
    const resumes = this.getAllResumes();
    const filtered = resumes.filter(r => r.id !== id);
    if (filtered.length === resumes.length) return false;
    
    localStorage.setItem(RESUMES_KEY, JSON.stringify(filtered));
    return true;
  },
};
