'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { JobType } from '@/types/job';
import { PageShell } from '@/components/ui/page-shell';

export default function JobFormPage() {
  const router = useRouter();
  const params = useParams();

  const job_id = params?.jobId as string | undefined;
  const isEditing = !!job_id;

  const [mounted] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    job_type: 'FULLTIME' as JobType,
    salary: '',
    description: '',
    requirements: '',
    location: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ FIX: define function INSIDE useEffect (no hoisting issue)
  useEffect(() => {
    const loadData = async () => {
      const currentUser = authStore.getCurrentUser();

      if (!currentUser || currentUser.role !== 'recruiter') {
        router.push('/login');
        return;
      }

      if (isEditing && job_id) {
        const job = await jobStore.getJobById(job_id);

        if (job) {
          setFormData({
            title: job.title,
            job_type: job.job_type,
            salary: job.salary,
            description: job.description,
            requirements: job.requirements,
            location: job.location,
          });
        } else {
          router.push('/recruiter/dashboard');
        }
      }
    };

    loadData();
  }, [router, job_id, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.salary.trim()) newErrors.salary = 'Salary range is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (!formData.requirements.trim()) newErrors.requirements = 'Requirements are required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditing && job_id) {
        await jobStore.updateJob(job_id, formData);
        alert('Job updated successfully! ✅');
      } else {
        const jobData = {
          title: formData.title,
          type: formData.job_type.toLowerCase(),
          company: 'Your Company',
          location: formData.location,
          description: formData.description,
          skills: formData.requirements
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
        };

        await jobStore.createJob(jobData);
        alert('Job posted successfully! 🎉');
      }

      router.push('/recruiter/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to save job');
    }
  };

  return (
    <div>
      <PageShell
        variant="recruiter"
        title={isEditing ? 'Edit Job Posting' : 'Post a New Job'}
        subtitle={
          isEditing
            ? 'Update your job posting details'
            : 'Fill in the details to create your job posting'
        }
        actions={
          <Link
            href="/recruiter/dashboard"
            className="text-gray-600 hover:text-[#043927] transition inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        }
      >
        <form onSubmit={handleSubmit} className="surface-card p-8">

          {/* Job Title */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Job Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Job Type *
            </label>
            <select
              name="job_type"
              value={formData.job_type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
            >
              <option value="FULLTIME">Full-Time</option>
              <option value="PARTTIME">Part-Time</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>

          {/* Salary */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Salary Range *
            </label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] ${
                errors.salary ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.salary && (
              <p className="text-red-500 text-sm mt-1">{errors.salary}</p>
            )}
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Job Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Requirements */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Requirements *
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] resize-none ${
                errors.requirements ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.requirements && (
              <p className="text-red-500 text-sm mt-1">{errors.requirements}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-[#043927] text-white px-6 py-3 rounded-lg hover:bg-[#065a3a] transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Update Job' : 'Post Job'}
            </button>

            <Link
              href="/recruiter/dashboard"
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition text-center"
            >
              Cancel
            </Link>
          </div>

        </form>
      </PageShell>
    </div>
  );
}