'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, FileText, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { Application } from '@/types/job';

export default function ApplicationReviewPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  
  const [mounted, setMounted] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    setMounted(true);
    const currentUser = authStore.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'recruiter') {
      router.push('/login');
      return;
    }

    if (jobId) {
      const jobData = jobStore.getJobById(jobId);
      if (jobData) {
        setJob(jobData);
        loadApplications();
      } else {
        router.push('/recruiter/dashboard');
      }
    }
  }, [jobId, router]);

  const loadApplications = () => {
    if (jobId) {
      const apps = jobStore.getApplicationsByJobId(jobId);
      setApplications(apps.sort((a, b) => b.aiScore - a.aiScore));
    }
  };

  const handleStatusUpdate = (appId: string, status: 'accepted' | 'rejected') => {
    jobStore.updateApplicationStatus(appId, status);
    loadApplications();
    setSelectedApp(null);
    alert(`Application ${status === 'accepted' ? 'accepted' : 'rejected'} successfully!`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-100';
    if (score >= 70) return 'bg-blue-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    if (score >= 50) return 'Fair Match';
    return 'Weak Match';
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (!mounted || !job) {
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-[#043927] mb-2">{job.title}</h1>
          <p className="text-gray-600">{job.location} • {job.salary}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-[#043927]">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all' 
                  ? 'bg-[#043927] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'pending' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'accepted' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Accepted ({stats.accepted})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'rejected' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected ({stats.rejected})
            </button>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No one has applied to this job yet.' 
                  : `No ${filter} applications for this job.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApplications.map((app) => (
                <div key={app.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start gap4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{app.candidateName}</h3>
                        <div className={`px-3 py-1 rounded-full ${getScoreBgColor(app.aiScore)}`}>
                          <div className="flex items-center gap-1">
                            <TrendingUp className={`w-4 h-4 ${getScoreColor(app.aiScore)}`} />
                            <span className={`text-sm font-semibold ${getScoreColor(app.aiScore)}`}>
                              {app.aiScore}% {getScoreLabel(app.aiScore)}
                            </span>
                          </div>
                        </div>
                        {app.status !== 'pending' && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            app.status === 'accepted' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {app.status === 'accepted' ? 'Accepted' : 'Rejected'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Mail className="w-4 h-4" />
                        {app.candidateEmail}
                        <span className="mx-2">•</span>
                        Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </div>
                      <p className="text-gray-700 line-clamp-2">{app.coverLetter}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedApp(app)}
                        className="px-4 py-2 bg-[#043927] text-white rounded-lg hover:bg-[#065a3a] transition flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </button>
                      {app.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'accepted')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Accept"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedApp.candidateName}</h2>
                  <p className="text-gray-600">{selectedApp.candidateEmail}</p>
                </div>
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* AI Score */}
              <div className={`p-4 rounded-lg mb-6 ${getScoreBgColor(selectedApp.aiScore)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">AI Resume Score</div>
                    <div className={`text-3xl font-bold ${getScoreColor(selectedApp.aiScore)}`}>
                      {selectedApp.aiScore}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getScoreColor(selectedApp.aiScore)}`}>
                      {getScoreLabel(selectedApp.aiScore)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Applied {new Date(selectedApp.appliedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Cover Letter</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedApp.coverLetter}</p>
                </div>
              </div>

              {/* Resume Link */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Resume</h3>
                <div className="text-gray-600 text-sm">
                  Resume ID: {selectedApp.resumeUrl}
                </div>
              </div>

              {/* Actions */}
              {selectedApp.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => handleStatusUpdate(selectedApp.id, 'accepted')}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Accept Application
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Application
                  </button>
                </div>
              )}
              
              {selectedApp.status !== 'pending' && (
                <div className={`p-4 rounded-lg ${
                  selectedApp.status === 'accepted' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {selectedApp.status === 'accepted' ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">Application Accepted</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-800">Application Rejected</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
