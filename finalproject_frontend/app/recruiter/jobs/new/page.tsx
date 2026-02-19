'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { JobType } from '@/types/job';

export default function JobFormPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string | undefined;
  const isEditing = !!jobId;

  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    job_type: 'FULLTIME' as JobType,
    salary: '',
    description: '',
    requirements: '',
    location: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    const currentUser = authStore.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'recruiter') {
      router.push('/login');
      return;
    }

    if (isEditing && jobId) {
      const job = jobStore.getJobById(jobId);
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
  }, [isEditing, jobId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    if (isEditing && jobId) {
      jobStore.updateJob(jobId, formData);
      alert('Job updated successfully! ✅');
    } else {
      jobStore.createJob(formData);
      alert('Job posted successfully! 🎉');
    }
    
    router.push('/recruiter/dashboard');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/recruiter" className="text-2xl font-bold text-[#043927]">
              CareerLaunch
            </Link>
            <Link 
              href="/recruiter/dashboard"
              className="text-gray-600 hover:text-[#043927] transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#043927] mb-2">
            {isEditing ? 'Edit Job Posting' : 'Post a New Job'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Update your job posting details' : 'Fill in the details to create your job posting'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
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
              placeholder="e.g., Junior Frontend Developer"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
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
              placeholder="e.g., $25-30/hour or $60,000-$80,000/year"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] ${
                errors.salary ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
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
              placeholder="e.g., Remote, New York, NY, or San Francisco, CA"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
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
              placeholder="Describe the role, responsibilities, and what makes this opportunity great..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
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
              placeholder="List the skills, qualifications, and experience required for this role..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] resize-none ${
                errors.requirements ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.requirements && <p className="text-red-500 text-sm mt-1">{errors.requirements}</p>}
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
      </div>
    </div>
  );
}
