'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { PageShell } from '@/components/ui/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import RecruiterJobForm, { RecruiterJobFormValues } from '@/components/jobs/RecruiterJobForm';

const emptyValues: RecruiterJobFormValues = {
  title: '',
  job_type: 'FULLTIME',
  salary: '',
  location: '',
  description: '',
  requirements: '',
  image_url: '',
};

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RecruiterJobFormValues>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<keyof RecruiterJobFormValues, string>>>({});

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      const currentUser = authStore.getCurrentUser();
      if (!currentUser || currentUser.role !== 'recruiter') {
        router.push('/login');
        return;
      }

      const job = await jobStore.getJobById(jobId);
      if (!job) {
        toast.error('Job not found');
        router.push('/recruiter/dashboard');
        return;
      }

      setFormData({
        title: job.title || '',
        job_type: job.job_type || 'FULLTIME',
        salary: job.salary || '',
        location: job.location || '',
        description: job.description || '',
        requirements: job.requirements || '',
        image_url: job.image_url || '',
      });
      setLoading(false);
    };

    void load();
  }, [jobId, router]);

  const handleChange = (name: keyof RecruiterJobFormValues, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'job_type' ? (value as RecruiterJobFormValues['job_type']) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const next: Partial<Record<keyof RecruiterJobFormValues, string>> = {};
    if (!formData.title.trim()) next.title = 'Job title is required';
    if (!formData.salary.trim()) next.salary = 'Salary is required';
    if (!formData.location.trim()) next.location = 'Location is required';
    if (!formData.description.trim()) next.description = 'Description is required';
    if (!formData.requirements.trim()) next.requirements = 'Requirements are required';
    if (formData.image_url.trim()) {
      try {
        new URL(formData.image_url.trim());
      } catch {
        next.image_url = 'Please provide a valid URL';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await jobStore.updateJob(jobId, {
        title: formData.title.trim(),
        job_type: formData.job_type,
        salary: formData.salary.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        image_url: formData.image_url.trim(),
      });
      toast.success('Job updated successfully');
      router.push('/recruiter/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update job';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen page-gradient flex items-center justify-center">
        <div className="w-full max-w-6xl px-4">
          <Skeleton className="h-14 mb-4" />
          <Skeleton className="h-[700px]" />
        </div>
      </div>
    );
  }

  return (
    <PageShell
      variant="recruiter"
      title="Edit Job Posting"
      subtitle="Update listing details and media"
      actions={
        <Link href="/recruiter/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#0f5d43] transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      }
    >
      <RecruiterJobForm
        mode="edit"
        values={formData}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancelHref="/recruiter/dashboard"
      />
    </PageShell>
  );
}
