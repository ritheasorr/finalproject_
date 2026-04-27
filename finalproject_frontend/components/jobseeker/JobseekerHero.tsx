import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, UploadCloud, UserCog } from 'lucide-react';

interface JobseekerHeroProps {
  firstName: string;
  avatarUrl?: string;
  applicationsCount: number;
  activeCount: number;
  profileCompletion: number;
}

export function JobseekerHero({
  firstName,
  avatarUrl,
  applicationsCount,
  activeCount,
  profileCompletion,
}: JobseekerHeroProps) {
  const initials = firstName.trim().slice(0, 1).toUpperCase() || 'J';

  return (
    <section className="hero-shell p-5 sm:p-7 text-white relative overflow-hidden fade-in-up">
      <div className="absolute inset-0 landing-grid-pattern opacity-20 pointer-events-none" />
      <div className="relative z-10 grid lg:grid-cols-[1fr_260px] gap-5 items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/75">CareerLaunch Dashboard</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">Welcome back, {firstName} 👋</h1>
          <p className="text-white/85 mt-2 max-w-2xl">
            Keep momentum going. Your profile is improving and new opportunities are waiting.
          </p>

          <div className="mt-4 grid sm:grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-white/12 border border-white/20 px-3 py-2.5">
              <p className="text-[11px] text-white/70 uppercase tracking-wide">Applications</p>
              <p className="text-xl font-bold mt-0.5">{applicationsCount}</p>
            </div>
            <div className="rounded-xl bg-white/12 border border-white/20 px-3 py-2.5">
              <p className="text-[11px] text-white/70 uppercase tracking-wide">Active Pipeline</p>
              <p className="text-xl font-bold mt-0.5">{activeCount}</p>
            </div>
            <div className="rounded-xl bg-white/12 border border-white/20 px-3 py-2.5">
              <p className="text-[11px] text-white/70 uppercase tracking-wide">Profile Complete</p>
              <p className="text-xl font-bold mt-0.5">{profileCompletion}%</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/jobseeker/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#0c3f30] px-4 py-2.5 font-semibold text-sm hover:bg-gray-100 transition surface-card-press"
            >
              <BriefcaseBusiness className="w-4 h-4" />
              Browse Jobs
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/jobseeker/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-white/35 px-4 py-2.5 font-semibold text-sm hover:bg-white/10 transition"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Resume
            </Link>
            <Link
              href="/jobseeker/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-white/35 px-4 py-2.5 font-semibold text-sm hover:bg-white/10 transition"
            >
              <UserCog className="w-4 h-4" />
              Update Profile
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/12 backdrop-blur-md p-4">
          <p className="text-xs text-white/75 uppercase tracking-wide">My Career Card</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white text-[#0c3f30] font-bold text-lg flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${firstName} profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="font-semibold">CareerLaunch Member</p>
              <p className="text-xs text-white/75">Track progress and grow your fit score</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#8ee0b8] to-white" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p className="text-xs text-white/80 mt-2">{profileCompletion}% profile readiness</p>
          </div>
        </div>
      </div>
    </section>
  );
}
