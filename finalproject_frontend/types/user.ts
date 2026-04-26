export type UserRole = 'jobseeker' | 'recruiter';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface JobSeekerProfile {
  userId: string;
  full_name: string;
  education: string;
  skills: string;
  location: string;
  professional_title?: string;
  bio?: string;
  experience?: string;
  cover_image_url?: string;
  avatar_url?: string;
  linkedin_url?: string;
}

export interface RecruiterProfileMeta {
  userId: string;
  company: string;
  location: string;
  about: string;
  title: string;
  cover_image_url?: string;
  avatar_url?: string;
  website_url?: string;
  linkedin_url?: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_url: string;
  parsed_text: string;
  uploaded_at: string;
  fileName: string;
}
