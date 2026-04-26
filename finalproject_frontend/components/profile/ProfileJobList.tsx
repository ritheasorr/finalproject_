import Link from 'next/link';
import { BriefcaseBusiness, Clock3, MapPin } from 'lucide-react';
import { Job } from '@/types/job';
import JobImage from '@/components/jobs/JobImage';

interface ProfileJobListProps {
  jobs: Job[];
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  ctaLabel?: string;
}

function jobTypeLabel(type: string): string {
  if (type === 'FULLTIME') return 'Full-Time';
  if (type === 'PARTTIME') return 'Part-Time';
  if (type === 'INTERNSHIP') return 'Internship';
  return type;
}

export default function ProfileJobList({
  jobs,
  title = 'Available Openings',
  emptyTitle = 'No open jobs right now',
  emptyDescription = 'This recruiter currently has no active openings.',
  ctaLabel = 'View Details',
}: ProfileJobListProps) {
  return (
    <div className="surface-card p-5 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#0f5d43]/20 p-8 text-center">
          <BriefcaseBusiness className="w-9 h-9 text-gray-300 mx-auto mb-2" />
          <p className="font-medium text-gray-700">{emptyTitle}</p>
          <p className="text-sm text-gray-500 mt-1">{emptyDescription}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-[#0f5d43]/12 bg-white hover:shadow-md hover:-translate-y-0.5 transition overflow-hidden">
              <JobImage imageUrl={job.image_url} alt={job.title} heightClassName="h-36" />
              <div className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.company}</p>
                </div>
                <span className="inline-flex w-fit items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#edf7f1] text-[#0f5d43] border border-[#0f5d43]/15">
                  {jobTypeLabel(job.job_type)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5" />
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-3">
                <Link
                  href={`/jobseeker/jobs/${job.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#0f5d43] hover:underline"
                >
                  {ctaLabel}
                </Link>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
