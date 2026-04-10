'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, GraduationCap, FileText, CheckCircle, XCircle, AlertCircle, TrendingUp, User, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { API_BASE_URL } from '@/lib/api';
import { Application, Job } from '@/types/job';

export default function ApplicationReviewPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    if (jobId) {
      const apps = await jobStore.getApplicationsByJobId(jobId);
      setApplications(apps.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0)));
    }
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const currentUser = authStore.getCurrentUser();
      if (!currentUser || currentUser.role !== 'recruiter') {
        router.push('/login');
        return;
      }

      if (!jobId) {
        return;
      }

      const jobData = await jobStore.getJobById(jobId);
      if (!jobData) {
        router.push('/recruiter/dashboard');
        return;
      }

      if (!cancelled) {
        setJob(jobData);
        await loadApplications();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, router, loadApplications]);

  const handleStatusUpdate = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      await jobStore.updateApplicationStatus(appId, status);
      await loadApplications();
      setExpandedApp(null);
      alert(`Application ${status === 'accepted' ? 'accepted' : 'rejected'} successfully!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update application status';
      alert(message);
    }
  };


  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'rejected': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/recruiter" className="text-2xl font-bold text-[#043927]">
              CareerLaunch
            </Link>
            <Link 
              href="/recruiter/dashboard"
              className="text-sm text-gray-600 hover:text-[#043927] transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          <p className="text-gray-500 mt-1">
            {job.company && <span>{job.company} &bull; </span>}
            {job.location}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all' as const, label: 'All', count: stats.total },
            { key: 'pending' as const, label: 'Pending', count: stats.pending },
            { key: 'accepted' as const, label: 'Accepted', count: stats.accepted },
            { key: 'rejected' as const, label: 'Rejected', count: stats.rejected },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === tab.key
                  ? 'bg-[#043927] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Applications */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No applications found</h3>
            <p className="text-gray-500 text-sm">
              {filter === 'all' 
                ? 'No one has applied to this job yet.' 
                : `No ${filter} applications.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app) => {
              const isExpanded = expandedApp === app.id;
              return (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Main Row */}
                  <div
                    className="px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition"
                    onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[#043927]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-[#043927]">
                          {app.candidate_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>

                      {/* Candidate Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">{app.candidate_name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(app.status)}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {app.candidate_email}
                          </span>
                          {app.candidate_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {app.candidate_phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(app.applied_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* AI Score */}
                      <div className={`px-3 py-1.5 rounded-lg border ${getScoreBg(app.ai_score)} flex items-center gap-1.5 flex-shrink-0`}>
                        <TrendingUp className={`w-3.5 h-3.5 ${getScoreColor(app.ai_score)}`} />
                        <span className={`text-sm font-bold ${getScoreColor(app.ai_score)}`}>{app.ai_score}%</span>
                        <span className={`text-xs ${getScoreColor(app.ai_score)}`}>{getScoreLabel(app.ai_score)}</span>
                      </div>

                      {/* Quick Actions (pending only) */}
                      {app.status === 'pending' && (
                        <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'accepted')}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Accept"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {/* Expand Toggle */}
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Candidate Details */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            Candidate Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {app.candidate_email}
                            </div>
                            {app.candidate_phone && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {app.candidate_phone}
                              </div>
                            )}
                            {app.candidate_school && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                {app.candidate_school}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              Applied {new Date(app.applied_at).toLocaleDateString()}
                            </div>
                          </div>

                          {/* AI Score Detail */}
                          <div className={`mt-4 p-3 rounded-lg border ${getScoreBg(app.ai_score)}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-600">AI Resume Score</span>
                              <span className={`text-lg font-bold ${getScoreColor(app.ai_score)}`}>{app.ai_score}%</span>
                            </div>
                            <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  app.ai_score >= 85 ? 'bg-emerald-500' :
                                  app.ai_score >= 70 ? 'bg-blue-500' :
                                  app.ai_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${app.ai_score}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Cover Letter */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            Cover Letter
                          </h4>
                          <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {app.cover_letter || 'No cover letter provided.'}
                          </div>

                          {/* Resume */}
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                              <FileText className="w-4 h-4" />
                              Resume
                            </h4>
                            {app.resume_url ? (
                              <a
                                href={`${API_BASE_URL}${app.resume_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-[#043927] hover:underline"
                              >
                                Download Resume
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <div className="text-sm text-gray-500">No resume uploaded.</div>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* Action Buttons */}
                      {app.status === 'pending' && (
                        <div className="flex gap-3 mt-5 pt-5 border-t border-gray-200">
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'accepted')}
                            className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept Application
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                            className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject Application
                          </button>
                        </div>
                      )}

                      {app.status !== 'pending' && (
                        <div className={`mt-5 p-3 rounded-lg flex items-center gap-2 ${
                          app.status === 'accepted' ? 'bg-emerald-50' : 'bg-red-50'
                        }`}>
                          {app.status === 'accepted' ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm font-medium text-emerald-700">Application Accepted</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-red-700">Application Rejected</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
