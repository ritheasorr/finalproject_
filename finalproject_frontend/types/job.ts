export type JobType = 'FULLTIME' | 'PARTTIME' | 'INTERNSHIP';

export interface Job {
  id: string;
  title: string;
  job_type: JobType;
  company: string;
  salary: string;
  description: string;
  requirements: string;
  skills: string[];
  location: string;
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
  status: 'pending' | 'accepted' | 'rejected';
  applied_at: string;
}
