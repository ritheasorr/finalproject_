'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  Download,
  Globe,
  Github,
  Languages,
  Linkedin,
  Mail,
  MapPin,
  Sparkles,
  UserCheck,
} from 'lucide-react';

import Navigation from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { authStore } from '@/store/authStore';
import { JobSeekerProfile, User } from '@/types/user';
import { PremiumBadge, PublicAvatar, SectionCard, StatCard } from '@/components/public-profile/premium-ui';

function parseYearsFromPeriod(period: string) {
  const years = period.match(/\b(19|20)\d{2}\b/g);
  if (!years || years.length === 0) return 0;
  const numericYears = years.map((item) => Number(item)).filter((n) => Number.isFinite(n));
  if (numericYears.length === 0) return 0;
  const start = Math.min(...numericYears);
  const end = Math.max(...numericYears);
  const currentYear = new Date().getFullYear();
  const normalizedEnd = Math.min(Math.max(end, start), currentYear);
  return Math.max(0, normalizedEnd - start + 1);
}

function estimateExperienceYears(profile: JobSeekerProfile) {
  const entries = profile.experience_entries || [];
  const parsed = entries.reduce((acc, entry) => acc + parseYearsFromPeriod(entry.period || ''), 0);
  if (parsed > 0) return parsed;
  return entries.length > 0 ? entries.length : 0;
}

function categorizeSkills(rawSkills: string[]) {
  const categories: Record<string, string[]> = {
    Frontend: [],
    Backend: [],
    Data: [],
    CloudDevOps: [],
    Other: [],
  };

  const frontend = ['react', 'next', 'tailwind', 'html', 'css', 'javascript', 'typescript', 'vue', 'angular'];
  const backend = ['node', 'express', 'fastapi', 'django', 'spring', 'java', 'c#', 'api', 'php'];
  const data = ['python', 'sql', 'postgres', 'mysql', 'mongodb', 'pandas', 'numpy', 'analytics'];
  const cloud = ['docker', 'aws', 'azure', 'gcp', 'kubernetes', 'ci/cd', 'devops'];

  rawSkills.forEach((skill) => {
    const normalized = skill.toLowerCase();
    if (frontend.some((item) => normalized.includes(item))) {
      categories.Frontend.push(skill);
      return;
    }
    if (backend.some((item) => normalized.includes(item))) {
      categories.Backend.push(skill);
      return;
    }
    if (data.some((item) => normalized.includes(item))) {
      categories.Data.push(skill);
      return;
    }
    if (cloud.some((item) => normalized.includes(item))) {
      categories.CloudDevOps.push(skill);
      return;
    }
    categories.Other.push(skill);
  });

  return Object.entries(categories).filter(([, value]) => value.length > 0);
}

function toSentenceCase(text: string) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function PublicJobSeekerProfilePage() {
  const params = useParams();
  const jobseekerId = params?.jobseekerId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');

      const user = authStore.getCurrentUser();
      setCurrentUser(user);

      try {
        const localProfile = authStore.getJobSeekerProfile(jobseekerId);
        let resolvedProfile = localProfile;

        if (user?.id === jobseekerId && user.role === 'jobseeker') {
          const remoteProfile = await authStore.getJobSeekerProfileRemote(jobseekerId);
          resolvedProfile = remoteProfile || localProfile;
        }

        if (!resolvedProfile) {
          setError('Jobseeker profile not found.');
          setProfile(null);
          return;
        }

        setProfile(resolvedProfile);
      } catch {
        setError('Failed to load jobseeker profile.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [jobseekerId]);

  const skills = useMemo(() => {
    if (!profile?.skills) return [];
    return profile.skills
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [profile?.skills]);

  const categorizedSkills = useMemo(() => categorizeSkills(skills), [skills]);

  if (loading) {
    return (
      <div className="min-h-screen page-gradient">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-72 mb-4 rounded-3xl" />
          <Skeleton className="h-64 mb-4 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    const backHref = currentUser?.role === 'jobseeker' ? '/jobseeker/profile' : '/jobseeker/jobs';
    return (
      <div className="min-h-screen page-gradient">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
            <h1 className="text-xl font-semibold text-slate-900">Profile unavailable</h1>
            <p className="text-slate-500 mt-1">{error || 'The requested jobseeker profile could not be loaded.'}</p>
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f5d43] text-white px-4 py-2.5 mt-5 text-sm font-medium hover:bg-[#0b4d38] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fullName = profile.full_name || currentUser?.full_name || 'Candidate';
  const experienceYears = estimateExperienceYears(profile);
  const experienceCount = (profile.experience_entries || []).length;
  const educationCount = (profile.education_entries || []).length;
  const availability = profile.availability_status || 'Open To Hire';
  const languageEntries = profile.languages || [];

  return (
    <div className="min-h-screen page-gradient">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href={currentUser?.role === 'jobseeker' ? '/jobseeker/profile' : '/jobseeker/jobs'}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#0f5d43] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <section className="relative overflow-hidden rounded-[30px] border border-white/70 bg-gradient-to-br from-[#0e6b4f] via-[#0f5d43] to-[#084c37] p-6 md:p-8 text-white shadow-[0_25px_70px_rgba(8,76,55,0.35)]">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#9de5c6]/20 blur-2xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <PublicAvatar name={fullName} imageUrl={profile.avatar_url} sizeClass="w-24 h-24 md:w-28 md:h-28" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-50 drop-shadow-sm">{fullName}</h1>
                  <PremiumBadge label={availability} tone="emerald" className="text-white border-white/40 bg-white/15" />
                  {experienceYears > 0 ? (
                    <PremiumBadge label={`${experienceYears}+ years experience`} tone="blue" className="text-white border-white/40 bg-white/15" />
                  ) : null}
                </div>
                <p className="mt-1 text-slate-100">{profile.professional_title || 'Jobseeker'}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-100">
                  {profile.location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </span>
                  ) : null}
                  {profile.email ? (
                    <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 hover:text-white transition">
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.resume_url ? (
                <a
                  href={profile.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-[#0f5d43] px-4 py-2.5 text-sm font-semibold hover:bg-[#f2fbf6] transition"
                >
                  <Download className="w-4 h-4" />
                  Download Resume
                </a>
              ) : null}
              {profile.email ? (
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15 transition"
                >
                  <Mail className="w-4 h-4" />
                  Contact
                </a>
              ) : null}
            </div>
          </div>

          <div className="relative z-10 mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Skills" value={skills.length} helper="Core capabilities" />
            <StatCard label="Experience Entries" value={experienceCount} helper="Roles listed" />
            <StatCard label="Education" value={educationCount} helper="Academic records" />
            <StatCard label="Availability" value={availability} helper="Current status" />
          </div>
        </section>

        <div className="grid lg:grid-cols-1 gap-5">
          <SectionCard title="About Candidate" subtitle="Professional summary recruiters read first" icon={<Sparkles className="w-5 h-5 text-[#0f5d43]" />}>
            <p className="text-[15px] leading-7 text-slate-700">
              {profile.bio || 'No summary provided yet. Recruiters can still review experience, skills, and education below.'}
            </p>
          </SectionCard>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-5">
          <SectionCard title="Experience Timeline" subtitle="Recent roles and measurable outcomes" icon={<BriefcaseBusiness className="w-5 h-5 text-[#0f5d43]" />}>
            {(profile.experience_entries || []).length === 0 ? (
              <p className="text-sm text-slate-500">No experience entries yet.</p>
            ) : (
              <div className="space-y-4">
                {(profile.experience_entries || []).map((entry, index) => (
                  <div key={`exp-${index}`} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-[#0f5d43]" />
                    <span className="absolute left-[4px] top-5 bottom-[-18px] w-px bg-[#0f5d43]/20" />
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{entry.role || 'Role not specified'}</p>
                          <p className="text-sm text-slate-600">{entry.company || 'Company not specified'}</p>
                        </div>
                        {entry.period ? <PremiumBadge label={entry.period} tone="slate" /> : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{entry.description || 'Achievement details were not provided.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Skills" subtitle="Categorized technical profile" icon={<UserCheck className="w-5 h-5 text-[#0f5d43]" />}>
            {categorizedSkills.length === 0 ? (
              <p className="text-sm text-slate-500">No skills listed yet.</p>
            ) : (
              <div className="space-y-3">
                {categorizedSkills.map(([category, list]) => (
                  <div key={category}>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">{toSentenceCase(category)}</p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((skill) => (
                        <span key={skill} className="inline-flex items-center rounded-xl border border-[#0f5d43]/15 bg-[#f4fbf7] px-2.5 py-1.5 text-xs font-medium text-[#0f5d43]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard title="Portfolio" subtitle="Interactive links to candidate work" icon={<Globe className="w-5 h-5 text-[#0f5d43]" />}>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                { key: 'website', label: 'Website', href: profile.website_url, icon: Globe, tone: 'from-[#e8fff4] to-[#f9fffc]' },
                { key: 'github', label: 'GitHub', href: profile.github_url, icon: Github, tone: 'from-[#eef4ff] to-[#fafcff]' },
                { key: 'linkedin', label: 'LinkedIn', href: profile.linkedin_url, icon: Linkedin, tone: 'from-[#e9f5ff] to-[#f8fcff]' },
              ].map((item) => (
                <a
                  key={item.key}
                  href={item.href || '#'}
                  target={item.href ? '_blank' : undefined}
                  rel={item.href ? 'noreferrer' : undefined}
                  className={`group rounded-2xl border p-4 transition-all ${
                    item.href
                      ? `border-slate-200 bg-gradient-to-br ${item.tone} hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)]`
                      : 'border-dashed border-slate-200 bg-slate-50/60 text-slate-400 pointer-events-none'
                  }`}
                >
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white text-[#0f5d43] border border-[#0f5d43]/10">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.href ? 'Open profile' : 'Not provided'}
                  </p>
                </a>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Languages" subtitle="Communication strengths" icon={<Languages className="w-5 h-5 text-[#0f5d43]" />}>
            {languageEntries.length === 0 ? (
              <p className="text-sm text-slate-500">No languages added yet.</p>
            ) : (
              <div className="space-y-2.5">
                {languageEntries.map((entry, idx) => (
                  <div key={`${entry.name}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900">{entry.name || 'Language'}</span>
                    <PremiumBadge label={entry.fluency || 'Fluency not set'} tone="slate" />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
