'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  FileText,
  Github,
  Linkedin,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  Globe,
} from 'lucide-react';

import { authStore } from '@/store/authStore';
import { PageShell } from '@/components/ui/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { JobSeekerProfile } from '@/types/user';

const suggestedSkills = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Tailwind'];
const availabilityOptions = ['Available', 'Open To Hire', 'Interested', 'Freelance', 'Part Time Only', 'Remote Only', 'Not Available'] as const;
const languageFluencyOptions = ['Basic', 'Conversational', 'Professional', 'Native / Bilingual'] as const;


export default function JobSeekerProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [userId, setUserId] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const [formData, setFormData] = useState<JobSeekerProfile>({
    userId: '',
    email: '',
    phone_number: '',
    full_name: '',
    education: '',
    skills: '',
    location: '',
    professional_title: '',
    bio: '',
    experience: '',
    cover_image_url: '',
    avatar_url: '',
    linkedin_url: '',
    github_url: '',
    website_url: '',
    availability_status: 'Open To Hire',
    languages: [],
    experience_entries: [],
    education_entries: [],
    resume_url: '',
    resume_filename: '',
    resume_extracted_text: '',
    resume_updated_at: '',
    career_insights: [],
    saved_jobs: [],
  });

  const loadProfile = async () => {
    const currentUser = authStore.getCurrentUser();
    if (!currentUser || currentUser.role !== 'jobseeker') {
      router.push('/login');
      return;
    }
    setUserId(currentUser.id);

    const remote = await authStore.getJobSeekerProfileRemote(currentUser.id);
    const local = authStore.getJobSeekerProfile(currentUser.id);
    const profile = remote || local;

    if (!profile) {
      const created = authStore.updateJobSeekerProfile(currentUser.id, {
        userId: currentUser.id,
        full_name: currentUser.full_name,
        education: '',
        skills: '',
        location: '',
      });
      setFormData({
        ...(created as JobSeekerProfile),
        email: currentUser.email,
        phone_number: '',
        experience_entries: [],
        education_entries: [],
        career_insights: [],
        saved_jobs: [],
        availability_status: 'Open To Hire',
        languages: [],
      });
      setLoading(false);
      return;
    }

    try {
      const vault = await authStore.getResumeVault();
      setFormData({
        ...profile,
        userId: currentUser.id,
        experience_entries: profile.experience_entries || [],
        education_entries: profile.education_entries || [],
        career_insights: vault.careerInsights.length > 0 ? vault.careerInsights : (profile.career_insights || []),
        resume_url: vault.resumeUrl || profile.resume_url || '',
        resume_filename: vault.resumeFilename || profile.resume_filename || '',
        resume_extracted_text: vault.resumeExtractedText || profile.resume_extracted_text || '',
        resume_updated_at: vault.resumeUpdatedAt || profile.resume_updated_at || '',
        availability_status: profile.availability_status || 'Open To Hire',
        languages: profile.languages || [],
      });
    } catch {
      setFormData({
        ...profile,
        userId: currentUser.id,
        experience_entries: profile.experience_entries || [],
        education_entries: profile.education_entries || [],
        career_insights: profile.career_insights || [],
        availability_status: profile.availability_status || 'Open To Hire',
        languages: profile.languages || [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    void loadProfile();
  }, [router]);

  const skills = useMemo(() => {
    return formData.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [formData.skills]);

  const completion = useMemo(() => {
    const checks = [
      !!formData.full_name,
      !!formData.location,
      !!formData.professional_title,
      skills.length > 0,
      !!formData.bio,
      !!formData.resume_url,
      !!(formData.github_url || formData.linkedin_url || formData.website_url),
      (formData.experience_entries || []).length > 0,
      (formData.education_entries || []).length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [formData, skills.length]);

  const updateField = <K extends keyof JobSeekerProfile>(key: K, value: JobSeekerProfile[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addSkill = (skill: string) => {
    const normalized = skill.trim();
    if (!normalized) return;
    if (skills.some((s) => s.toLowerCase() === normalized.toLowerCase())) return;
    const next = [...skills, normalized].join(', ');
    updateField('skills', next);
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    const next = skills.filter((s) => s.toLowerCase() !== skill.toLowerCase()).join(', ');
    updateField('skills', next);
  };

  const addExperience = () => {
    updateField('experience_entries', [
      ...(formData.experience_entries || []),
      { role: '', company: '', period: '', description: '' },
    ]);
  };

  const updateExperience = (index: number, key: 'role' | 'company' | 'period' | 'description', value: string) => {
    const next = [...(formData.experience_entries || [])];
    next[index] = { ...next[index], [key]: value };
    updateField('experience_entries', next);
  };

  const removeExperience = (index: number) => {
    const next = [...(formData.experience_entries || [])];
    next.splice(index, 1);
    updateField('experience_entries', next);
  };

  const addEducation = () => {
    updateField('education_entries', [
      ...(formData.education_entries || []),
      { school: '', degree: '', year: '' },
    ]);
  };

  const updateEducation = (index: number, key: 'school' | 'degree' | 'year', value: string) => {
    const next = [...(formData.education_entries || [])];
    next[index] = { ...next[index], [key]: value };
    updateField('education_entries', next);
  };

  const removeEducation = (index: number) => {
    const next = [...(formData.education_entries || [])];
    next.splice(index, 1);
    updateField('education_entries', next);
  };

  const addLanguage = () => {
    updateField('languages', [...(formData.languages || []), { name: '', fluency: 'Conversational' }]);
  };

  const updateLanguage = (index: number, key: 'name' | 'fluency', value: string) => {
    const next = [...(formData.languages || [])];
    next[index] = { ...next[index], [key]: value };
    updateField('languages', next);
  };

  const removeLanguage = (index: number) => {
    const next = [...(formData.languages || [])];
    next.splice(index, 1);
    updateField('languages', next);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      const saved = await authStore.saveJobSeekerProfile(userId, formData);
      if (!saved) throw new Error('Profile save failed');
      setFormData({
        ...saved,
        availability_status: saved.availability_status || formData.availability_status || 'Open To Hire',
        languages: saved.languages || formData.languages || [],
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingResume(true);
    try {
      const uploaded = await authStore.uploadResumeToVault(file);
      setFormData((prev) => ({
        ...prev,
        resume_url: uploaded.resumeUrl,
        resume_filename: uploaded.resumeFilename,
        resume_extracted_text: uploaded.resumeExtractedText,
        resume_updated_at: uploaded.resumeUpdatedAt || '',
        career_insights: uploaded.careerInsights,
      }));
      toast.success('Resume uploaded to vault');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload resume';
      toast.error(message);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResume = async () => {
    const ok = await authStore.deleteResumeVault();
    if (!ok) {
      toast.error('Failed to delete resume');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      resume_url: '',
      resume_filename: '',
      resume_extracted_text: '',
      resume_updated_at: '',
      career_insights: [],
    }));
    toast.success('Resume deleted');
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen page-gradient flex items-center justify-center">
        <div className="w-full max-w-6xl px-4">
          <Skeleton className="h-16 mb-4 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const completionSteps = [
    { label: 'Basic', done: !!formData.full_name && !!formData.location },
    { label: 'Skills', done: skills.length > 0 },
    { label: 'Experience', done: (formData.experience_entries || []).length > 0 },
    { label: 'Education', done: (formData.education_entries || []).length > 0 },
    { label: 'Resume', done: !!formData.resume_url },
  ];
  const publicProfileHref = userId || formData.userId ? `/jobseekers/${userId || formData.userId}` : '/jobseeker/profile';

  return (
    <PageShell
      variant="jobseeker"
      title="Profile Builder"
      subtitle="Build a stronger candidate profile with resume vault and guided improvements."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/jobseeker/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#0f5d43] transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <Link
            href={publicProfileHref}
            className="inline-flex items-center gap-2 rounded-lg border border-[#0f5d43]/25 text-[#0f5d43] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#edf7f1] transition"
          >
            <Eye className="w-4 h-4" />
            View Public Profile
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSaveProfile} className="space-y-4 pb-20 md:pb-0">
        <ProfileHeader
          avatarImage={formData.avatar_url}
          name={formData.full_name || 'Your Name'}
          roleLabel={formData.professional_title || 'Jobseeker'}
          location={formData.location}
          email={formData.email}
          websiteUrl={formData.website_url}
          linkedinUrl={formData.linkedin_url}
          readOnly
        />

        <section className="surface-card rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Career Profile</p>
              <p className="text-sm text-gray-600 mt-1">Keep your profile complete to improve recruiter confidence.</p>
            </div>
            <div className="rounded-xl border border-[#0f5d43]/15 bg-[#f7fcf9] px-4 py-3 min-w-[220px]">
              <p className="text-xs text-[#0f5d43]/75 uppercase tracking-wide">Completion</p>
              <p className="text-2xl font-bold mt-1 text-[#0f5d43]">{completion}%</p>
              <div className="mt-2 flex items-center gap-2">
                {completionSteps.map((step) => (
                  <span key={step.label} className={`w-6 h-1.5 rounded-full ${step.done ? 'bg-[#3ca276]' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1fr_330px] gap-4 items-start">
          <section className="space-y-4">
            <div className="surface-card rounded-2xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Profile Photo</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-20 h-20 rounded-full border border-[#0f5d43]/15 bg-[#edf7f1] overflow-hidden flex items-center justify-center text-[#0f5d43] text-xl font-semibold shrink-0">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt={formData.full_name || 'Profile photo'} className="w-full h-full object-cover" />
                  ) : (
                    (formData.full_name || 'YN')
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-[0.14em] text-gray-500">Profile Image URL</label>
                  <input
                    value={formData.avatar_url || ''}
                    onChange={(e) => updateField('avatar_url', e.target.value)}
                    placeholder="Paste your profile image URL"
                    className="mt-1.5 w-full rounded-xl border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">This is the only image shown on your public profile.</p>
                </div>
              </div>
            </div>

            <div className="surface-card rounded-2xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Personal Info</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  value={formData.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                />
                <input
                  value={formData.email || ''}
                  readOnly
                  placeholder="Email"
                  className="w-full rounded-xl border border-[#0f5d43]/15 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                />
                <input
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="Location"
                  className="w-full rounded-xl border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                />
                <input
                  value={formData.phone_number || ''}
                  onChange={(e) => updateField('phone_number', e.target.value)}
                  placeholder="Phone number"
                  className="w-full rounded-xl border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                />
                <input
                  value={formData.professional_title || ''}
                  onChange={(e) => updateField('professional_title', e.target.value)}
                  placeholder="Professional title"
                  className="w-full rounded-xl border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                />
                <select
                  value={formData.availability_status || 'Open To Hire'}
                  onChange={(e) => updateField('availability_status', e.target.value as JobSeekerProfile['availability_status'])}
                  className="w-full rounded-xl border border-[#0f5d43]/15 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                >
                  {availabilityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="surface-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Languages</h3>
                <button
                  type="button"
                  onClick={addLanguage}
                  className="inline-flex items-center gap-1 text-sm text-[#0f5d43] font-medium hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add Language
                </button>
              </div>
              <div className="space-y-3">
                {(formData.languages || []).map((entry, index) => (
                  <div key={`lang-${index}`} className="rounded-xl border border-[#0f5d43]/12 p-3">
                    <div className="grid md:grid-cols-[1fr_220px_auto] gap-2 items-start">
                      <input
                        value={entry.name}
                        onChange={(e) => updateLanguage(index, 'name', e.target.value)}
                        placeholder="Language (e.g. English)"
                        className="rounded-lg border border-[#0f5d43]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                      />
                      <select
                        value={entry.fluency}
                        onChange={(e) => updateLanguage(index, 'fluency', e.target.value)}
                        className="rounded-lg border border-[#0f5d43]/15 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                      >
                        {languageFluencyOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 text-red-600 px-2.5 py-2 text-xs font-medium hover:bg-red-50 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {(formData.languages || []).length === 0 && (
                  <p className="text-sm text-gray-500">No languages added yet.</p>
                )}
              </div>
            </div>

            <div className="surface-card rounded-2xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Professional Summary</h3>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => updateField('bio', e.target.value)}
                rows={4}
                placeholder="Write a concise professional summary..."
                className="w-full rounded-xl border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 resize-none"
              />
              <p className="mt-2 text-xs text-gray-500">Tip: Highlight your strengths, tools, and the impact of your work.</p>
            </div>

            <div className="surface-card rounded-2xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#edf7f1] text-[#0f5d43] border border-[#0f5d43]/15 text-xs">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="text-[#0f5d43]/70 hover:text-[#0f5d43]">x</button>
                  </span>
                ))}
                {skills.length === 0 && <p className="text-sm text-gray-500">No skills added yet.</p>}
              </div>
              <div className="flex gap-2">
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  className="flex-1 rounded-xl border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                />
                <button
                  type="button"
                  onClick={() => addSkill(newSkill)}
                  className="rounded-xl bg-[#0f5d43] text-white px-3 py-2.5 text-sm font-medium hover:bg-[#0b4f39] transition"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => addSkill(skill)}
                    className="text-xs px-2.5 py-1 rounded-full border border-[#0f5d43]/15 text-[#0f5d43] hover:bg-[#edf7f1] transition"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="surface-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Experience</h3>
                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex items-center gap-1 text-sm text-[#0f5d43] font-medium hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add Experience
                </button>
              </div>
              <div className="space-y-3">
                {(formData.experience_entries || []).map((entry, index) => (
                  <div key={`exp-${index}`} className="rounded-xl border border-[#0f5d43]/12 p-3">
                    <div className="grid md:grid-cols-3 gap-2 mb-2">
                      <input
                        value={entry.role}
                        onChange={(e) => updateExperience(index, 'role', e.target.value)}
                        placeholder="Role"
                        className="rounded-lg border border-[#0f5d43]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                      />
                      <input
                        value={entry.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        placeholder="Company"
                        className="rounded-lg border border-[#0f5d43]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                      />
                      <input
                        value={entry.period}
                        onChange={(e) => updateExperience(index, 'period', e.target.value)}
                        placeholder="Period (e.g. 2024-2025)"
                        className="rounded-lg border border-[#0f5d43]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                      />
                    </div>
                    <textarea
                      value={entry.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      rows={3}
                      placeholder="Describe impact and outcomes..."
                      className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                ))}
                {(formData.experience_entries || []).length === 0 && (
                  <p className="text-sm text-gray-500">No experience entries yet.</p>
                )}
              </div>
            </div>

            <div className="surface-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Education</h3>
                <button
                  type="button"
                  onClick={addEducation}
                  className="inline-flex items-center gap-1 text-sm text-[#0f5d43] font-medium hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add Education
                </button>
              </div>
              <div className="space-y-3">
                {(formData.education_entries || []).map((entry, index) => (
                  <div key={`edu-${index}`} className="rounded-xl border border-[#0f5d43]/12 p-3">
                    <div className="grid md:grid-cols-3 gap-2">
                      <input
                        value={entry.school}
                        onChange={(e) => updateEducation(index, 'school', e.target.value)}
                        placeholder="School"
                        className="rounded-lg border border-[#0f5d43]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                      />
                      <input
                        value={entry.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="Degree"
                        className="rounded-lg border border-[#0f5d43]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                      />
                      <input
                        value={entry.year}
                        onChange={(e) => updateEducation(index, 'year', e.target.value)}
                        placeholder="Year"
                        className="rounded-lg border border-[#0f5d43]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                ))}
                {(formData.education_entries || []).length === 0 && (
                  <p className="text-sm text-gray-500">No education entries yet.</p>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <div className="surface-card rounded-2xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Portfolio Links</h3>
              <div className="space-y-2">
                <div className="relative">
                  <Github className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={formData.github_url || ''}
                    onChange={(e) => updateField('github_url', e.target.value)}
                    placeholder="GitHub URL"
                    className="w-full rounded-xl border border-[#0f5d43]/15 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                  />
                </div>
                <div className="relative">
                  <Linkedin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={formData.linkedin_url || ''}
                    onChange={(e) => updateField('linkedin_url', e.target.value)}
                    placeholder="LinkedIn URL"
                    className="w-full rounded-xl border border-[#0f5d43]/15 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                  />
                </div>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={formData.website_url || ''}
                    onChange={(e) => updateField('website_url', e.target.value)}
                    placeholder="Personal website"
                    className="w-full rounded-xl border border-[#0f5d43]/15 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                  />
                </div>
              </div>
            </div>

            <div className="surface-card rounded-2xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">My Resume Vault</h3>
              {formData.resume_url ? (
                <div className="space-y-2">
                  <div className="rounded-xl border border-[#0f5d43]/15 bg-[#f7fcf9] p-3">
                    <p className="text-sm font-medium text-gray-900">{formData.resume_filename || 'Current Resume'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last updated: {formData.resume_updated_at ? new Date(formData.resume_updated_at).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="text-center rounded-xl border border-[#0f5d43]/20 text-[#0f5d43] px-2 py-2 text-xs font-medium hover:bg-[#edf7f1] transition cursor-pointer">
                      Replace
                      <input
                        type="file"
                        accept=".pdf,.txt,application/pdf,text/plain"
                        className="hidden"
                        onChange={(e) => void handleResumeUpload(e.target.files?.[0] || null)}
                        disabled={uploadingResume}
                      />
                    </label>
                    <a
                      href={formData.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-center rounded-xl border border-[#0f5d43]/20 text-[#0f5d43] px-2 py-2 text-xs font-medium hover:bg-[#edf7f1] transition"
                    >
                      Preview
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleDeleteResume()}
                      className="rounded-xl border border-red-200 text-red-600 px-2 py-2 text-xs font-medium hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#0f5d43]/25 bg-[#f7fcf9] p-4 text-center">
                  <FileText className="w-8 h-8 text-[#0f5d43] mx-auto" />
                  <p className="text-sm text-gray-600 mt-2">No resume in vault yet.</p>
                  <label className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0f5d43] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#0b4f39] transition cursor-pointer">
                    <UploadCloud className="w-4 h-4" />
                    {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                    <input
                      type="file"
                      accept=".pdf,.txt,application/pdf,text/plain"
                      className="hidden"
                      onChange={(e) => void handleResumeUpload(e.target.files?.[0] || null)}
                      disabled={uploadingResume}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="surface-card rounded-2xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Career Insights</h3>
              {(formData.career_insights || []).length === 0 ? (
                <p className="text-sm text-gray-500">Upload your resume to receive personalized Gemini insights.</p>
              ) : (
                <div className="space-y-2">
                  {(formData.career_insights || []).map((insight, idx) => (
                    <div key={`${insight}-${idx}`} className="text-sm text-gray-700 rounded-lg border border-[#0f5d43]/12 bg-[#f7fcf9] p-2.5">
                      {insight}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f5d43] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#0b4f39] transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>

            <div className="rounded-xl border border-[#0f5d43]/15 bg-[#f7fcf9] p-3 text-sm text-gray-700">
              <p className="font-medium text-[#0f5d43]">Completion: {completion}%</p>
              <div className="mt-2 space-y-1.5">
                {completionSteps.map((step) => (
                  <div key={step.label} className="flex items-center gap-2">
                    {step.done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-gray-400" />}
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-[#0f5d43]/10 bg-white/95 backdrop-blur px-3 py-2">
        <div className="grid grid-cols-2 gap-2">
          <Link href="/jobseeker/dashboard" className="inline-flex items-center justify-center rounded-xl border border-[#0f5d43]/20 text-[#0f5d43] px-3 py-2.5 text-sm font-medium">
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              const form = document.querySelector('form') as HTMLFormElement | null;
              if (form) form.requestSubmit();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-[#0f5d43] text-white px-3 py-2.5 text-sm font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </PageShell>
  );
}

