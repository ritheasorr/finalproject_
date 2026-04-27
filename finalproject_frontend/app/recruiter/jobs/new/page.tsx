'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDashed,
  Cpu,
  DollarSign,
  Eye,
  Image as ImageIcon,
  Save,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/ui/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { JobType, SalaryPeriod, StructuredJobPostFormData, WorkArrangement } from '@/types/job';

type WizardStep = 0 | 1 | 2 | 3 | 4;
type SidebarTab = 'preview' | 'ai' | 'branding';
type SalaryCurrency = 'USD' | 'THB' | 'EUR' | 'GBP';
type FormState = StructuredJobPostFormData;

const STORAGE_KEY = 'careerlaunch_recruiter_job_draft_v2';
const stepTitles = ['Basic Info', 'Requirements', 'Compensation', 'Branding', 'Publish'];
const workArrangementOptions: Array<{ value: WorkArrangement; label: string; helper: string }> = [
  { value: 'onsite', label: 'On-site', helper: 'Role is performed in-office at a fixed location.' },
  { value: 'hybrid', label: 'Hybrid', helper: 'Mix of on-site collaboration and remote flexibility.' },
  { value: 'remote', label: 'Remote', helper: 'Role can be done remotely; define timezone expectations.' },
];

const defaultState: FormState = {
  title: '',
  employmentType: 'FULLTIME',
  department: '',
  roleOverview: '',
  responsibilities: '',
  requiredSkills: [],
  bonusSkills: [],
  educationRequirement: '',
  experienceLevel: '',
  workArrangement: 'onsite',
  location: '',
  benefits: [],
  languages: [],
  certificates: [],
  salary: {
    currency: 'USD',
    min: '',
    max: '',
    period: 'monthly',
    negotiable: false,
    hidden: false,
  },
  imageUrl: '',
  aiScoring: {
    enabled: true,
    weights: {
      skills: 50,
      experience: 30,
      education: 20,
    },
  },
  status: 'draft',
};

function isValidUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

function formatSalaryDisplay(salary: FormState['salary']): string {
  if (salary.hidden) return 'Salary hidden';
  if (salary.negotiable) return 'Negotiable';
  if (!salary.min || !salary.max) return 'Add salary range';
  const symbol = salary.currency === 'USD' ? '$' : salary.currency === 'THB' ? '฿' : salary.currency === 'EUR' ? '€' : '£';
  return `${symbol}${salary.min} - ${symbol}${salary.max} / ${salary.period.replace('ly', '')}`;
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeWeights(weights: FormState['aiScoring']['weights']): FormState['aiScoring']['weights'] {
  const total = weights.skills + weights.experience + weights.education;
  if (total <= 0) {
    return { skills: 50, experience: 30, education: 20 };
  }
  const skills = Math.round((weights.skills / total) * 100);
  const experience = Math.round((weights.experience / total) * 100);
  const education = Math.max(0, 100 - skills - experience);
  return { skills, experience, education };
}

function composeDescription(form: FormState): string {
  const sections = [
    `Role overview: ${form.roleOverview.trim()}`,
    form.department.trim() ? `Department: ${form.department.trim()}` : '',
    `Work arrangement: ${
      form.workArrangement === 'onsite' ? 'On-site' : form.workArrangement === 'hybrid' ? 'Hybrid' : 'Remote'
    }`,
    form.location.trim() ? `Location: ${form.location.trim()}` : '',
    form.experienceLevel ? `Experience: ${form.experienceLevel}` : '',
    form.educationRequirement ? `Education: ${form.educationRequirement}` : '',
    splitLines(form.responsibilities).length > 0
      ? `Responsibilities:\n${splitLines(form.responsibilities).map((line) => `- ${line}`).join('\n')}`
      : '',
    form.benefits.length > 0 ? `Benefits: ${form.benefits.join(', ')}` : '',
    form.languages.length > 0 ? `Languages: ${form.languages.join(', ')}` : '',
    form.certificates.length > 0 ? `Certificates: ${form.certificates.join(', ')}` : '',
    form.bonusSkills.length > 0 ? `Bonus skills: ${form.bonusSkills.join(', ')}` : '',
    form.aiScoring.enabled
      ? `AI scoring weights - Skills ${form.aiScoring.weights.skills}%, Experience ${form.aiScoring.weights.experience}%, Education ${form.aiScoring.weights.education}%`
      : 'AI resume scoring disabled',
  ].filter(Boolean);
  return sections.join('\n\n');
}

export default function PostJobPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<WizardStep>(0);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('preview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(defaultState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [companyName, setCompanyName] = useState('CareerLaunch');
  const [recruiterName, setRecruiterName] = useState('Recruiter');
  const [showAdvancedRequirements, setShowAdvancedRequirements] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = authStore.getCurrentUser();
    if (!currentUser || currentUser.role !== 'recruiter') {
      router.push('/login');
      return;
    }

    const load = async () => {
      try {
        const localDraft = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        if (localDraft) {
          const parsed = JSON.parse(localDraft) as FormState;
          setForm((prev) => ({ ...prev, ...parsed }));
        }

        const profileMeta = authStore.getRecruiterProfileMeta(currentUser.id);
        if (profileMeta?.company) setCompanyName(profileMeta.company);
        setRecruiterName(currentUser.full_name || 'Recruiter');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  useEffect(() => {
    if (!form.imageUrl.trim()) setBannerFailed(false);
  }, [form.imageUrl]);

  const aiWeightTotal = useMemo(
    () => form.aiScoring.weights.skills + form.aiScoring.weights.experience + form.aiScoring.weights.education,
    [form.aiScoring.weights]
  );

  const salaryDisplay = useMemo(() => formatSalaryDisplay(form.salary), [form.salary]);

  const publicPreviewDescription = useMemo(() => {
    const content = form.roleOverview.trim();
    if (!content) return 'Your role overview will appear here as candidates browse your listing.';
    return content.length > 180 ? `${content.slice(0, 180)}...` : content;
  }, [form.roleOverview]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateSalary = <K extends keyof FormState['salary']>(key: K, value: FormState['salary'][K]) => {
    setForm((prev) => ({
      ...prev,
      salary: { ...prev.salary, [key]: value },
    }));
    setErrors((prev) => ({ ...prev, [`salary.${key}`]: '' }));
  };

  const updateAiWeight = (target: keyof FormState['aiScoring']['weights'], nextValue: number) => {
    const clamped = Math.max(0, Math.min(100, Number.isFinite(nextValue) ? nextValue : 0));
    const others = (['skills', 'experience', 'education'] as const).filter((key) => key !== target);
    const currentOthersTotal = others.reduce((sum, key) => sum + form.aiScoring.weights[key], 0);
    const remaining = Math.max(0, 100 - clamped);

    const nextWeights: FormState['aiScoring']['weights'] = {
      ...form.aiScoring.weights,
      [target]: clamped,
      [others[0]]: 0,
      [others[1]]: 0,
    };

    if (currentOthersTotal <= 0) {
      nextWeights[others[0]] = Math.round(remaining / 2);
      nextWeights[others[1]] = remaining - nextWeights[others[0]];
    } else {
      nextWeights[others[0]] = Math.round((form.aiScoring.weights[others[0]] / currentOthersTotal) * remaining);
      nextWeights[others[1]] = remaining - nextWeights[others[0]];
    }

    setForm((prev) => ({
      ...prev,
      aiScoring: {
        ...prev.aiScoring,
        weights: nextWeights,
      },
    }));
    setErrors((prev) => ({ ...prev, 'ai.weights': '' }));
  };

  const validateForm = (step?: WizardStep): Record<string, string> => {
    const next: Record<string, string> = {};
    const validateStep = (s: WizardStep) => step === undefined || step === s;

    if (validateStep(0)) {
      if (!form.title.trim()) next.title = 'Job title is required.';
      if (!form.employmentType) next.employmentType = 'Select an employment type.';
      if (!form.roleOverview.trim()) next.roleOverview = 'Share a role overview for candidates.';
    }

    if (validateStep(1)) {
      if (form.requiredSkills.length === 0) next.requiredSkills = 'Add at least one required skill.';
      if (!form.experienceLevel) next.experienceLevel = 'Choose expected experience level.';
      if (!form.educationRequirement) next.educationRequirement = 'Choose an education requirement.';
    }

    if (validateStep(2)) {
      if (!form.workArrangement) next.workArrangement = 'Select work arrangement.';
      if (form.workArrangement !== 'remote' && !form.location.trim()) {
        next.location = 'Location is required for on-site or hybrid roles.';
      }
      if (!form.salary.hidden && !form.salary.negotiable) {
        if (!form.salary.min.trim()) next['salary.min'] = 'Minimum salary is required.';
        if (!form.salary.max.trim()) next['salary.max'] = 'Maximum salary is required.';
        if (!form.salary.period) next['salary.period'] = 'Salary period is required.';
        const min = Number(form.salary.min);
        const max = Number(form.salary.max);
        if (Number.isFinite(min) && Number.isFinite(max) && max < min) {
          next['salary.max'] = 'Maximum salary should be greater than minimum salary.';
        }
      }
    }

    if (validateStep(3)) {
      if (form.imageUrl.trim() && !isValidUrl(form.imageUrl)) {
        next.imageUrl = 'Please provide a valid image URL.';
      }
      if (form.aiScoring.enabled && aiWeightTotal !== 100) {
        next['ai.weights'] = 'AI scoring weights must total 100%.';
      }
    }

    return next;
  };

  const goNext = () => {
    const stepErrors = validateForm(activeStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      toast.error('Please complete required fields before continuing.');
      return;
    }
    setErrors((prev) => ({ ...prev, ...stepErrors }));
    setActiveStep((prev) => Math.min(4, prev + 1) as WizardStep);
  };

  const goBack = () => {
    setActiveStep((prev) => Math.max(0, prev - 1) as WizardStep);
  };

  const handleSaveDraft = () => {
    try {
      // TODO: Replace local draft persistence with backend draft endpoint when available.
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...form, status: 'draft' }));
      }
      setForm((prev) => ({ ...prev, status: 'draft' }));
      toast.success('Draft saved locally.');
    } catch {
      toast.error('Unable to save draft right now.');
    }
  };

  const handlePreview = () => {
    setActiveSidebarTab('preview');
    setActiveStep(4);
    toast.success('Preview updated. Review details before publishing.');
  };

  const publishDisabled = useMemo(() => Object.keys(validateForm()).length > 0 || isSubmitting, [form, isSubmitting, aiWeightTotal]);

  const handlePublish = async () => {
    const publishErrors = validateForm();
    if (Object.keys(publishErrors).length > 0) {
      setErrors(publishErrors);
      toast.error('Please fix validation issues before publishing.');
      return;
    }

    const currentUser = authStore.getCurrentUser();
    if (!currentUser || currentUser.role !== 'recruiter') {
      router.push('/login');
      return;
    }

    try {
      setIsSubmitting(true);
      const recruiterMeta = authStore.getRecruiterProfileMeta(currentUser.id);

      const payloadSkills = [...form.requiredSkills, ...form.bonusSkills].filter(
        (skill, idx, arr) => skill && arr.findIndex((item) => item.toLowerCase() === skill.toLowerCase()) === idx
      );

      await jobStore.createJob({
        title: form.title.trim(),
        type: form.employmentType.toLowerCase(),
        company: recruiterMeta?.company || companyName || 'CareerLaunch',
        salary: salaryDisplay,
        imageUrl: form.imageUrl.trim(),
        location: form.workArrangement === 'remote' ? (form.location.trim() || 'Remote') : form.location.trim(),
        description: composeDescription(form),
        skills: payloadSkills,
      });

      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }

      setForm((prev) => ({ ...prev, status: 'published' }));
      toast.success('Job published successfully');
      router.push('/recruiter/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish job';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen page-gradient flex items-center justify-center">
        <div className="w-full max-w-7xl px-4">
          <Skeleton className="h-16 rounded-2xl mb-4" />
          <Skeleton className="h-[760px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <PageShell
      variant="recruiter"
      title="Post a New Job"
      subtitle="Structured hiring workflow built for modern recruiter teams"
      actions={
        <Link href="/recruiter/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#0f5d43] transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      }
    >
      <div className="space-y-4">
        <section className="surface-card rounded-2xl p-4 sm:p-5 relative overflow-hidden border border-[#0f5d43]/10 bg-gradient-to-r from-white via-[#f7fcf9] to-[#eff8f3]">
          <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-[#72bf98]/20 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-semibold text-gray-900">Posting Flow</h2>
              <span className="text-xs text-gray-600">Step {activeStep + 1} of {stepTitles.length}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {stepTitles.map((title, idx) => {
                const isActive = idx === activeStep;
                const isDone = idx < activeStep;
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setActiveStep(idx as WizardStep)}
                    className={`text-left rounded-xl border px-3 py-2.5 transition ${
                      isActive
                        ? 'border-[#0f5d43] bg-[#edf7f1]'
                        : isDone
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-gray-200 bg-white hover:border-[#0f5d43]/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs mb-1">
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <CircleDashed className="w-3.5 h-3.5 text-gray-400" />}
                      <span className={`${isActive ? 'text-[#0f5d43]' : 'text-gray-500'}`}>Step {idx + 1}</span>
                    </div>
                    <div className={`text-sm font-medium ${isActive ? 'text-[#0f5d43]' : 'text-gray-800'}`}>{title}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid xl:grid-cols-[1.3fr_430px] gap-4 items-start">
          <div className="space-y-4">
            <div className="surface-card rounded-2xl p-4 sm:p-5 border border-[#0f5d43]/10 bg-white/95 backdrop-blur">
              {activeStep === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#0f5d43]">
                    <BriefcaseBusiness className="w-4 h-4" />
                    <h3 className="font-semibold">Step 1: Basic Info</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Job title *</label>
                      <input
                        value={form.title}
                        onChange={(e) => {
                          updateForm('title', e.target.value);
                          setErrors((prev) => ({ ...prev, title: '' }));
                        }}
                        placeholder="Example: Senior Frontend Engineer, Growth Team"
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                          errors.title ? 'border-red-400' : 'border-[#0f5d43]/15'
                        }`}
                      />
                      {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Employment type *</label>
                      <select
                        value={form.employmentType}
                        onChange={(e) => {
                          updateForm('employmentType', e.target.value as JobType);
                          setErrors((prev) => ({ ...prev, employmentType: '' }));
                        }}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                          errors.employmentType ? 'border-red-400' : 'border-[#0f5d43]/15'
                        }`}
                      >
                        <option value="FULLTIME">Full-Time</option>
                        <option value="PARTTIME">Part-Time</option>
                        <option value="INTERNSHIP">Internship</option>
                      </select>
                      {errors.employmentType && <p className="text-xs text-red-600 mt-1">{errors.employmentType}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                      <input
                        value={form.department}
                        onChange={(e) => updateForm('department', e.target.value)}
                        placeholder="Example: Product Engineering"
                        className="w-full rounded-xl border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Role overview *</label>
                      <textarea
                        rows={5}
                        value={form.roleOverview}
                        onChange={(e) => {
                          updateForm('roleOverview', e.target.value);
                          setErrors((prev) => ({ ...prev, roleOverview: '' }));
                        }}
                        placeholder="What will this hire own in the first 90 days?"
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                          errors.roleOverview ? 'border-red-400' : 'border-[#0f5d43]/15'
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">Use 3-5 sentences to explain impact, outcomes, and team context.</p>
                      {errors.roleOverview && <p className="text-xs text-red-600 mt-1">{errors.roleOverview}</p>}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#0f5d43]">
                    <CheckCircle2 className="w-4 h-4" />
                    <h3 className="font-semibold">Step 2: Job Requirements</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Key responsibilities</label>
                    <textarea
                      rows={5}
                      value={form.responsibilities}
                      onChange={(e) => updateForm('responsibilities', e.target.value)}
                      placeholder="List responsibilities line by line. Example: Lead sprint planning and delivery cadence."
                      className="w-full rounded-xl border border-[#0f5d43]/15 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                    />
                    <p className="text-xs text-gray-500 mt-1">Structured responsibilities help jobseekers self-qualify faster.</p>
                  </div>

                  <ChipInput
                    label="Required skills *"
                    helper="Which skills are truly required to succeed in this role?"
                    placeholder="Type a skill and press Enter (e.g., React)"
                    values={form.requiredSkills}
                    error={errors.requiredSkills}
                    onAdd={(value) => {
                      updateForm(
                        'requiredSkills',
                        [...form.requiredSkills, value].filter((item, idx, arr) => arr.findIndex((v) => v.toLowerCase() === item.toLowerCase()) === idx)
                      );
                      setErrors((prev) => ({ ...prev, requiredSkills: '' }));
                    }}
                    onRemove={(value) =>
                      updateForm(
                        'requiredSkills',
                        form.requiredSkills.filter((item) => item.toLowerCase() !== value.toLowerCase())
                      )
                    }
                  />

                  <ChipInput
                    label="Optional / bonus skills"
                    helper="Bonus skills improve ranking but are not mandatory."
                    placeholder="Type a bonus skill and press Enter"
                    values={form.bonusSkills}
                    onAdd={(value) => {
                      updateForm(
                        'bonusSkills',
                        [...form.bonusSkills, value].filter((item, idx, arr) => arr.findIndex((v) => v.toLowerCase() === item.toLowerCase()) === idx)
                      );
                    }}
                    onRemove={(value) =>
                      updateForm(
                        'bonusSkills',
                        form.bonusSkills.filter((item) => item.toLowerCase() !== value.toLowerCase())
                      )
                    }
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Education requirement *</label>
                      <select
                        value={form.educationRequirement}
                        onChange={(e) => {
                          updateForm('educationRequirement', e.target.value);
                          setErrors((prev) => ({ ...prev, educationRequirement: '' }));
                        }}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                          errors.educationRequirement ? 'border-red-400' : 'border-[#0f5d43]/15'
                        }`}
                      >
                        <option value="">Select requirement</option>
                        <option value="No formal degree required">No formal degree required</option>
                        <option value="Associate degree preferred">Associate degree preferred</option>
                        <option value="Bachelor degree preferred">Bachelor degree preferred</option>
                        <option value="Bachelor degree required">Bachelor degree required</option>
                        <option value="Master degree preferred">Master degree preferred</option>
                      </select>
                      {errors.educationRequirement && <p className="text-xs text-red-600 mt-1">{errors.educationRequirement}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience level *</label>
                      <select
                        value={form.experienceLevel}
                        onChange={(e) => {
                          updateForm('experienceLevel', e.target.value);
                          setErrors((prev) => ({ ...prev, experienceLevel: '' }));
                        }}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                          errors.experienceLevel ? 'border-red-400' : 'border-[#0f5d43]/15'
                        }`}
                      >
                        <option value="">Select level</option>
                        <option value="Entry-level (0-2 years)">Entry-level (0-2 years)</option>
                        <option value="Mid-level (3-5 years)">Mid-level (3-5 years)</option>
                        <option value="Senior (5-8 years)">Senior (5-8 years)</option>
                        <option value="Lead / Principal (8+ years)">Lead / Principal (8+ years)</option>
                      </select>
                      {errors.experienceLevel && <p className="text-xs text-red-600 mt-1">{errors.experienceLevel}</p>}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#0f5d43]/12 bg-[#f8fcfa] p-3">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedRequirements((prev) => !prev)}
                      className="w-full flex items-center justify-between text-sm font-medium text-[#0f5d43]"
                    >
                      <span>Advanced requirements (optional)</span>
                      <ArrowRight className={`w-4 h-4 transition ${showAdvancedRequirements ? 'rotate-90' : ''}`} />
                    </button>
                    {showAdvancedRequirements && (
                      <div className="mt-3 space-y-3">
                        <ChipInput
                          label="Benefits"
                          helper="Highlight perks that improve acceptance rates."
                          placeholder="Add a benefit (e.g., Hybrid allowance)"
                          values={form.benefits}
                          onAdd={(value) => updateForm('benefits', [...form.benefits, value])}
                          onRemove={(value) => updateForm('benefits', form.benefits.filter((item) => item !== value))}
                        />
                        <ChipInput
                          label="Languages"
                          helper="Add language requirements only when important for the role."
                          placeholder="Add a language"
                          values={form.languages}
                          onAdd={(value) => updateForm('languages', [...form.languages, value])}
                          onRemove={(value) => updateForm('languages', form.languages.filter((item) => item !== value))}
                        />
                        <ChipInput
                          label="Certificates"
                          helper="Optional certifications that improve match confidence."
                          placeholder="Add a certificate"
                          values={form.certificates}
                          onAdd={(value) => updateForm('certificates', [...form.certificates, value])}
                          onRemove={(value) => updateForm('certificates', form.certificates.filter((item) => item !== value))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#0f5d43]">
                    <DollarSign className="w-4 h-4" />
                    <h3 className="font-semibold">Step 3: Compensation &amp; Location</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work arrangement *</label>
                    <div className="grid sm:grid-cols-3 gap-2">
                      {workArrangementOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            updateForm('workArrangement', option.value);
                            setErrors((prev) => ({ ...prev, workArrangement: '' }));
                          }}
                          className={`text-left rounded-xl border p-3 transition ${
                            form.workArrangement === option.value
                              ? 'border-[#0f5d43] bg-[#edf7f1]'
                              : 'border-gray-200 hover:border-[#0f5d43]/30 bg-white'
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-900">{option.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{option.helper}</p>
                        </button>
                      ))}
                    </div>
                    {errors.workArrangement && <p className="text-xs text-red-600 mt-1.5">{errors.workArrangement}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Location {form.workArrangement === 'remote' ? '(optional)' : '*'}
                    </label>
                    <input
                      value={form.location}
                      onChange={(e) => {
                        updateForm('location', e.target.value);
                        setErrors((prev) => ({ ...prev, location: '' }));
                      }}
                      placeholder={form.workArrangement === 'remote' ? 'Timezone or preferred region' : 'City, country'}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                        errors.location ? 'border-red-400' : 'border-[#0f5d43]/15'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">Candidates use this to decide fit quickly.</p>
                    {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
                  </div>

                  <div className="rounded-xl border border-[#0f5d43]/12 bg-[#f8fcfa] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">Salary setup</h4>
                      <span className="text-xs text-[#0f5d43]">{salaryDisplay}</span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                        <select
                          value={form.salary.currency}
                          onChange={(e) => updateSalary('currency', e.target.value as SalaryCurrency)}
                          className="w-full rounded-lg border border-[#0f5d43]/15 px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                        >
                          <option value="USD">USD</option>
                          <option value="THB">THB</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Min salary</label>
                        <input
                          value={form.salary.min}
                          onChange={(e) => updateSalary('min', e.target.value)}
                          placeholder="800"
                          className={`w-full rounded-lg border px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                            errors['salary.min'] ? 'border-red-400' : 'border-[#0f5d43]/15'
                          }`}
                        />
                        {errors['salary.min'] && <p className="text-xs text-red-600 mt-1">{errors['salary.min']}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Max salary</label>
                        <input
                          value={form.salary.max}
                          onChange={(e) => updateSalary('max', e.target.value)}
                          placeholder="1200"
                          className={`w-full rounded-lg border px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                            errors['salary.max'] ? 'border-red-400' : 'border-[#0f5d43]/15'
                          }`}
                        />
                        {errors['salary.max'] && <p className="text-xs text-red-600 mt-1">{errors['salary.max']}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Salary period</label>
                        <select
                          value={form.salary.period}
                          onChange={(e) => updateSalary('period', e.target.value as SalaryPeriod)}
                          className={`w-full rounded-lg border px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                            errors['salary.period'] ? 'border-red-400' : 'border-[#0f5d43]/15'
                          }`}
                        >
                          <option value="hourly">Hourly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={form.salary.negotiable}
                          onChange={(e) => updateSalary('negotiable', e.target.checked)}
                        />
                        Negotiable compensation
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={form.salary.hidden}
                          onChange={(e) => updateSalary('hidden', e.target.checked)}
                        />
                        Hide salary from applicants
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">If salary is negotiable or hidden, numeric fields are optional.</p>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#0f5d43]">
                    <ImageIcon className="w-4 h-4" />
                    <h3 className="font-semibold">Step 4: Branding &amp; AI Setup</h3>
                  </div>

                  <div className="rounded-xl border border-[#0f5d43]/12 bg-[#f8fcfa] p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Job banner image URL</label>
                    <input
                      value={form.imageUrl}
                      onChange={(e) => {
                        updateForm('imageUrl', e.target.value);
                        setErrors((prev) => ({ ...prev, imageUrl: '' }));
                      }}
                      placeholder="Paste a team photo or office banner URL"
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                        errors.imageUrl ? 'border-red-400' : 'border-[#0f5d43]/15'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">If empty or invalid, a premium fallback gradient is shown.</p>
                    {errors.imageUrl && <p className="text-xs text-red-600 mt-1">{errors.imageUrl}</p>}
                  </div>

                  <div className="rounded-xl border border-[#0f5d43]/12 bg-[#f8fcfa] p-4 space-y-3">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
                      <input
                        type="checkbox"
                        checked={form.aiScoring.enabled}
                        onChange={(e) => updateForm('aiScoring', { ...form.aiScoring, enabled: e.target.checked })}
                      />
                      Enable AI Resume Scoring
                    </label>
                    <p className="text-xs text-gray-500">Use weighted signals to prioritize top-fit candidates.</p>

                    {form.aiScoring.enabled && (
                      <div className="space-y-3">
                        {(['skills', 'experience', 'education'] as const).map((key) => (
                          <div key={key}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="capitalize font-medium text-gray-700">{key} weight</span>
                              <span className="text-[#0f5d43] font-semibold">{form.aiScoring.weights[key]}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={form.aiScoring.weights[key]}
                              onChange={(e) => updateAiWeight(key, Number(e.target.value))}
                              className="w-full accent-[#0f5d43]"
                            />
                          </div>
                        ))}
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${aiWeightTotal === 100 ? 'text-emerald-700' : 'text-red-600'}`}>
                            Total: {aiWeightTotal}%
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateForm('aiScoring', {
                                ...form.aiScoring,
                                weights: normalizeWeights(form.aiScoring.weights),
                              })
                            }
                            className="text-xs rounded-lg border border-[#0f5d43]/25 px-2 py-1 text-[#0f5d43] hover:bg-[#edf7f1] transition"
                          >
                            Normalize to 100%
                          </button>
                        </div>
                        {errors['ai.weights'] && <p className="text-xs text-red-600">{errors['ai.weights']}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#0f5d43]">
                    <Eye className="w-4 h-4" />
                    <h3 className="font-semibold">Step 5: Review &amp; Publish</h3>
                  </div>

                  <div className="rounded-xl border border-[#0f5d43]/12 bg-[#f8fcfa] p-4 space-y-3">
                    <ReviewLine label="Title" value={form.title || 'Not set'} />
                    <ReviewLine label="Employment" value={form.employmentType} />
                    <ReviewLine label="Work setup" value={form.workArrangement} />
                    <ReviewLine label="Location" value={form.location || (form.workArrangement === 'remote' ? 'Remote' : 'Not set')} />
                    <ReviewLine label="Salary" value={salaryDisplay} />
                    <ReviewLine label="Required skills" value={form.requiredSkills.length ? form.requiredSkills.join(', ') : 'Not set'} />
                    <ReviewLine label="Role overview" value={form.roleOverview ? `${form.roleOverview.slice(0, 140)}${form.roleOverview.length > 140 ? '...' : ''}` : 'Not set'} />
                    <ReviewLine label="AI scoring" value={form.aiScoring.enabled ? `Enabled (${aiWeightTotal}% total)` : 'Disabled'} />
                  </div>

                  <div className="rounded-xl border border-[#0f5d43]/20 bg-gradient-to-r from-[#edf7f1] to-white p-4 text-sm text-gray-700">
                    Publish is enabled only when required fields are complete and salary rules are valid.
                  </div>
                </div>
              )}
            </div>

            <div className="surface-card rounded-2xl p-4 sm:p-5 border border-[#0f5d43]/10 bg-white/95 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={activeStep === 0}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={activeStep === 4}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#0f5d43]/20 text-[#0f5d43] px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#edf7f1] transition"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#0f5d43]/20 text-[#0f5d43] px-3 py-2 text-sm hover:bg-[#edf7f1] transition"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Job
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishDisabled}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0f5d43] text-white px-4 py-2 text-sm font-medium hover:bg-[#0b4f39] transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <BriefcaseBusiness className="w-4 h-4" />
                    {isSubmitting ? 'Publishing...' : 'Publish Job'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-3 xl:sticky xl:top-20">
            <div className="surface-card rounded-2xl border border-[#0f5d43]/10 p-3">
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f2f8f4] p-1">
                <button
                  type="button"
                  onClick={() => setActiveSidebarTab('preview')}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                    activeSidebarTab === 'preview' ? 'bg-white text-[#0f5d43] shadow-sm' : 'text-gray-600 hover:text-[#0f5d43]'
                  }`}
                >
                  Public Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSidebarTab('ai')}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                    activeSidebarTab === 'ai' ? 'bg-white text-[#0f5d43] shadow-sm' : 'text-gray-600 hover:text-[#0f5d43]'
                  }`}
                >
                  AI Scoring
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSidebarTab('branding')}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                    activeSidebarTab === 'branding' ? 'bg-white text-[#0f5d43] shadow-sm' : 'text-gray-600 hover:text-[#0f5d43]'
                  }`}
                >
                  Branding
                </button>
              </div>
            </div>

            {activeSidebarTab === 'preview' && (
              <div className="surface-card rounded-2xl border border-[#0f5d43]/10 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900">How candidates will see this job</h4>
                </div>
                <div className="p-3 space-y-3">
                  <div className="rounded-xl overflow-hidden border border-[#0f5d43]/12">
                    {isValidUrl(form.imageUrl) && !bannerFailed ? (
                      <img
                        src={form.imageUrl}
                        alt={form.title || 'Job banner'}
                        className="w-full h-36 object-cover"
                        onError={() => setBannerFailed(true)}
                      />
                    ) : (
                      <div className="h-36 bg-gradient-to-br from-[#0f5d43] via-[#2f8a63] to-[#7bc19f] flex items-end p-3">
                        <div className="rounded-lg bg-white/20 px-2 py-1 text-white text-xs backdrop-blur">
                          CareerLaunch Featured Role
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">{form.title || 'Your job title appears here'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{companyName} • {recruiterName}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      <span className="rounded-full bg-[#edf7f1] border border-[#0f5d43]/20 px-2 py-1 text-[#0f5d43]">{form.employmentType}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                        {form.workArrangement === 'onsite' ? 'On-site' : form.workArrangement === 'hybrid' ? 'Hybrid' : 'Remote'}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">{form.location || 'Location pending'}</span>
                    </div>
                    <p className="text-sm text-[#0f5d43] font-medium mt-2">{salaryDisplay}</p>
                    <p className="text-xs text-gray-600 mt-2">{publicPreviewDescription}</p>
                  </div>
                  {form.requiredSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {form.requiredSkills.slice(0, 8).map((skill) => (
                        <span key={skill} className="text-xs rounded-full bg-[#f3f6f4] border border-gray-200 px-2 py-1 text-gray-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500">
                      Add required skills to improve candidate clarity.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSidebarTab === 'ai' && (
              <div className="surface-card rounded-2xl border border-[#0f5d43]/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#0f5d43]" />
                  <h4 className="text-sm font-semibold text-gray-900">AI Scoring Summary</h4>
                </div>
                <div className={`rounded-xl border px-3 py-2 text-sm ${form.aiScoring.enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                  {form.aiScoring.enabled ? 'AI scoring is enabled' : 'AI scoring is disabled'}
                </div>
                {form.aiScoring.enabled && (
                  <div className="space-y-2 text-sm">
                    <AiWeightRow label="Skills" value={form.aiScoring.weights.skills} />
                    <AiWeightRow label="Experience" value={form.aiScoring.weights.experience} />
                    <AiWeightRow label="Education" value={form.aiScoring.weights.education} />
                    <p className={`text-xs ${aiWeightTotal === 100 ? 'text-emerald-700' : 'text-red-600'}`}>Total: {aiWeightTotal}%</p>
                  </div>
                )}
              </div>
            )}

            {activeSidebarTab === 'branding' && (
              <div className="surface-card rounded-2xl border border-[#0f5d43]/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#0f5d43]" />
                  <h4 className="text-sm font-semibold text-gray-900">Branding</h4>
                </div>
                <input
                  value={form.imageUrl}
                  onChange={(e) => updateForm('imageUrl', e.target.value)}
                  placeholder="Paste a branding image URL"
                  className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                />
                <div className="rounded-xl overflow-hidden border border-[#0f5d43]/12">
                  {isValidUrl(form.imageUrl) && !bannerFailed ? (
                    <img
                      src={form.imageUrl}
                      alt="Brand preview"
                      className="w-full h-36 object-cover"
                      onError={() => setBannerFailed(true)}
                    />
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-[#0f5d43] via-[#3a9a70] to-[#a4d9bf] flex items-center justify-center text-white text-sm">
                      Beautiful fallback banner
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">Use high-contrast visuals for better feed visibility.</p>
              </div>
            )}
          </aside>
        </section>
      </div>
    </PageShell>
  );
}

function ChipInput({
  label,
  helper,
  placeholder,
  values,
  onAdd,
  onRemove,
  error,
}: {
  label: string;
  helper?: string;
  placeholder: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  error?: string;
}) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className={`rounded-xl border p-2 ${error ? 'border-red-400' : 'border-[#0f5d43]/15'}`}>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {values.length === 0 && <span className="text-xs text-gray-400">No items added yet.</span>}
          {values.map((value) => (
            <span key={value} className="inline-flex items-center gap-1 rounded-full bg-[#edf7f1] border border-[#0f5d43]/20 px-2 py-1 text-xs text-[#0f5d43]">
              {value}
              <button
                type="button"
                onClick={() => onRemove(value)}
                className="rounded-full hover:bg-[#dceee3] p-0.5"
                aria-label={`Remove ${value}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
        />
      </div>
      {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 text-sm">
      <div className="text-gray-500">{label}</div>
      <div className="text-gray-800 font-medium">{value}</div>
    </div>
  );
}

function AiWeightRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-[#0f5d43]">{value}%</span>
    </div>
  );
}
