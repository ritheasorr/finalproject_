'use client';

import { apiClient } from '../lib/api';
import { User, JobSeekerProfile, RecruiterProfileMeta, Resume } from '../types/user';

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
    avatarUrl?: string;
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
    location?: string;
    professionalTitle?: string;
    bio?: string;
    skills?: string[];
    experienceEntries?: Array<{
      role: string;
      company: string;
      period: string;
      description: string;
    }>;
    educationEntries?: Array<{
      school: string;
      degree: string;
      year: string;
    }>;
    portfolio?: {
      github?: string;
      linkedin?: string;
      website?: string;
    };
    avatarUrl?: string;
    coverImageUrl?: string;
    resumeUrl?: string;
    resumeFilename?: string;
    resumeExtractedText?: string;
    resumeUpdatedAt?: string;
    careerInsights?: string[];
    savedJobs?: string[];
  };
}

interface ResumeVaultResponse {
  resume: {
    url: string;
    filename: string;
    extractedText: string;
    updatedAt: string | null;
  };
  careerInsights: string[];
}

// Map backend user to frontend User type
function mapBackendUser(backendUser: AuthResponse['user']): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    full_name: `${backendUser.firstName} ${backendUser.lastName}`,
    role: backendUser.role === 'candidate' ? 'jobseeker' : 'recruiter',
    created_at: new Date().toISOString(),
    avatar_url: backendUser.avatarUrl || '',
  };
}

function mapUserResponseToJobSeekerProfile(user: UserResponse['user']): JobSeekerProfile {
  return {
    userId: user.id,
    email: user.email,
    phone_number: user.phoneNumber || '',
    full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    education: user.school || '',
    skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
    location: user.location || '',
    professional_title: user.professionalTitle || '',
    bio: user.bio || '',
    experience: '',
    avatar_url: user.avatarUrl || '',
    cover_image_url: user.coverImageUrl || '',
    linkedin_url: (user.portfolio && user.portfolio.linkedin) || '',
    github_url: (user.portfolio && user.portfolio.github) || '',
    website_url: (user.portfolio && user.portfolio.website) || '',
    experience_entries: Array.isArray(user.experienceEntries) ? user.experienceEntries : [],
    education_entries: Array.isArray(user.educationEntries) ? user.educationEntries : [],
    resume_url: user.resumeUrl || '',
    resume_filename: user.resumeFilename || '',
    resume_extracted_text: user.resumeExtractedText || '',
    resume_updated_at: user.resumeUpdatedAt || '',
    career_insights: Array.isArray(user.careerInsights) ? user.careerInsights : [],
    saved_jobs: Array.isArray(user.savedJobs) ? user.savedJobs : [],
    availability_status: 'Open To Hire',
    languages: [],
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
        avatar_url: response.user.avatarUrl || '',
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
    location?: string;
    professionalTitle?: string;
    bio?: string;
    skills?: string[];
    experienceEntries?: Array<{
      role: string;
      company: string;
      period: string;
      description: string;
    }>;
    educationEntries?: Array<{
      school: string;
      degree: string;
      year: string;
    }>;
    portfolio?: {
      github?: string;
      linkedin?: string;
      website?: string;
    };
    avatarUrl?: string;
    coverImageUrl?: string;
    resumeUrl?: string;
    resumeFilename?: string;
    resumeExtractedText?: string;
    resumeUpdatedAt?: string;
    careerInsights?: string[];
    savedJobs?: string[];
  }): Promise<User | null> {
    try {
      const response = await apiClient.patch<UserResponse>('/users/me', updates);
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        full_name: `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.email.split('@')[0],
        role: response.user.role === 'candidate' ? 'jobseeker' : 'recruiter',
        created_at: new Date().toISOString(),
        avatar_url: response.user.avatarUrl || '',
      };
      this.setCurrentUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  },

  async getJobSeekerProfileRemote(userId: string): Promise<JobSeekerProfile | undefined> {
    try {
      const response = await apiClient.get<UserResponse>('/users/me');
      const mapped = mapUserResponseToJobSeekerProfile(response.user);
      const local = this.getJobSeekerProfile(userId);
      const merged = {
        ...mapped,
        availability_status: local?.availability_status || mapped.availability_status || 'Open To Hire',
        languages: local?.languages || [],
      };
      this.updateJobSeekerProfile(userId, merged);
      return merged;
    } catch (error) {
      console.error('Failed to fetch remote jobseeker profile:', error);
      return undefined;
    }
  },

  async saveJobSeekerProfile(userId: string, profile: Partial<JobSeekerProfile>): Promise<JobSeekerProfile | undefined> {
    try {
      const payload = {
        firstName: (profile.full_name || '').trim().split(' ')[0] || undefined,
        lastName: (profile.full_name || '').trim().split(' ').slice(1).join(' ') || undefined,
        school: profile.education,
        phoneNumber: profile.phone_number,
        location: profile.location,
        professionalTitle: profile.professional_title,
        bio: profile.bio,
        skills: typeof profile.skills === 'string'
          ? profile.skills.split(',').map((item) => item.trim()).filter(Boolean)
          : undefined,
        experienceEntries: profile.experience_entries,
        educationEntries: profile.education_entries,
        portfolio: {
          github: profile.github_url || '',
          linkedin: profile.linkedin_url || '',
          website: profile.website_url || '',
        },
        avatarUrl: profile.avatar_url,
        coverImageUrl: profile.cover_image_url,
        savedJobs: profile.saved_jobs,
      };

      const response = await apiClient.patch<UserResponse>('/users/me', payload);
      const mapped = mapUserResponseToJobSeekerProfile(response.user);
      const local = this.getJobSeekerProfile(userId);
      const merged = {
        ...mapped,
        availability_status: profile.availability_status || local?.availability_status || mapped.availability_status || 'Open To Hire',
        languages: profile.languages || local?.languages || [],
      };
      this.updateJobSeekerProfile(userId, merged);
      return merged;
    } catch (error) {
      console.error('Failed to save remote jobseeker profile:', error);
      return undefined;
    }
  },

  async uploadResumeToVault(file: File): Promise<{
    resumeUrl: string;
    resumeFilename: string;
    resumeExtractedText: string;
    resumeUpdatedAt: string | null;
    careerInsights: string[];
  }> {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await apiClient.postFormData<ResumeVaultResponse>('/resumes', formData);
    return {
      resumeUrl: response.resume.url || '',
      resumeFilename: response.resume.filename || '',
      resumeExtractedText: response.resume.extractedText || '',
      resumeUpdatedAt: response.resume.updatedAt || null,
      careerInsights: Array.isArray(response.careerInsights) ? response.careerInsights : []
    };
  },

  async getResumeVault(): Promise<{
    resumeUrl: string;
    resumeFilename: string;
    resumeExtractedText: string;
    resumeUpdatedAt: string | null;
    careerInsights: string[];
  }> {
    const response = await apiClient.get<ResumeVaultResponse>('/resumes/mine/current');
    return {
      resumeUrl: response.resume.url || '',
      resumeFilename: response.resume.filename || '',
      resumeExtractedText: response.resume.extractedText || '',
      resumeUpdatedAt: response.resume.updatedAt || null,
      careerInsights: Array.isArray(response.careerInsights) ? response.careerInsights : []
    };
  },

  async deleteResumeVault(): Promise<boolean> {
    try {
      await apiClient.delete<{ success: boolean }>('/resumes/mine/current');
      return true;
    } catch (error) {
      console.error('Failed to delete resume vault:', error);
      return false;
    }
  },

  async uploadProfileAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.postFormData<{ avatarUrl: string }>('/users/me/avatar', formData);
    return response.avatarUrl || '';
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
        email: updates.email || '',
        phone_number: updates.phone_number || '',
        full_name: updates.full_name || '',
        education: updates.education || '',
        skills: updates.skills || '',
        location: updates.location || '',
        professional_title: updates.professional_title || '',
        bio: updates.bio || '',
        experience: updates.experience || '',
        cover_image_url: updates.cover_image_url || '',
        avatar_url: updates.avatar_url || '',
        linkedin_url: updates.linkedin_url || '',
        github_url: updates.github_url || '',
        website_url: updates.website_url || '',
        availability_status: updates.availability_status || 'Open To Hire',
        languages: updates.languages || [],
      };
      profiles.push(newProfile);
      localStorage.setItem('careerlaunch_jobseeker_profiles', JSON.stringify(profiles));
      return newProfile;
    }
    
    profiles[index] = { ...profiles[index], ...updates };
    localStorage.setItem('careerlaunch_jobseeker_profiles', JSON.stringify(profiles));
    return profiles[index];
  },

  getAllRecruiterProfileMeta(): RecruiterProfileMeta[] {
    if (typeof window === 'undefined') return [];
    const profiles = localStorage.getItem('careerlaunch_recruiter_profiles');
    return profiles ? JSON.parse(profiles) : [];
  },

  getRecruiterProfileMeta(userId: string): RecruiterProfileMeta | undefined {
    const profiles = this.getAllRecruiterProfileMeta();
    return profiles.find((profile) => profile.userId === userId);
  },

  updateRecruiterProfileMeta(userId: string, updates: Partial<RecruiterProfileMeta>): RecruiterProfileMeta | undefined {
    if (typeof window === 'undefined') return undefined;
    const profiles = this.getAllRecruiterProfileMeta();
    const index = profiles.findIndex((profile) => profile.userId === userId);

    if (index === -1) {
      const newProfile: RecruiterProfileMeta = {
        userId,
        company: updates.company || '',
        location: updates.location || '',
        about: updates.about || '',
        title: updates.title || '',
        cover_image_url: updates.cover_image_url || '',
        avatar_url: updates.avatar_url || '',
        website_url: updates.website_url || '',
        linkedin_url: updates.linkedin_url || '',
        company_size: updates.company_size || '',
        company_industry: updates.company_industry || '',
        company_mission: updates.company_mission || '',
        company_benefits: updates.company_benefits || '',
      };
      profiles.push(newProfile);
      localStorage.setItem('careerlaunch_recruiter_profiles', JSON.stringify(profiles));
      return newProfile;
    }

    profiles[index] = { ...profiles[index], ...updates };
    localStorage.setItem('careerlaunch_recruiter_profiles', JSON.stringify(profiles));
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
