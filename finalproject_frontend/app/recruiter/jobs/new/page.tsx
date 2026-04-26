'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { PageShell } from '@/components/ui/page-shell';
import RecruiterJobForm, { RecruiterJobFormValues } from '@/components/jobs/RecruiterJobForm';

const defaultValues: RecruiterJobFormValues = {
  title: '',
  job_type: 'FULLTIME',
  salary: '',
  location: '',
  description: '',
  requirements: '',
  image_url: '',
};

export default function PostJobPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RecruiterJobFormValues>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof RecruiterJobFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentUser = authStore.getCurrentUser();
    if (!currentUser || currentUser.role !== 'recruiter') {
      router.push('/login');
    }
  }, [router]);

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
      const currentUser = authStore.getCurrentUser();
      const recruiterMeta = currentUser ? authStore.getRecruiterProfileMeta(currentUser.id) : undefined;

      await jobStore.createJob({
        title: formData.title.trim(),
        type: formData.job_type.toLowerCase(),
        company: recruiterMeta?.company || 'CareerLaunch',
        salary: formData.salary.trim(),
        imageUrl: formData.image_url.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        skills: formData.requirements
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });

      toast.success('Job posted successfully');
      router.push('/recruiter/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create job';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      variant="recruiter"
      title="Post a New Job"
      subtitle="Create a polished, candidate-friendly listing"
      actions={
        <Link href="/recruiter/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#0f5d43] transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      }
    >
      <RecruiterJobForm
        mode="create"
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
