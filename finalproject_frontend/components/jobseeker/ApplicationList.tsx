import Link from 'next/link';
import { Building2, CalendarClock, CheckCircle2, Clock3, MapPin, XCircle } from 'lucide-react';
import { Application } from '@/types/job';

interface ApplicationListProps {
  applications: Application[];
  onViewDetails: (application: Application) => void;
}

function statusTone(status: Application['status']): string {
  if (status === 'accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function stageIndex(status: Application['status']): number {
  if (status === 'accepted') return 4;
  if (status === 'rejected') return 3;
  return 2;
}

function resolveStage(app: Application): number {
  if (app.application_stage === 'submitted') return 1;
  if (app.application_stage === 'reviewing') return 2;
  if (app.application_stage === 'interview') return 3;
  if (app.application_stage === 'hired') return 4;
  if (app.application_stage === 'rejected') return 3;
  return stageIndex(app.status);
}

export function ApplicationList({ applications, onViewDetails }: ApplicationListProps) {
  if (applications.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-9 text-center fade-in-up">
        <div className="w-14 h-14 rounded-full bg-[#e8f6ef] mx-auto flex items-center justify-center">
          <Building2 className="w-7 h-7 text-[#0f6a4c]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mt-4">No applications yet</h3>
        <p className="text-sm text-gray-500 mt-1">Start exploring opportunities tailored for you.</p>
        <Link
          href="/jobseeker/jobs"
          className="mt-4 inline-flex items-center gap-2 bg-[#0f5d43] text-white px-5 py-2.5 rounded-xl hover:bg-[#0b4f39] transition"
        >
          Browse Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.slice(0, 8).map((app, idx) => {
        const stage = resolveStage(app);
        return (
          <div
            key={app.id}
            className="surface-card rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-xl transition duration-200 fade-in-up"
            style={{ animationDelay: `${idx * 35}ms` }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#ecf7f1] text-[#0f6a4c] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{app.job_title || 'Job Application'}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>{app.job_company || 'CareerLaunch Partner'}</span>
                    <span className="flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                    {app.job_company && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Flexible / Remote
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusTone(app.status)}`}>
                  {app.status === 'accepted' && <CheckCircle2 className="inline w-3.5 h-3.5 mr-1" />}
                  {app.status === 'rejected' && <XCircle className="inline w-3.5 h-3.5 mr-1" />}
                  {app.status === 'pending' && <Clock3 className="inline w-3.5 h-3.5 mr-1" />}
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <div className="grid grid-cols-4 gap-2">
                {['Applied', 'Screening', 'Interview', 'Offer'].map((label, index) => {
                  const active = index + 1 <= stage;
                  const rejected = app.status === 'rejected' && index >= 2;
                  return (
                    <div key={`${app.id}-${label}`} className="text-center">
                      <div className={`h-1.5 rounded-full ${rejected ? 'bg-red-200' : active ? 'bg-[#3ca276]' : 'bg-gray-200'}`} />
                      <p className={`text-[11px] mt-1 ${rejected ? 'text-red-500' : active ? 'text-[#0f5d43]' : 'text-gray-400'}`}>{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">
                Salary: {app.job_company ? 'As posted' : 'N/A'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">
                Location: Flexible
              </span>
            </div>

            <div className="mt-3">
              <button
                onClick={() => onViewDetails(app)}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#0f5d43] hover:underline"
              >
                View Details
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
