'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, BrainCircuit, BriefcaseBusiness, CalendarClock, Sparkles, Target, UserCircle2 } from 'lucide-react';

import { authStore } from '@/store/authStore';
import { applicationStore } from '@/store/applicationStore';
import { jobStore } from '@/store/jobStore';
import { Application, Job } from '@/types/job';
import { JobSeekerProfile, Resume } from '@/types/user';
import { PageShell } from '@/components/ui/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { JobseekerHero } from '@/components/jobseeker/JobseekerHero';
import { StatsGrid, type JobseekerStatItem } from '@/components/jobseeker/StatsGrid';
import { InsightCard } from '@/components/jobseeker/InsightCard';
import { ApplicationList } from '@/components/jobseeker/ApplicationList';
import { RecommendedJobs, type RecommendedJob } from '@/components/jobseeker/RecommendedJobs';
import { ProfileCompletion } from '@/components/jobseeker/ProfileCompletion';
import { QuickActions } from '@/components/jobseeker/QuickActions';

type DashboardUser = {
  id: string;
  full_name: string;
  role: 'jobseeker' | 'recruiter';
};

function tokenizeSkills(raw: string): string[] {
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function computeMatchPercent(profileSkills: string[], job: Job): number {
  const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
  if (jobSkills.length === 0) return 62;
  const intersection = jobSkills.filter((skill) => profileSkills.some((s) => s.includes(skill) || skill.includes(s))).length;
  const coverage = intersection / jobSkills.length;
  return Math.max(45, Math.min(96, Math.round((coverage * 100) + 20)));
}

export default function JobSeekerDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [vaultResume, setVaultResume] = useState<{
    resumeUrl: string;
    resumeFilename: string;
    resumeExtractedText: string;
    resumeUpdatedAt: string | null;
    careerInsights: string[];
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    void (async () => {
      const currentUser = authStore.getCurrentUser();
      if (!currentUser || currentUser.role !== 'jobseeker') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      await loadData(currentUser);
      setLoading(false);
    })();
  }, [router]);

  const loadData = async (currentUser: DashboardUser) => {
    let currentProfile = await authStore.getJobSeekerProfileRemote(currentUser.id);
    if (!currentProfile) {
      currentProfile = authStore.getJobSeekerProfile(currentUser.id);
    }
    if (!currentProfile) {
      currentProfile = authStore.updateJobSeekerProfile(currentUser.id, {
        userId: currentUser.id,
        full_name: currentUser.full_name,
        education: '',
        skills: '',
        location: '',
      }) || null;
    }

    setResumes(authStore.getResumesByUserId(currentUser.id));
    try {
      const vault = await authStore.getResumeVault();
      setVaultResume(vault);
      if (currentProfile) {
        currentProfile = {
          ...currentProfile,
          resume_url: vault.resumeUrl || currentProfile.resume_url,
          resume_filename: vault.resumeFilename || currentProfile.resume_filename,
          resume_extracted_text: vault.resumeExtractedText || currentProfile.resume_extracted_text,
          resume_updated_at: vault.resumeUpdatedAt || currentProfile.resume_updated_at,
          career_insights: vault.careerInsights.length > 0 ? vault.careerInsights : currentProfile.career_insights,
        };
      }
    } catch {
      setVaultResume(null);
    }

    setProfile(currentProfile);

    const [apps, jobs] = await Promise.all([
      applicationStore.getApplicationsByUserId(currentUser.id),
      jobStore.getAllJobs(),
    ]);
    setApplications(apps);
    setAllJobs(jobs);
  };

  const profileChecklist = useMemo(() => {
    if (!profile) {
      return {
        items: [
          { label: 'Basic Info', done: false },
          { label: 'Skills', done: false },
          { label: 'Resume Upload', done: false },
          { label: 'Portfolio', done: false },
          { label: 'Experience', done: false },
        ],
        completion: 0,
      };
    }
    const hasVaultResume = Boolean(profile.resume_url || vaultResume?.resumeUrl || resumes.length > 0);
    const items = [
      { label: 'Basic Info', done: Boolean(profile.full_name && profile.location) },
      { label: 'Skills', done: Boolean(profile.skills && profile.skills.trim().length > 0) },
      { label: 'Resume Upload', done: hasVaultResume },
      { label: 'Portfolio', done: Boolean((profile.linkedin_url && profile.linkedin_url.trim().length > 0) || (profile.github_url && profile.github_url.trim().length > 0) || (profile.website_url && profile.website_url.trim().length > 0)) },
      { label: 'Experience', done: Boolean((profile.experience && profile.experience.trim().length > 0) || (profile.experience_entries && profile.experience_entries.length > 0)) },
    ];
    const done = items.filter((item) => item.done).length;
    return { items, completion: Math.round((done / items.length) * 100) };
  }, [profile, resumes, vaultResume]);

  const derived = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === 'pending').length;
    const accepted = applications.filter((a) => a.status === 'accepted').length;
    const interview = applications.filter((a) => a.application_stage === 'interview').length;
    const savedJobs = Array.isArray(profile?.saved_jobs) ? profile.saved_jobs.length : 0;
    const active = pending + interview;
    return { total, pending, accepted, interview, savedJobs, active };
  }, [applications, profile]);

  const statsCards = useMemo<JobseekerStatItem[]>(() => {
    return [
      {
        key: 'applications',
        label: 'Applications Sent',
        value: String(derived.total),
        hint: `${derived.active} active in pipeline`,
        progress: Math.min(100, derived.total * 10),
        icon: BriefcaseBusiness,
        iconStyle: 'bg-[#ecf7f1] text-[#0f5d43]',
        barStyle: 'bg-gradient-to-r from-[#2f8e66] to-[#7bc8a0]',
      },
      {
        key: 'pending',
        label: 'Pending',
        value: String(derived.pending),
        hint: 'Awaiting recruiter response',
        progress: Math.min(100, derived.pending * 20),
        icon: CalendarClock,
        iconStyle: 'bg-amber-50 text-amber-600',
        barStyle: 'bg-gradient-to-r from-amber-400 to-amber-300',
      },
      {
        key: 'accepted',
        label: 'Accepted',
        value: String(derived.accepted),
        hint: 'Positive outcomes',
        progress: derived.total > 0 ? Math.round((derived.accepted / derived.total) * 100) : 0,
        icon: Target,
        iconStyle: 'bg-emerald-50 text-emerald-600',
        barStyle: 'bg-gradient-to-r from-emerald-500 to-emerald-300',
      },
      {
        key: 'interviews',
        label: 'Interviews',
        value: String(derived.interview),
        hint: 'Interview stage applications',
        progress: Math.min(100, derived.interview * 30),
        icon: UserCircle2,
        iconStyle: 'bg-violet-50 text-violet-600',
        barStyle: 'bg-gradient-to-r from-violet-500 to-fuchsia-300',
      },
      {
        key: 'savedJobs',
        label: 'Saved Jobs',
        value: String(derived.savedJobs),
        hint: 'Bookmarked opportunities',
        progress: Math.min(100, derived.savedJobs * 25),
        icon: BriefcaseBusiness,
        iconStyle: 'bg-blue-50 text-blue-600',
        barStyle: 'bg-gradient-to-r from-blue-500 to-cyan-300',
      },
      {
        key: 'profile',
        label: 'Profile Completion',
        value: `${profileChecklist.completion}%`,
        hint: 'Improve to unlock better opportunities',
        progress: profileChecklist.completion,
        icon: BarChart3,
        iconStyle: 'bg-cyan-50 text-cyan-700',
        barStyle: 'bg-gradient-to-r from-cyan-500 to-sky-300',
      },
    ];
  }, [derived, profileChecklist.completion]);

  const hasVaultResume = Boolean(profile?.resume_url || vaultResume?.resumeUrl);
  const dynamicInsights = useMemo(() => {
    const source = (vaultResume && vaultResume.careerInsights.length > 0)
      ? vaultResume.careerInsights
      : (profile?.career_insights || []);
    return source.filter(Boolean).slice(0, 3);
  }, [profile, vaultResume]);

  const recommendedJobs = useMemo<RecommendedJob[]>(() => {
    const profileSkills = tokenizeSkills(profile?.skills || '');
    const appliedJobIds = new Set(applications.map((app) => app.job_id));
    return allJobs
      .filter((job) => (job.status || 'open') === 'open' && !appliedJobIds.has(job.id))
      .map((job) => {
        const mode = /remote/i.test(job.location || '') ? 'Remote' : /hybrid/i.test(job.location || '') ? 'Hybrid' : 'Onsite';
        return { job, match: computeMatchPercent(profileSkills, job), mode };
      })
      .sort((a, b) => b.match - a.match)
      .slice(0, 3);
  }, [allJobs, applications, profile]);

  if (!mounted || loading || !user || !profile) {
    return (
      <div className="min-h-screen page-gradient">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <div className="grid xl:grid-cols-[1fr_320px] gap-4">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const firstName = user.full_name.split(' ')[0] || 'there';

  return (
    <PageShell
      variant="jobseeker"
      title="Jobseeker Dashboard"
      subtitle="Your personalized command center for applications, growth, and next opportunities."
    >
      <div className="space-y-4 pb-20 md:pb-0">
        <JobseekerHero
          firstName={firstName}
          avatarUrl={profile.avatar_url || ''}
          applicationsCount={derived.total}
          activeCount={derived.active}
          profileCompletion={profileChecklist.completion}
        />

        <StatsGrid stats={statsCards} />

        <section className="surface-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit className="w-4 h-4 text-[#0f5d43]" />
            <h2 className="font-semibold text-gray-900">Personalized Career Insights</h2>
          </div>
          {!hasVaultResume ? (
            <div className="rounded-xl border border-dashed border-[#0f5d43]/25 bg-[#f7fcf9] p-6 text-center">
              <p className="font-medium text-gray-800">Upload your resume to receive personalized career insights.</p>
              <p className="text-sm text-gray-500 mt-1">We use your actual resume content to generate practical next steps.</p>
              <Link
                href="/jobseeker/profile"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0f5d43] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#0b4f39] transition"
              >
                Upload Resume
              </Link>
            </div>
          ) : dynamicInsights.length === 0 ? (
            <div className="rounded-xl border border-[#0f5d43]/15 bg-[#f7fcf9] p-5 text-sm text-gray-600">
              Insights are being prepared from your latest resume. Try refreshing in a moment, or re-upload if extraction failed.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {dynamicInsights.map((insight, idx) => (
                <div key={`${insight}-${idx}`} className="fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  <InsightCard title={`Insight ${idx + 1}`} body={insight} icon={Sparkles} />
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid xl:grid-cols-[1fr_320px] gap-4 items-start">
          <section className="space-y-4">
            <div className="surface-card rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="font-semibold text-gray-900">Recent Applications</h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#edf7f1] text-[#0f5d43] border border-[#0f5d43]/20">
                  {applications.length} total
                </span>
              </div>
              <ApplicationList
                applications={applications}
                onViewDetails={(application) => router.push(`/jobseeker/jobs/${application.job_id}`)}
              />
            </div>

            <div className="surface-card rounded-2xl p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Jobs Recommended For You</h2>
              <RecommendedJobs jobs={recommendedJobs} />
            </div>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-20">
            <ProfileCompletion completion={profileChecklist.completion} items={profileChecklist.items} />
            <QuickActions />
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-[#0f5d43]/10 bg-white/95 backdrop-blur px-3 py-2">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/jobseeker/jobs"
            className="inline-flex items-center justify-center rounded-xl bg-[#0f5d43] text-white px-3 py-2.5 text-sm font-medium"
          >
            Browse Jobs
          </Link>
          <Link
            href="/jobseeker/profile"
            className="inline-flex items-center justify-center rounded-xl border border-[#0f5d43]/20 text-[#0f5d43] px-3 py-2.5 text-sm font-medium"
          >
            Update Profile
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
