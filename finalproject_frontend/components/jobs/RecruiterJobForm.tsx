'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  BriefcaseBusiness,
  FileText,
  Image as ImageIcon,
  MapPin,
  Save,
  Wallet,
} from 'lucide-react';
import { JobType } from '@/types/job';
import JobImage from '@/components/jobs/JobImage';

export interface RecruiterJobFormValues {
  title: string;
  job_type: JobType;
  salary: string;
  location: string;
  description: string;
  requirements: string;
  image_url: string;
}

interface RecruiterJobFormProps {
  mode: 'create' | 'edit';
  values: RecruiterJobFormValues;
  errors: Partial<Record<keyof RecruiterJobFormValues, string>>;
  isSubmitting: boolean;
  onChange: (name: keyof RecruiterJobFormValues, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelHref: string;
}

export default function RecruiterJobForm({
  mode,
  values,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
  onCancelHref,
}: RecruiterJobFormProps) {
  const typeLabel = useMemo(() => {
    if (values.job_type === 'FULLTIME') return 'Full-Time';
    if (values.job_type === 'PARTTIME') return 'Part-Time';
    return 'Internship';
  }, [values.job_type]);

  return (
    <form onSubmit={onSubmit} className="grid lg:grid-cols-[1.1fr_360px] gap-5">
      <div className="space-y-5">
        <section className="surface-card p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
            <BriefcaseBusiness className="w-5 h-5 text-[#0f5d43]" />
            Job Basics
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title *</label>
              <input
                value={values.title}
                onChange={(e) => onChange('title', e.target.value)}
                placeholder="e.g., Senior Frontend Engineer"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                  errors.title ? 'border-red-400' : 'border-[#0f5d43]/15'
                }`}
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Type *</label>
              <select
                value={values.job_type}
                onChange={(e) => onChange('job_type', e.target.value)}
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              >
                <option value="FULLTIME">Full-Time</option>
                <option value="PARTTIME">Part-Time</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Salary *</label>
              <input
                value={values.salary}
                onChange={(e) => onChange('salary', e.target.value)}
                placeholder="$80,000 - $110,000"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                  errors.salary ? 'border-red-400' : 'border-[#0f5d43]/15'
                }`}
              />
              {errors.salary && <p className="text-xs text-red-600 mt-1">{errors.salary}</p>}
            </div>
          </div>
        </section>

        <section className="surface-card p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0f5d43]" />
            Job Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Description *</label>
              <textarea
                value={values.description}
                onChange={(e) => onChange('description', e.target.value)}
                rows={6}
                placeholder="Describe the role, team, and impact..."
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 resize-none ${
                  errors.description ? 'border-red-400' : 'border-[#0f5d43]/15'
                }`}
              />
              {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Requirements / Skills *</label>
              <textarea
                value={values.requirements}
                onChange={(e) => onChange('requirements', e.target.value)}
                rows={5}
                placeholder="React, TypeScript, API integration, testing..."
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 resize-none ${
                  errors.requirements ? 'border-red-400' : 'border-[#0f5d43]/15'
                }`}
              />
              {errors.requirements && <p className="text-xs text-red-600 mt-1">{errors.requirements}</p>}
            </div>
          </div>
        </section>

        <section className="surface-card p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0f5d43]" />
            Salary & Location
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location *</label>
            <input
              value={values.location}
              onChange={(e) => onChange('location', e.target.value)}
              placeholder="Remote / Bangkok / New York"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                errors.location ? 'border-red-400' : 'border-[#0f5d43]/15'
              }`}
            />
            {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
          </div>
        </section>

        <section className="surface-card p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#0f5d43]" />
            Media
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL (optional)</label>
            <input
              value={values.image_url}
              onChange={(e) => onChange('image_url', e.target.value)}
              placeholder="https://example.com/job-banner.jpg"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 ${
                errors.image_url ? 'border-red-400' : 'border-[#0f5d43]/15'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">Optional image shown on job cards and job detail page.</p>
            {errors.image_url && <p className="text-xs text-red-600 mt-1">{errors.image_url}</p>}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f5d43] text-white px-5 py-3 text-sm font-medium hover:bg-[#0b4d38] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSubmitting
              ? mode === 'create'
                ? 'Posting...'
                : 'Updating...'
              : mode === 'create'
                ? 'Post Job'
                : 'Update Job'}
          </button>
          <Link
            href={onCancelHref}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="surface-card p-4 sticky top-24">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Live Card Preview</h3>
          <div className="rounded-xl border border-[#0f5d43]/12 overflow-hidden bg-white">
            <JobImage
              imageUrl={values.image_url}
              alt={values.title || 'Job preview image'}
              heightClassName="h-40"
            />
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 line-clamp-2">
                {values.title || 'Your job title will appear here'}
              </h4>
              <div className="text-sm text-gray-500 mt-1">{typeLabel}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#edf7f1] border border-[#0f5d43]/15 text-[#0f5d43] px-2 py-1">
                  <Wallet className="w-3 h-3" />
                  {values.salary || 'Salary'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 px-2 py-1">
                  <MapPin className="w-3 h-3" />
                  {values.location || 'Location'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}
