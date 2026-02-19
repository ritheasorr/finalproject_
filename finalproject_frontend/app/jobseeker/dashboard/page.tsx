'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, FileText, Briefcase, LogOut, Upload } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { applicationStore } from '@/store/applicationStore';

export default function JobSeekerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(authStore.getCurrentUser());
  const [profile, setProfile] = useState(user ? authStore.getJobSeekerProfile(user.id) : null);
  const [resumes, setResumes] = useState(user ? authStore.getResumesByUserId(user.id) : []);
  const [applications, setApplications] = useState<any[]>([]);
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

  const normalizeEmail = (email: string | null | undefined): string => {
    return (email ?? '').trim().toLowerCase();
  };

  const loadData = (userData: any) => {
    if (!userData) return;
    setProfile(authStore.getJobSeekerProfile(userData.id));
    setResumes(authStore.getResumesByUserId(userData.id));
    const userEmail = normalizeEmail(userData.email);
    const apps = applicationStore.getAllApplications().filter(app =>
      normalizeEmail(app.candidate_email) === userEmail
    );
    setApplications(apps);
  };

  const handleLogout = () => {
    authStore.logout();
    router.push('/login');
  };

  if (!mounted || !user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/jobseeker" className="text-2xl font-bold text-[#043927]">
              CareerLaunch
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/jobseeker/jobs" className="text-gray-700 hover:text-[#043927] transition">
                Browse Jobs
              </Link>
              <Link href="/jobseeker/profile" className="text-gray-700 hover:text-[#043927] transition">
                My Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#043927] mb-2">
            Welcome back, {user.full_name.split(' ')[0]}!
          </h1>
          <p className="text-gray-600">Track your applications and manage your job search</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-[#043927]/10 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-[#043927]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#043927]">{stats.applications}</div>
                <div className="text-sm text-gray-600">Total Applications</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#043927]">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#043927]">{stats.accepted}</div>
                <div className="text-sm text-gray-600">Accepted</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#043927]">{stats.resumes}</div>
                <div className="text-sm text-gray-600">Uploaded Resumes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/jobseeker/jobs"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition text-left block"
          >
            <div className="bg-[#043927] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-[#043927] mb-2">Browse Jobs</h3>
            <p className="text-gray-600 text-sm">Find your next opportunity</p>
          </Link>

          <Link
            href="/jobseeker/profile"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition text-left block"
          >
            <div className="bg-[#065a3a] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-[#043927] mb-2">Update Profile</h3>
            <p className="text-gray-600 text-sm">Keep your information current</p>
          </Link>

          <div className="bg-white p-6 rounded-lg shadow-sm opacity-50 text-left">
            <div className="bg-[#087d4e] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-[#043927] mb-2">Manage Resumes</h3>
            <p className="text-gray-600 text-sm">Coming soon...</p>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#043927]">Recent Applications</h2>
          </div>
          
          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-600 mb-6">Start applying to jobs to see them here</p>
              <Link 
                href="/jobseeker/jobs"
                className="inline-block bg-[#043927] text-white px-6 py-3 rounded-lg hover:bg-[#065a3a] transition"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-[#043927] mb-1">Job Application</h3>
                      <p className="text-sm text-gray-600 mb-2">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
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
