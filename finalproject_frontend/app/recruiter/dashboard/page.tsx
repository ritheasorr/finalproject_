'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, Users, MapPin, DollarSign, Clock, Briefcase } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { Job } from '@/types/job';

export default function RecruiterDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = authStore.getCurrentUser();
    if (!currentUser || currentUser.role !== 'recruiter') {
      router.push('/login');
      return;
    }
    loadJobs();
  }, [router]);

  const loadJobs = () => {
    const allJobs = jobStore.getAllJobs();
    setJobs(allJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  };

  const handleDelete = (id: string) => {
    jobStore.deleteJob(id);
    loadJobs();
    setDeleteConfirm(null);
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
      case 'FULLTIME': return 'bg-green-100 text-green-800';
      case 'PARTTIME': return 'bg-blue-100 text-blue-800';
      case 'INTERNSHIP': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getApplicationCount = (jobId: string) => {
    return jobStore.getApplicationsByJobId(jobId).length;
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
            <div className="flex items-center gap-4">
              <Link
                href="/recruiter/jobs/new"
                className="bg-[#043927] text-white px-6 py-2 rounded-lg hover:bg-[#065a3a] transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Post New Job
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#043927] mb-2">Recruiter Dashboard</h1>
          <p className="text-gray-600">Manage your job postings and review applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-[#043927]/10 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-[#043927]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#043927]">{jobs.length}</div>
                <div className="text-sm text-gray-600">Active Jobs</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#043927]">
                  {jobs.reduce((acc, job) => acc + getApplicationCount(job.id), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Applications</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#043927]">
                  {jobs.filter(job => {
                    const daysSince = Math.ceil((new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    return daysSince <= 7;
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Posted This Week</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#043927]">
                  {jobs.filter(job => getApplicationCount(job.id) > 0).length}
                </div>
                <div className="text-sm text-gray-600">Jobs with Applications</div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#043927]">Your Job Postings</h2>
          </div>
          
          {jobs.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No job postings yet</h3>
              <p className="text-gray-600 mb-6">Get started by posting your first job listing</p>
              <Link
                href="/recruiter/jobs/new"
                className="bg-[#043927] text-white px-6 py-3 rounded-lg hover:bg-[#065a3a] transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Post Your First Job
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => {
                const applicationCount = getApplicationCount(job.id);
                return (
                  <div key={job.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <h3 className="text-xl font-bold text-[#043927]">{job.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getJobTypeBadgeColor(job.job_type)}`}>
                            {getJobTypeLabel(job.job_type)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salary}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Posted {formatDate(job.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {applicationCount} {applicationCount === 1 ? 'application' : 'applications'}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 line-clamp-2">{job.description}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        {applicationCount > 0 && (
                          <Link
                            href={`/recruiter/jobs/${job.id}/applications`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                          >
                            <Users className="w-4 h-4" />
                            View Applications
                          </Link>
                        )}
                        <Link
                          href={`/recruiter/jobs/${job.id}/edit`}
                          className="p-2 text-gray-600 hover:text-[#043927] hover:bg-gray-100 rounded-lg transition"
                          title="Edit job"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => setDeleteConfirm(job.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete job"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Job Posting?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this job posting? This will also delete all associated applications. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
