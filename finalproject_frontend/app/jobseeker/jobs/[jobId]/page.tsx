'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Briefcase, MapPin, Clock, Building2, Tag } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { applicationStore } from '@/store/applicationStore';
import { Job } from '@/types/job';
import { PageShell } from '@/components/ui/page-shell';

export default function JobDetailsAndApplyPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;

  const [user, setUser] = useState(authStore.getCurrentUser());
  const [job, setJob] = useState<Job | null>(null);
  const [mounted, setMounted] = useState(false);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [jobId, router]);

  const loadData = async () => {
    const currentUser = authStore.getCurrentUser();

    if (!currentUser || currentUser.role !== 'jobseeker') {
      router.push('/login');
      return;
    }

    setUser(currentUser);

    const jobData = await jobStore.getJobById(jobId);
    if (!jobData) {
      router.push('/jobseeker/jobs');
      return;
    }
    setJob(jobData);

    const applied = await applicationStore.hasApplied(currentUser.id, jobId);
    setHasApplied(applied);
    if (applied) {
      setError('You have already applied to this job');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user || !job) return;

    if (!resumeFile) {
      setError('Please upload your resume (PDF or TXT)');
      return;
    }

    if (!coverLetter.trim()) {
      setError('Please write a cover letter');
      return;
    }

    const applied = await applicationStore.hasApplied(user.id, jobId);
    if (applied) {
      setError('You have already applied to this job');
      return;
    }

    setIsSubmitting(true);

    try {
      await applicationStore.createApplication(jobId, coverLetter, resumeFile);
      alert('Application submitted successfully!');
      router.push('/jobseeker/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit application';
      setError(message);
      setIsSubmitting(false);
    }
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'FULLTIME': return 'Full-Time';
      case 'PARTTIME': return 'Part-Time';
      case 'INTERNSHIP': return 'Internship';
      default: return type;
    }
  };

  const getJobTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'FULLTIME': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'PARTTIME': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'INTERNSHIP': return 'bg-violet-50 text-violet-700 border border-violet-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!mounted || !user || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <PageShell
      variant="jobseeker"
      title={job.title}
      subtitle={job.company}
      actions={
        <Link href="/jobseeker/jobs" className="text-sm text-gray-600 hover:text-[#043927] transition inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      }
    >
        <div className="surface-card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#043927]/5 border border-[#043927]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-[#043927]" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                  <p className="text-sm text-gray-600 mt-0.5">{job.company}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getJobTypeBadgeColor(job.job_type)}`}>
                  {getJobTypeLabel(job.job_type)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Posted {formatDate(job.created_at)}
                </span>
              </div>

              {job.description && (
                <p className="text-sm text-gray-600 mb-3">{job.description}</p>
              )}

              {job.requirements && (
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-gray-800 mb-1">Requirements</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{job.requirements}</p>
                </div>
              )}

              {job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
                      <Tag className="w-3 h-3" />
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {hasApplied ? (
          <div className="surface-card p-8 text-center">
            <Briefcase className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Already Applied</h2>
            <p className="text-gray-500 text-sm mb-5">
              You have already submitted an application for this position.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/jobseeker/dashboard"
                className="bg-[#043927] text-white px-5 py-2.5 rounded-lg hover:bg-[#065a3a] transition text-sm font-medium"
              >
                View Dashboard
              </Link>
              <Link
                href="/jobseeker/jobs"
                className="border border-gray-200 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Browse More Jobs
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="surface-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Submit Resume For This Job</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
                {error}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Upload Resume (PDF or TXT)
              </label>
              <input
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#043927]/20 focus:border-[#043927] bg-white"
                required
              />
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                PDF or TXT file. Your resume will be submitted for this job.
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cover Letter
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell us why you're a great fit for this position..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#043927]/20 focus:border-[#043927] resize-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1.5">{coverLetter.length} characters</p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#043927] text-white px-5 py-2.5 rounded-lg hover:bg-[#065a3a] transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <Link
                href="/jobseeker/jobs"
                className="px-5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
    </PageShell>
  );
}
