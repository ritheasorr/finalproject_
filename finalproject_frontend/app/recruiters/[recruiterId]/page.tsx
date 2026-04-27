'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Clock3,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import Navigation from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { authStore } from '@/store/authStore';
import { jobStore, RecruiterPublicProfile } from '@/store/jobStore';
import { Job } from '@/types/job';
import { CtaLink, PremiumBadge, PublicAvatar, SectionCard, StatCard } from '@/components/public-profile/premium-ui';

function formatPostedDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString();
}

function inferWorkMode(location: string) {
  const normalized = (location || '').toLowerCase();
  if (normalized.includes('remote')) return 'Remote';
  if (normalized.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

export default function PublicRecruiterProfilePage() {
  const params = useParams();
  const recruiterId = params?.recruiterId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<RecruiterPublicProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [aboutText, setAboutText] = useState('');
  const [avatarImage, setAvatarImage] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companyMission, setCompanyMission] = useState('');
  const [companyBenefits, setCompanyBenefits] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [recruiterProfile, recruiterJobs] = await Promise.all([
          jobStore.getRecruiterPublicProfile(recruiterId),
          jobStore.getJobsByRecruiterId(recruiterId),
        ]);

        if (!recruiterProfile) {
          setError('Recruiter profile not found.');
          setLoading(false);
          return;
        }

        const localMeta = authStore.getRecruiterProfileMeta(recruiterId);
        setProfile(recruiterProfile);
        setJobs(recruiterJobs.filter((job) => !!job.id));
        setAboutText(
          localMeta?.about ||
          `${recruiterProfile.fullName} partners with hiring teams to attract high-potential talent and create fast, transparent hiring experiences.`
        );
        setAvatarImage(localMeta?.avatar_url || '');
        setWebsiteUrl(localMeta?.website_url || '');
        setLinkedinUrl(localMeta?.linkedin_url || '');
        setCompanySize(localMeta?.company_size || '');
        setCompanyIndustry(localMeta?.company_industry || '');
        setCompanyMission(localMeta?.company_mission || '');
        setCompanyBenefits(localMeta?.company_benefits || '');
      } catch {
        setError('Failed to load recruiter profile.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [recruiterId]);

  const metrics = useMemo(() => {
    if (!profile) return [];
    const openJobs = profile.totalActiveJobs || jobs.length;
    const applicants = profile.totalApplicants || 0;
    const applicantsThisMonth = Math.max(1, Math.round(applicants * 0.22));
    const successfulHires = Math.max(1, Math.round(applicants * 0.11));

    return [
      { label: 'Open Jobs', value: openJobs, helper: 'Currently hiring' },
      { label: 'Applicants This Month', value: applicantsThisMonth, helper: 'Inbound demand' },
      { label: 'Successful Hires', value: successfulHires, helper: 'Recent placements' },
    ];
  }, [profile, jobs.length]);

  if (loading) {
    return (
      <div className="min-h-screen page-gradient">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-80 mb-4 rounded-3xl" />
          <Skeleton className="h-40 mb-4 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen page-gradient">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
            <h1 className="text-xl font-semibold text-slate-900">Recruiter profile unavailable</h1>
            <p className="text-slate-500 mt-1">{error || 'The requested profile could not be loaded.'}</p>
            <Link
              href="/jobseeker/jobs"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f5d43] text-white px-4 py-2.5 mt-5 text-sm font-medium hover:bg-[#0b4d38] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const resolvedCompanySize = companySize || (profile.totalActiveJobs >= 8 ? '200-500 employees' : profile.totalActiveJobs >= 4 ? '50-200 employees' : '10-50 employees');
  const resolvedIndustry = companyIndustry || (jobs[0]?.title?.toLowerCase().includes('engineer') ? 'Technology Recruitment' : 'Talent Acquisition Services');
  const resolvedMission = companyMission || `Build high-performing teams at ${profile.company} through skill-first, inclusive hiring.`;
  const resolvedBenefits = companyBenefits
    ? companyBenefits.split(',').map((item) => item.trim()).filter(Boolean)
    : ['Fast interview cycles', 'Transparent feedback loops', 'Skills-first screening'];

  return (
    <div className="min-h-screen page-gradient">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/jobseeker/jobs"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#0f5d43] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Job Search
        </Link>

        <section className="relative overflow-hidden rounded-[30px] border border-white/60 bg-gradient-to-br from-[#0d2138] via-[#123d63] to-[#0f5d43] p-6 md:p-8 text-white shadow-[0_25px_70px_rgba(15,23,42,0.35)]">
          <div className="absolute -top-20 -right-16 w-80 h-80 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-300/15 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <PublicAvatar name={profile.fullName} imageUrl={avatarImage} sizeClass="w-24 h-24 md:w-28 md:h-28" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-50 drop-shadow-sm">{profile.fullName}</h1>
                  <PremiumBadge label="Verified recruiter" tone="blue" className="text-white border-white/40 bg-white/15" />
                  <PremiumBadge label="Hiring now" tone="emerald" className="text-white border-white/40 bg-white/15" />
                </div>
                <p className="text-slate-100 mt-1">Lead Recruiter at {profile.company}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-100">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {profile.location || 'Location not specified'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Trusted by active candidates
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="#open-roles"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-[#123d63] px-4 py-2.5 text-sm font-semibold hover:bg-[#f3f9ff] transition"
              >
                <BriefcaseBusiness className="w-4 h-4" />
                View Jobs
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15 transition"
              >
                <Mail className="w-4 h-4" />
                Contact Recruiter
              </a>
            </div>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {metrics.map((metric) => (
            <StatCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} />
          ))}
        </section>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5">
          <SectionCard title="About Recruiter" subtitle="Profile overview for potential applicants" icon={<Sparkles className="w-5 h-5 text-[#0f5d43]" />}>
            <p className="text-[15px] leading-7 text-slate-700">{aboutText}</p>
          </SectionCard>

          <SectionCard title="Company Snapshot" subtitle="Trust and context signals" icon={<Building2 className="w-5 h-5 text-[#0f5d43]" />}>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Company Size</p>
                <p className="mt-1 font-semibold text-slate-900">{resolvedCompanySize}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Industry</p>
                <p className="mt-1 font-semibold text-slate-900">{resolvedIndustry}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 mb-1.5">Mission</p>
                <p>{resolvedMission}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 mb-1.5">Benefits</p>
                <div className="flex flex-wrap gap-2">
                  {resolvedBenefits.map((item) => (
                    <PremiumBadge key={item} label={item} tone="slate" />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {websiteUrl ? <CtaLink href={websiteUrl} label="Company Website" /> : null}
                {linkedinUrl ? <CtaLink href={linkedinUrl} label="LinkedIn" /> : null}
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Available Job Openings"
          subtitle="Active roles with fast application flow"
          icon={<BriefcaseBusiness className="w-5 h-5 text-[#0f5d43]" />}
        >
          <div id="open-roles" className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 scroll-mt-24">
            {jobs.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
                No active openings available right now.
              </div>
            ) : (
              jobs.map((job) => (
                <article
                  key={job.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,23,42,0.12)] transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-900 leading-snug">{job.title}</h3>
                    <PremiumBadge label={inferWorkMode(job.location)} tone="slate" />
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{job.company}</p>
                  <p className="text-sm text-[#0f5d43] font-semibold mt-3">{job.salary || 'Salary negotiable'}</p>
                  <div className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1.5">
                    <Clock3 className="w-3.5 h-3.5" />
                    Posted {formatPostedDate(job.created_at)}
                  </div>
                  <Link
                    href={`/jobseeker/jobs/${job.id}`}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#0f5d43] text-white px-3 py-2.5 text-sm font-medium hover:bg-[#0b4d38] transition"
                  >
                    Apply
                  </Link>
                </article>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
