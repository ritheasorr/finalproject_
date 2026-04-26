'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CirclePlay,
  Factory,
  Globe,
  HeartHandshake,
  Landmark,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  UserSearch,
  Users,
  WandSparkles,
} from 'lucide-react';
import { authStore } from '@/store/authStore';
import Navigation from '@/components/Navigation';

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Industries', href: '#industries' },
  { label: 'Why Us', href: '#why-us' },
];

const trustedCompanies = ['NovaTech', 'BlueOrbit', 'Horizon Labs', 'PulseWorks', 'SkillForge', 'CloudNexa'];

const howItWorksSteps = [
  {
    title: 'Post Job',
    description: 'Create a role in minutes with clear requirements and preferred qualifications.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'AI Screening',
    description: 'Our model scores resumes by relevance so your team can prioritize quickly.',
    icon: BrainCircuit,
  },
  {
    title: 'Shortlist Candidates',
    description: 'Review top matches, compare candidate highlights, and move forward with confidence.',
    icon: UserSearch,
  },
  {
    title: 'Hire',
    description: 'Collaborate with your team and close roles faster with a structured hiring flow.',
    icon: HeartHandshake,
  },
];

const employerFeatures = [
  'Role templates for faster job posting',
  'AI fit scoring and candidate ranking',
  'Application pipeline with status tracking',
  'Team-friendly collaboration and feedback',
];

const jobSeekerFeatures = [
  'Clean job search with practical filters',
  'Quick apply experience and profile reuse',
  'Transparent status updates after applying',
  'Better visibility into role expectations',
];

const whyChooseUs = [
  {
    title: 'Built for real hiring speed',
    description: 'Reduce first-pass review time and focus your effort where candidate quality is highest.',
    icon: TrendingUp,
  },
  {
    title: 'Human decisions, AI assistance',
    description: 'AI handles prioritization while recruiters stay fully in control of final outcomes.',
    icon: WandSparkles,
  },
  {
    title: 'Designed for both sides',
    description: 'Employers and job seekers get tailored experiences in one connected platform.',
    icon: Layers3,
  },
  {
    title: 'Secure role-based workflows',
    description: 'RBAC keeps actions and visibility aligned with each user role across your system.',
    icon: ShieldCheck,
  },
];

const stats = [
  { value: '68%', label: 'faster initial screening' },
  { value: '12k+', label: 'candidate profiles analyzed' },
  { value: '3.2x', label: 'shortlist efficiency gain' },
  { value: '97%', label: 'recruiter satisfaction score' },
];

const categories = [
  { title: 'Technology', jobs: '1,250 roles', icon: Globe },
  { title: 'Finance', jobs: '620 roles', icon: Landmark },
  { title: 'Healthcare', jobs: '890 roles', icon: Stethoscope },
  { title: 'Manufacturing', jobs: '470 roles', icon: Factory },
  { title: 'Operations', jobs: '540 roles', icon: Building2 },
  { title: 'Marketing', jobs: '380 roles', icon: Target },
];

const floatingCards = [
  { label: 'UX Researcher', meta: '92% fit score', className: 'top-6 -left-3 md:-left-8 float-card' },
  { label: 'Frontend Engineer', meta: 'Strong shortlist', className: 'top-16 -right-3 md:-right-9 float-card delay-200' },
  { label: 'Product Analyst', meta: 'Interview-ready', className: 'bottom-8 left-2 md:-left-10 float-card delay-400' },
];

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="max-w-3xl mx-auto text-center mb-10">
      <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0f5f44] bg-[#eaf4ee] px-3 py-1 rounded-full mb-4">
        <Sparkles className="w-3.5 h-3.5" />
        {eyebrow}
      </div>
      <h2 className="text-3xl md:text-4xl font-bold text-[#043927] leading-tight">{title}</h2>
      <p className="mt-3 text-gray-600">{subtitle}</p>
    </div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
          <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#0f6a4c] shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CategoryCard({
  title,
  jobs,
  icon: Icon,
}: {
  title: string;
  jobs: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface-card surface-card-hover p-5">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0f5a41] to-[#2d8b63] text-white flex items-center justify-center mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-[#043927]">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{jobs}</p>
    </div>
  );
}

export default function RecruiterPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'jobseeker' | 'recruiter' | null>(null);

  useEffect(() => {
    const user = authStore.getCurrentUser();
    setIsLoggedIn(!!user);
    setUserRole(user?.role || null);
  }, []);

  const heroPrimaryHref = isLoggedIn
    ? userRole === 'recruiter'
      ? '/recruiter/jobs/new'
      : '/jobseeker/dashboard'
    : '/signup';
  const dashboardHref = userRole === 'jobseeker' ? '/jobseeker/dashboard' : '/recruiter/dashboard';

  return (
    <div className="min-h-screen page-gradient">
      <Navigation variant="recruiter" links={navLinks} />

      <section className="relative overflow-hidden pb-16 pt-10 sm:pt-14">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-28 -left-20 w-80 h-80 rounded-full bg-[#8ed1ab]/20 blur-3xl" />
          <div className="absolute top-28 -right-16 w-80 h-80 rounded-full bg-[#3b8765]/20 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="hero-shell p-6 sm:p-9 md:p-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 landing-grid-pattern opacity-20 pointer-events-none" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/12 border border-white/20 rounded-full px-4 py-2 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                AI recruiting workflow for modern teams
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold leading-tight mt-5">
                Hire Smarter with AI-Powered Resume Screening
              </h1>
              <p className="text-white/85 text-base sm:text-lg mt-4">
                Post jobs, screen candidates faster, and connect the right talent with the right opportunities.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <Link
                  href={heroPrimaryHref}
                  className="inline-flex items-center gap-2 bg-white text-[#043927] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition surface-card-press"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/jobseeker/jobs"
                  className="inline-flex items-center gap-2 border border-white/45 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition surface-card-press"
                >
                  Browse Jobs
                  <Search className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="relative z-10 mt-10 mx-auto max-w-4xl">
              <div className="surface-card border-white/25 bg-white/10 backdrop-blur-md p-3 sm:p-4">
                <div className="rounded-2xl overflow-hidden border border-white/25 bg-white">
                  <div className="grid md:grid-cols-2">
                    <div className="p-5 text-left">
                      <div className="text-sm text-gray-500">Recruiter workspace</div>
                      <h3 className="text-xl font-semibold text-[#043927] mt-1">AI shortlist overview</h3>
                      <p className="text-sm text-gray-600 mt-2">
                        Ranked candidates, confidence signals, and cleaner decision support in one panel.
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 flex items-center justify-between">
                          <span>Candidate relevance score</span>
                          <span className="font-semibold text-[#0f6a4c]">93%</span>
                        </div>
                        <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 flex items-center justify-between">
                          <span>Average shortlist time</span>
                          <span className="font-semibold text-[#0f6a4c]">-42%</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative min-h-[240px] md:min-h-full">
                      <img
                        src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80"
                        alt="Hiring team discussing shortlisted candidates"
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="eager"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {floatingCards.map((card) => (
                <div
                  key={card.label}
                  className={`hidden md:flex absolute ${card.className} items-center gap-2.5 rounded-xl border border-[#0f5b43]/20 bg-white px-3 py-2 shadow-xl`}
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(card.label)}&background=0f6a4c&color=ffffff&rounded=true&size=80`}
                    alt={card.label}
                    className="w-8 h-8 rounded-full"
                    loading="lazy"
                  />
                  <div className="text-left">
                    <div className="text-xs font-semibold text-[#043927] leading-none">{card.label}</div>
                    <div className="text-[11px] text-gray-600 mt-1">{card.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="surface-card p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 text-center mb-4">Trusted by hiring teams</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {trustedCompanies.map((company) => (
                <div
                  key={company}
                  className="rounded-lg border border-[#0f5b43]/10 bg-white px-3 py-3 text-center text-sm font-semibold text-[#205d47]"
                >
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative surface-card p-3 md:p-4">
              <div className="rounded-2xl overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80"
                  alt="Recruitment analytics dashboard and hiring workflow"
                  className="w-full h-[320px] sm:h-[380px] object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <button
                  type="button"
                  className="absolute left-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#043927] shadow-md"
                >
                  <CirclePlay className="w-4 h-4" />
                  Platform walkthrough
                </button>
              </div>
              <div className="hidden sm:block absolute -right-4 -top-4 rounded-xl bg-white border border-[#0f5b43]/15 shadow-lg px-4 py-3 float-card">
                <div className="text-xs text-gray-500">AI matches reviewed</div>
                <div className="text-lg font-bold text-[#043927]">2,450+</div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0f5f44] bg-[#eaf4ee] px-3 py-1 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                About CareerLaunch
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#043927] leading-tight">
                Built to make hiring smarter, faster, and more confident
              </h2>
              <p className="mt-3 text-gray-600 mb-6">
                CareerLaunch combines job posting, AI-assisted screening, and candidate pipeline visibility into one clean recruiting workflow.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="surface-card p-4">
                  <div className="w-10 h-10 rounded-lg bg-[#e6f4ec] text-[#0f6a4c] flex items-center justify-center mb-3">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-[#043927]">AI-first screening</h3>
                  <p className="text-sm text-gray-600 mt-1">Prioritize top-fit candidates with transparent score signals.</p>
                </div>
                <div className="surface-card p-4">
                  <div className="w-10 h-10 rounded-lg bg-[#e6f4ec] text-[#0f6a4c] flex items-center justify-center mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-[#043927]">Team collaboration</h3>
                  <p className="text-sm text-gray-600 mt-1">Share candidate context and align decisions across stakeholders.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How It Works"
            title="From job post to signed hire in four clear steps"
            subtitle="Structured flow keeps your hiring team aligned and reduces process friction."
          />
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {howItWorksSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="surface-card surface-card-hover p-5 relative">
                  <div className="text-xs font-semibold text-[#0f6a4c] mb-2">Step {idx + 1}</div>
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0e5d43] to-[#2f8e66] text-white flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#043927]">{step.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Platform Features"
            title="Purpose-built experiences for employers and job seekers"
            subtitle="Both sides get focused tools while staying connected in one hiring ecosystem."
          />
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="surface-card overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
                alt="Recruitment team working together"
                className="w-full h-48 object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="p-5">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6a4c] mb-4">
                  <Building2 className="w-4 h-4" />
                  For Employers
                </div>
                <FeatureList items={employerFeatures} />
              </div>
            </div>
            <div className="surface-card overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80"
                alt="Job seeker browsing roles on laptop"
                className="w-full h-48 object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="p-5">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6a4c] mb-4">
                  <Search className="w-4 h-4" />
                  For Job Seekers
                </div>
                <FeatureList items={jobSeekerFeatures} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why-us" className="py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why Choose Us"
            title="Modern hiring quality without the complexity"
            subtitle="Clear UX, strong data signals, and practical workflows make every hiring cycle more efficient."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {whyChooseUs.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="surface-card surface-card-hover p-5">
                  <div className="w-10 h-10 rounded-lg bg-[#e7f5ed] text-[#0f6a4c] flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-[#043927]">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hero-shell p-8 md:p-10 text-white">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-6 text-center">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/80 mt-2">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="industries" className="py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Industries"
            title="Discover hiring demand across key job categories"
            subtitle="Explore opportunities and talent pipelines in growing sectors."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.title} title={category.title} jobs={category.jobs} icon={category.icon} />
            ))}
          </div>
        </div>
      </section>

      <section className="pt-8 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hero-shell text-white p-8 md:p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 landing-grid-pattern opacity-20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to hire smarter and faster?</h2>
              <p className="mt-3 text-white/85 max-w-2xl mx-auto">
                Join teams using AI-powered screening to post roles, shortlist top candidates, and close hiring loops with confidence.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href={isLoggedIn ? dashboardHref : '/signup'}
                  className="inline-flex items-center gap-2 bg-white text-[#043927] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/jobseeker/jobs"
                  className="inline-flex items-center gap-2 border border-white/45 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition"
                >
                  Browse Jobs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
