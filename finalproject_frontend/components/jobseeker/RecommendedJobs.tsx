import Link from 'next/link';
import { ArrowRight, Building2, MapPin, Wallet } from 'lucide-react';
import { Job } from '@/types/job';

export interface RecommendedJob {
  job: Job;
  match: number;
  mode: string;
}

interface RecommendedJobsProps {
  jobs: RecommendedJob[];
}

export function RecommendedJobs({ jobs }: RecommendedJobsProps) {
  if (jobs.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900">Jobs Recommended For You</h3>
        <p className="text-sm text-gray-500 mt-2">Add more skills in your profile to unlock personalized recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.slice(0, 3).map((item) => (
        <div key={item.job.id} className="surface-card rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-xl transition duration-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">{item.job.title}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {item.job.company || 'CareerLaunch Partner'}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#edf7f1] text-[#0f5d43] border border-[#0f5d43]/20 font-semibold">
              Recommended
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 inline-flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              {item.job.salary || 'Salary not listed'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {item.mode}
            </span>
          </div>

          <Link
            href={`/jobseeker/jobs/${item.job.id}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#0f5d43] hover:underline"
          >
            Apply
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ))}
    </div>
  );
}
