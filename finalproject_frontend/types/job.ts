export type JobType = 'FULLTIME' | 'PARTTIME' | 'INTERNSHIP';

export interface Job {
  id: string;
  title: string;
  job_type: JobType;
  salary: string;
  description: string;
  requirements: string;
  location: string;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_name: string;
  candidate_email: string;
  resume_url: string;
  cover_letter: string;
  ai_score: number;
  status: 'pending' | 'accepted' | 'rejected';
  applied_at: string;
}
