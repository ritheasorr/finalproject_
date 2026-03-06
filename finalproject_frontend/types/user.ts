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
}

export interface Resume {
  id: string;
  user_id: string;
  file_url: string;
  parsed_text: string;
  uploaded_at: string;
  fileName: string;
}
