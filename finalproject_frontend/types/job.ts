export type JobType = 'FULLTIME' | 'PARTTIME' | 'INTERNSHIP';

export interface Job {
  id: string;
  title: string;
  job_type: JobType;
  company: string;
  salary: string;
  image_url?: string;
  status?: 'open' | 'closed';
  description: string;
  requirements: string;
  skills: string[];
  location: string;
  recruiter_id?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  job_title: string;
  job_company: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  candidate_school: string;
  resume_url: string;
  cover_letter: string;
  ai_score: number;
  ai_explanation?: string;
  ai_match_level?: 'excellent' | 'strong' | 'good' | 'partial' | 'weak' | 'unknown';
  ai_matched_skills?: string[];
  ai_missing_skills?: string[];
  ai_recommendation?: string;
  application_stage?: 'submitted' | 'reviewing' | 'interview' | 'rejected' | 'hired';
  status: 'pending' | 'accepted' | 'rejected';
  applied_at: string;
}
