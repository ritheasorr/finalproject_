'use client';

import { apiClient } from '../lib/api';
import { User, JobSeekerProfile, Resume } from '../types/user';

const CURRENT_USER_KEY = 'careerlaunch_current_user';

// Backend API response types
interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    school?: string;
    role: 'candidate' | 'recruiter';
  };
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: 'candidate' | 'recruiter';
    phoneNumber?: string;
    school?: string;
  };
}

// Map backend user to frontend User type
function mapBackendUser(backendUser: AuthResponse['user']): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    full_name: `${backendUser.firstName} ${backendUser.lastName}`,
    role: backendUser.role === 'candidate' ? 'jobseeker' : 'recruiter',
    created_at: new Date().toISOString(),
  };
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

  async login(email: string, password: string): Promise<User> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      apiClient.setAuthTokens(response.accessToken, response.refreshToken);
      const user = mapBackendUser(response.user);
      this.setCurrentUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  },

  async signup(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'jobseeker' | 'recruiter',
    phoneNumber?: string,
    school?: string
  ): Promise<User> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        role: role === 'jobseeker' ? 'candidate' : 'recruiter',
        phoneNumber,
        school,
      });

      apiClient.setAuthTokens(response.accessToken, response.refreshToken);
      const user = mapBackendUser(response.user);
      this.setCurrentUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  },

  logout() {
    apiClient.clearAuth();
    this.setCurrentUser(null);
  },

  async fetchCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<UserResponse>('/users/me');
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        full_name: `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.email.split('@')[0],
        role: response.user.role === 'candidate' ? 'jobseeker' : 'recruiter',
        created_at: new Date().toISOString(),
      };
      this.setCurrentUser(user);
      return user;
    } catch {
      return null;
    }
  },

  async updateUserProfile(updates: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    school?: string;
  }): Promise<User | null> {
    try {
      const response = await apiClient.patch<UserResponse>('/users/me', updates);
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        full_name: `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.email.split('@')[0],
        role: response.user.role === 'candidate' ? 'jobseeker' : 'recruiter',
        created_at: new Date().toISOString(),
      };
      this.setCurrentUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  },

  // Note: Profile and Resume management will need backend endpoints
  // For now, keeping localStorage fallback for these features
  getAllJobSeekerProfiles(): JobSeekerProfile[] {
    if (typeof window === 'undefined') return [];
    const profiles = localStorage.getItem('careerlaunch_jobseeker_profiles');
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
    
    if (index === -1) {
      // Create new profile
      const newProfile: JobSeekerProfile = {
        userId,
        full_name: updates.full_name || '',
        education: updates.education || '',
        skills: updates.skills || '',
        location: updates.location || '',
      };
      profiles.push(newProfile);
      localStorage.setItem('careerlaunch_jobseeker_profiles', JSON.stringify(profiles));
      return newProfile;
    }
    
    profiles[index] = { ...profiles[index], ...updates };
    localStorage.setItem('careerlaunch_jobseeker_profiles', JSON.stringify(profiles));
    return profiles[index];
  },

  // Resumes (localStorage until backend endpoints are added)
  getAllResumes(): Resume[] {
    if (typeof window === 'undefined') return [];
    const resumes = localStorage.getItem('careerlaunch_resumes');
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
      localStorage.setItem('careerlaunch_resumes', JSON.stringify(resumes));
    }
    return newResume;
  },

  deleteResume(id: string): boolean {
    if (typeof window === 'undefined') return false;
    const resumes = this.getAllResumes();
    const filtered = resumes.filter(r => r.id !== id);
    if (filtered.length === resumes.length) return false;
    
    localStorage.setItem('careerlaunch_resumes', JSON.stringify(filtered));
    return true;
  },
};
