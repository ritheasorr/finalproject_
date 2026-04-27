'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  Filter,
  TrendingUp,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { API_BASE_URL } from '@/lib/api';
import { Application, Job } from '@/types/job';
import { PageShell } from '@/components/ui/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function ApplicationReviewPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;

  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [scoreBand, setScoreBand] = useState<'all' | '85-100' | '70-84' | '50-69' | '0-49'>('all');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'date_desc' | 'date_asc'>('score_desc');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ appId: string; status: 'accepted' | 'rejected' } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

      if (!jobId) return;

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

  const executeStatusUpdate = async () => {
    if (!pendingAction) return;
    try {
      setIsUpdating(true);
      await jobStore.updateApplicationStatus(pendingAction.appId, pendingAction.status);
      await loadApplications();
      setExpandedApp(null);
      toast.success(`Application ${pendingAction.status === 'accepted' ? 'accepted' : 'rejected'} successfully`);
      setPendingAction(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update application status';
      toast.error(message);
    } finally {
      setIsUpdating(false);
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
      case 'accepted':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  const getMatchLevel = (app: Application): 'excellent' | 'strong' | 'good' | 'partial' | 'weak' => {
    if (app.ai_match_level && app.ai_match_level !== 'unknown') {
      return app.ai_match_level as 'excellent' | 'strong' | 'good' | 'partial' | 'weak';
    }
    if (app.ai_score >= 90) return 'excellent';
    if (app.ai_score >= 80) return 'strong';
    if (app.ai_score >= 65) return 'good';
    if (app.ai_score >= 45) return 'partial';
    return 'weak';
  };

  const getMatchLevelStyle = (level: 'excellent' | 'strong' | 'good' | 'partial' | 'weak') => {
    if (level === 'excellent') return 'bg-green-50 text-green-700 border-green-200';
    if (level === 'strong') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (level === 'good') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (level === 'partial') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getMatchLevelLabel = (level: 'excellent' | 'strong' | 'good' | 'partial' | 'weak') => {
    if (level === 'excellent') return 'Excellent Match';
    if (level === 'strong') return 'Strong Match';
    if (level === 'good') return 'Good Match';
    if (level === 'partial') return 'Partial Match';
    return 'Weak Match';
  };

  const filteredApplications = useMemo(() => {
    const inScoreBand = (score: number) => {
      if (scoreBand === 'all') return true;
      if (scoreBand === '85-100') return score >= 85;
      if (scoreBand === '70-84') return score >= 70 && score < 85;
      if (scoreBand === '50-69') return score >= 50 && score < 70;
      return score < 50;
    };

    const filtered = applications.filter((app) => {
      const matchesStatus = filter === 'all' ? true : app.status === filter;
      const matchesScore = inScoreBand(app.ai_score || 0);
      return matchesStatus && matchesScore;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'score_desc') return (b.ai_score || 0) - (a.ai_score || 0);
      if (sortBy === 'score_asc') return (a.ai_score || 0) - (b.ai_score || 0);
      if (sortBy === 'date_asc') return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
      return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
    });
  }, [applications, filter, scoreBand, sortBy]);

  const applicantAvatarById = useMemo(() => {
    const map = new Map<string, string>();
    filteredApplications.forEach((app) => {
      const avatarUrl =
        app.candidate_avatar_url ||
        (app.candidate_id ? authStore.getJobSeekerProfile(app.candidate_id)?.avatar_url || '' : '');
      if (avatarUrl) {
        map.set(app.id, avatarUrl);
      }
    });
    return map;
  }, [filteredApplications]);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-6xl px-4">
          <Skeleton className="h-10 mb-4" />
          <Skeleton className="h-16 mb-4" />
          <Skeleton className="h-24 mb-3" />
          <Skeleton className="h-24 mb-3" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <PageShell
      variant="recruiter"
      title={job.title}
      subtitle={`${job.company ? `${job.company} - ` : ''}${job.location || ''}`}
      actions={
        <Link href="/recruiter/dashboard" className="text-sm text-gray-600 hover:text-[#043927] transition inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      }
    >
      <div className="surface-card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border border-[#0f5d43]/15 bg-[#f7fcf9] px-3 py-2.5">
            <p className="text-xs text-gray-500">Job type</p>
            <p className="font-semibold text-gray-900 mt-1">{job.job_type}</p>
          </div>
          <div className="rounded-lg border border-[#0f5d43]/15 bg-[#f7fcf9] px-3 py-2.5">
            <p className="text-xs text-gray-500">Salary</p>
            <p className="font-semibold text-gray-900 mt-1">{job.salary || 'Not specified'}</p>
          </div>
          <div className="rounded-lg border border-[#0f5d43]/15 bg-[#f7fcf9] px-3 py-2.5">
            <p className="text-xs text-gray-500">Applications</p>
            <p className="font-semibold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-[#0f5d43]/15 bg-[#f7fcf9] px-3 py-2.5">
            <p className="text-xs text-gray-500">Average AI score</p>
            <p className="font-semibold text-gray-900 mt-1">
              {applications.length > 0
                ? `${Math.round(applications.reduce((sum, app) => sum + (app.ai_score || 0), 0) / applications.length)}%`
                : '0%'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <div className="rounded-lg border border-[#0f5d43]/15 bg-white px-3 py-3">
            <h3 className="text-xs font-semibold text-[#0f5d43] uppercase tracking-wide">Description</h3>
            <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-wrap">{job.description || 'No description provided.'}</p>
          </div>
          <div className="rounded-lg border border-[#0f5d43]/15 bg-white px-3 py-3">
            <h3 className="text-xs font-semibold text-[#0f5d43] uppercase tracking-wide">Requirements</h3>
            <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-wrap">{job.requirements || 'No requirements provided.'}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'all' as const, label: 'All', count: stats.total },
          { key: 'pending' as const, label: 'Pending', count: stats.pending },
          { key: 'accepted' as const, label: 'Accepted', count: stats.accepted },
          { key: 'rejected' as const, label: 'Rejected', count: stats.rejected },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === tab.key ? 'bg-[#043927] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="surface-card p-3 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={scoreBand}
              onChange={(e) => setScoreBand(e.target.value as 'all' | '85-100' | '70-84' | '50-69' | '0-49')}
              className="w-full rounded-lg border border-[#0f5d43]/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
            >
              <option value="all">All AI scores</option>
              <option value="85-100">85 - 100 (Excellent)</option>
              <option value="70-84">70 - 84 (Good)</option>
              <option value="50-69">50 - 69 (Fair)</option>
              <option value="0-49">0 - 49 (Low)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score_desc' | 'score_asc' | 'date_desc' | 'date_asc')}
              className="w-full rounded-lg border border-[#0f5d43]/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
            >
              <option value="score_desc">Score: High to Low</option>
              <option value="score_asc">Score: Low to High</option>
              <option value="date_desc">Latest Application</option>
              <option value="date_asc">Oldest Application</option>
            </select>
          </div>

          <button
            onClick={() => {
              setFilter('all');
              setScoreBand('all');
              setSortBy('score_desc');
            }}
            className="rounded-lg border border-[#0f5d43]/15 text-[#0f5d43] px-3 py-2 text-sm font-medium hover:bg-[#edf7f1] transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No applications found</h3>
          <p className="text-gray-500 text-sm mb-4">
            {filter === 'all' ? 'No one has applied to this job yet.' : `No ${filter} applications.`}
          </p>
          <button
            onClick={() => setFilter('all')}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition"
          >
            Show All
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => {
            const isExpanded = expandedApp === app.id;
            const candidateAvatar = applicantAvatarById.get(app.id) || '';
            const matchLevel = getMatchLevel(app);
            const matchedSkills = (app.ai_matched_skills || []).slice(0, 8);
            const missingSkills = (app.ai_missing_skills || []).slice(0, 8);
            const aiSummary = app.ai_explanation || 'Assessment unavailable from AI service. Please verify technical fit manually.';
            const recommendation = app.ai_recommendation || 'Proceed with a short technical screening to validate core requirements.';
            return (
              <div key={app.id} className="surface-card overflow-hidden fade-in-up">
                <div className="px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition" onClick={() => setExpandedApp(isExpanded ? null : app.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#043927]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {candidateAvatar ? (
                        <img
                          src={candidateAvatar}
                          alt={app.candidate_name || 'Candidate'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-[#043927]">
                          {app.candidate_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{app.candidate_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(app.status)}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-gray-500">
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

                    <div className={`px-3 py-1.5 rounded-lg border ${getScoreBg(app.ai_score)} flex items-center gap-1.5 flex-shrink-0`}>
                      <TrendingUp className={`w-3.5 h-3.5 ${getScoreColor(app.ai_score)}`} />
                      <span className={`text-sm font-bold ${getScoreColor(app.ai_score)}`}>{app.ai_score}%</span>
                      <span className={`text-xs ${getScoreColor(app.ai_score)}`}>{getScoreLabel(app.ai_score)}</span>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setPendingAction({ appId: app.id, status: 'accepted' })}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Accept application</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setPendingAction({ appId: app.id, status: 'rejected' })}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Reject application</TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    <div className="flex-shrink-0">{isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50">
                    <div className="grid md:grid-cols-2 gap-6">
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

                        <div className={`mt-4 p-3 rounded-lg border ${getScoreBg(app.ai_score)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">AI Resume Score</span>
                            <span className={`text-lg font-bold ${getScoreColor(app.ai_score)}`}>{app.ai_score}%</span>
                          </div>
                          <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                app.ai_score >= 85 ? 'bg-emerald-500' : app.ai_score >= 70 ? 'bg-blue-500' : app.ai_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${app.ai_score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          Cover Letter
                        </h4>
                        <div className="surface-card p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {app.cover_letter || 'No cover letter provided.'}
                        </div>

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

                    <div className="mt-5 rounded-xl border border-[#0f5d43]/15 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#0f5d43]" />
                          AI Candidate Assessment
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getMatchLevelStyle(matchLevel)}`}>
                            {getMatchLevelLabel(matchLevel)}
                          </span>
                          <span className="text-xs font-semibold text-[#0f5d43] bg-[#edf7f1] border border-[#0f5d43]/20 px-2.5 py-1 rounded-full">
                            Score: {app.ai_score}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {aiSummary}
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 mt-4">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Matched Skills</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {matchedSkills.length > 0 ? (
                              matchedSkills.map((skill) => (
                                <span key={`${app.id}-matched-${skill}`} className="text-xs px-2 py-1 rounded-full border border-emerald-200 bg-white text-emerald-700">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-emerald-700">No explicit matched skills extracted.</span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Missing / Verify</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {missingSkills.length > 0 ? (
                              missingSkills.map((skill) => (
                                <span key={`${app.id}-missing-${skill}`} className="text-xs px-2 py-1 rounded-full border border-amber-200 bg-white text-amber-700">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-amber-700">No major gaps flagged.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-[#0f5d43]/15 bg-[#f7fcf9] px-3 py-2.5 text-sm text-gray-700 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 mt-0.5 text-[#0f5d43]" />
                        <div>
                          <p className="text-xs text-gray-500">Recommendation</p>
                          <p className="font-medium text-[#0f5d43]">{recommendation}</p>
                        </div>
                      </div>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex gap-3 mt-5 pt-5 border-t border-gray-200">
                        <button
                          onClick={() => setPendingAction({ appId: app.id, status: 'accepted' })}
                          className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept Application
                        </button>
                        <button
                          onClick={() => setPendingAction({ appId: app.id, status: 'rejected' })}
                          className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Application
                        </button>
                      </div>
                    )}

                    {app.status !== 'pending' && (
                      <div className={`mt-5 p-3 rounded-lg flex items-center gap-2 ${app.status === 'accepted' ? 'bg-emerald-50' : 'bg-red-50'}`}>
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

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.status === 'accepted'
                ? 'This candidate will be marked as accepted.'
                : 'This candidate will be marked as rejected.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeStatusUpdate} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
