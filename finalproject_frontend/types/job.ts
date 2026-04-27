export type JobType = 'FULLTIME' | 'PARTTIME' | 'INTERNSHIP';
export type WorkArrangement = 'onsite' | 'hybrid' | 'remote';
export type SalaryPeriod = 'hourly' | 'monthly' | 'yearly';
export type JobPostingStatus = 'draft' | 'published';

export interface StructuredJobPostFormData {
  title: string;
  employmentType: JobType;
  department: string;
  roleOverview: string;
  responsibilities: string;
  requiredSkills: string[];
  bonusSkills: string[];
  educationRequirement: string;
  experienceLevel: string;
  workArrangement: WorkArrangement;
  location: string;
  benefits: string[];
  languages: string[];
  certificates: string[];
  salary: {
    currency: 'USD' | 'THB' | 'EUR' | 'GBP';
    min: string;
    max: string;
    period: SalaryPeriod;
    negotiable: boolean;
    hidden: boolean;
  };
  imageUrl: string;
  aiScoring: {
    enabled: boolean;
    weights: {
      skills: number;
      experience: number;
      education: number;
    };
  };
  status: JobPostingStatus;
}

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
  candidate_id?: string;
  candidate_avatar_url?: string;
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
