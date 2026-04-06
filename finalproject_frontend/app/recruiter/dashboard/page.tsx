'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, Users, MapPin, Clock, Briefcase, Building2, Eye } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { Job } from '@/types/job';
import Navigation from '@/components/Navigation';

export default function RecruiterDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
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

  const loadJobs = async () => {
    const allJobs = await jobStore.getAllJobs();
    const sortedJobs = allJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setJobs(sortedJobs);
    
    const counts: Record<string, number> = {};
    for (const job of sortedJobs) {
      const apps = await jobStore.getApplicationsByJobId(job.id);
      counts[job.id] = apps.length;
    }
    setApplicationCounts(counts);
  };

  const handleDelete = async (id: string) => {
    await jobStore.deleteJob(id);
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
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  const getApplicationCount = (jobId: string) => applicationCounts[jobId] || 0;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const totalApplications = jobs.reduce((acc, job) => acc + getApplicationCount(job.id), 0);
  const recentJobs = jobs.filter(job => {
    const daysSince = Math.ceil((new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysSince <= 7;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="recruiter" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your job postings and review applications</p>
          </div>
          <Link
            href="/recruiter/jobs/new"
            className="bg-[#043927] text-white px-5 py-2.5 rounded-lg hover:bg-[#065a3a] transition flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#043927]/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#043927]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
                <div className="text-xs text-gray-500">Active Jobs</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalApplications}</div>
                <div className="text-xs text-gray-500">Applications</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{recentJobs}</div>
                <div className="text-xs text-gray-500">This Week</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {jobs.filter(job => getApplicationCount(job.id) > 0).length}
                </div>
                <div className="text-xs text-gray-500">With Applicants</div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Postings Table */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Your Job Postings</h2>
          </div>

          {jobs.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No job postings yet</h3>
              <p className="text-gray-500 text-sm mb-4">Get started by posting your first job listing</p>
              <Link
                href="/recruiter/jobs/new"
                className="inline-block bg-[#043927] text-white px-5 py-2.5 rounded-lg hover:bg-[#065a3a] transition text-sm font-medium"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Post Your First Job
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {jobs.map((job) => {
                const applicationCount = getApplicationCount(job.id);
                return (
                  <div key={job.id} className="px-6 py-4 hover:bg-gray-50/50 transition">
                    <div className="flex items-center gap-4">
                      {/* Company Icon */}
                      <div className="w-10 h-10 rounded-lg bg-[#043927]/5 border border-[#043927]/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-[#043927]" />
                      </div>

                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{job.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getJobTypeBadgeColor(job.job_type)}`}>
                            {getJobTypeLabel(job.job_type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {job.company && <span>{job.company}</span>}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(job.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Application Count */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">{applicationCount}</span>
                        <span className="text-xs text-gray-500 hidden sm:inline">applicant{applicationCount !== 1 ? 's' : ''}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {applicationCount > 0 && (
                          <Link
                            href={`/recruiter/jobs/${job.id}/applications`}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-medium flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </Link>
                        )}
                        <Link
                          href={`/recruiter/jobs/${job.id}/edit`}
                          className="p-2 text-gray-400 hover:text-[#043927] hover:bg-gray-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(job.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Job Posting?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will also delete all associated applications. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
