export type UserRole = 'jobseeker' | 'recruiter';
export type JobSeekerAvailabilityStatus =
  | 'Available'
  | 'Open To Hire'
  | 'Interested'
  | 'Freelance'
  | 'Part Time Only'
  | 'Remote Only'
  | 'Not Available';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface JobSeekerProfile {
  userId: string;
  email?: string;
  phone_number?: string;
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
  github_url?: string;
  website_url?: string;
  availability_status?: JobSeekerAvailabilityStatus;
  languages?: Array<{
    name: string;
    fluency: string;
  }>;
  experience_entries?: Array<{
    role: string;
    company: string;
    period: string;
    description: string;
  }>;
  education_entries?: Array<{
    school: string;
    degree: string;
    year: string;
  }>;
  resume_url?: string;
  resume_filename?: string;
  resume_extracted_text?: string;
  resume_updated_at?: string;
  career_insights?: string[];
  saved_jobs?: string[];
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
  company_size?: string;
  company_industry?: string;
  company_mission?: string;
  company_benefits?: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_url: string;
  parsed_text: string;
  uploaded_at: string;
  fileName: string;
}
