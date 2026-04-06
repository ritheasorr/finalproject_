'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, FileText, Briefcase, Upload, Building2, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { applicationStore } from '@/store/applicationStore';
import { Application } from '@/types/job';
import Navigation from '@/components/Navigation';

export default function JobSeekerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(authStore.getCurrentUser());
  const [profile, setProfile] = useState(user ? authStore.getJobSeekerProfile(user.id) : null);
  const [resumes, setResumes] = useState(user ? authStore.getResumesByUserId(user.id) : []);
  const [applications, setApplications] = useState<Application[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = authStore.getCurrentUser();
    if (!currentUser || currentUser.role !== 'jobseeker') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData(currentUser);
  }, [router]);

  const loadData = async (userData: any) => {
    if (!userData) return;
    
    let profile = authStore.getJobSeekerProfile(userData.id);
    if (!profile) {
      profile = authStore.updateJobSeekerProfile(userData.id, {
        userId: userData.id,
        full_name: userData.full_name,
        education: '',
        skills: '',
        location: '',
      });
    }
    setProfile(profile);
    setResumes(authStore.getResumesByUserId(userData.id));
    
    const apps = await applicationStore.getApplicationsByUserId(userData.id);
    setApplications(apps);
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'rejected': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  if (!mounted || !user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const stats = {
    applications: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    resumes: resumes.length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="jobseeker" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.full_name.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 mt-1">Track your applications and manage your job search</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#043927]/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#043927]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.applications}</div>
                <div className="text-xs text-gray-500">Applications</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.accepted}</div>
                <div className="text-xs text-gray-500">Accepted</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Upload className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.resumes}</div>
                <div className="text-xs text-gray-500">Resumes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/jobseeker/jobs"
            className="bg-[#043927] rounded-xl p-6 hover:bg-[#065a3a] transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Browse Jobs</h3>
                <p className="text-white/70 text-sm">Find your next opportunity</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/jobseeker/profile"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#043927]/30 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Update Profile</h3>
                <p className="text-gray-500 text-sm">Keep your information current</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-[#043927] transition-all" />
            </div>
          </Link>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            {applications.length > 0 && (
              <span className="text-sm text-gray-500">{applications.length} total</span>
            )}
          </div>
          
          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No applications yet</h3>
              <p className="text-gray-500 text-sm mb-4">Start applying to jobs to see them here</p>
              <Link 
                href="/jobseeker/jobs"
                className="inline-block bg-[#043927] text-white px-5 py-2.5 rounded-lg hover:bg-[#065a3a] transition text-sm font-medium"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {applications.slice(0, 10).map((app) => (
                <div key={app.id} className="px-6 py-4 hover:bg-gray-50/50 transition">
                  <div className="flex items-center gap-4">
                    {/* Company Icon */}
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-gray-500" />
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {app.job_title || 'Job Application'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {app.job_company && <span>{app.job_company} &bull; </span>}
                        Applied {formatDate(app.applied_at)}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(app.status)}`}>
                        {getStatusIcon(app.status)}
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
