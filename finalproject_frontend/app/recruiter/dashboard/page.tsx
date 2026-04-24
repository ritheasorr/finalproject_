'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Users, Briefcase, Clock, Eye, Edit, Trash2 } from 'lucide-react';

import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { Job } from '@/types/job';
import { PageShell } from '@/components/ui/page-shell';

export default function RecruiterDashboard() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);

    const load = async () => {
      const user = authStore.getCurrentUser();

      // ✅ ONLY valid redirect logic
      if (!user) {
        router.push('/login');
        return;
      }

      if (user.role !== 'recruiter') {
        router.push('/');
        return;
      }

      const allJobs = await jobStore.getAllJobs();

      setJobs(allJobs);

      const counts: Record<string, number> = {};

      for (const job of allJobs) {
        const apps = await jobStore.getApplicationsByJobId(job.id);
        counts[job.id] = apps.length;
      }

      setApplicationCounts(counts);
      setLoading(false);
    };

    load();
  }, [router]);

  const getCount = (jobId: string) => applicationCounts[jobId] || 0;

  const totalApplications = jobs.reduce((sum, j) => sum + getCount(j.id), 0);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <PageShell
      variant="recruiter"
      title="Recruiter Dashboard"
      subtitle="Manage your job postings and applications"
      actions={
        <Link
          href="/recruiter/jobs/new"
          className="bg-[#043927] text-white px-4 py-2 rounded-lg hover:bg-[#065a3a] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Post Job
        </Link>
      }
    >
      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-white rounded-lg border">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-green-700" />
            <div>
              <p className="text-xl font-bold">{jobs.length}</p>
              <p className="text-sm text-gray-500">Total Jobs</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-lg border">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xl font-bold">{totalApplications}</p>
              <p className="text-sm text-gray-500">Applications</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-lg border">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xl font-bold">
                {jobs.filter(j => getCount(j.id) > 0).length}
              </p>
              <p className="text-sm text-gray-500">Active Listings</p>
            </div>
          </div>
        </div>
      </div>

      {/* JOB LIST */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b font-semibold">Your Jobs</div>

        {jobs.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No jobs posted yet.
          </div>
        ) : (
          <div className="divide-y">
            {jobs.map(job => (
              <div key={job.id} className="p-4 flex items-center justify-between">
                
                {/* LEFT */}
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.location}</p>
                </div>

                {/* MIDDLE */}
                <div className="text-sm text-gray-600">
                  {getCount(job.id)} applications
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex gap-2">
                  <Link
                    href={`/recruiter/jobs/${job.id}/applications`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/recruiter/jobs/${job.id}/edit`}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}