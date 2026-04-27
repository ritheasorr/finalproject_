'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Eye,
  FileDown,
  Filter,
  ListFilter,
  Search,
  Sparkles,
  UserRoundCheck,
  Users,
  XCircle,
} from 'lucide-react';

import Navigation from '@/components/Navigation';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { API_BASE_URL, apiClient } from '@/lib/api';
import { Job } from '@/types/job';
import { Skeleton } from '@/components/ui/skeleton';

type BackendApplicationStatus = 'submitted' | 'reviewing' | 'interview' | 'rejected' | 'hired';
type PipelineStage = 'New' | 'Screening' | 'Shortlisted' | 'Interview' | 'Hired' | 'Rejected';
type StatusFilter = 'all' | PipelineStage;
type DateFilter = 'all' | '7d' | '30d' | '90d';

interface BackendReceivedApplication {
  _id: string;
  candidate: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    school?: string;
    avatarUrl?: string;
    avatar_url?: string;
    profileImageUrl?: string;
  };
  job: {
    _id: string;
    title: string;
    company: string;
    type: string;
    location?: string;
    status: string;
  };
  status: BackendApplicationStatus;
  resume?: {
    url?: string;
    originalName?: string;
  };
  aiScore?: number;
  createdAt: string;
}

interface DashboardApplicant {
  id: string;
  candidateId: string;
  candidateAvatarUrl: string;
  name: string;
  email: string;
  phone: string;
  school: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  status: BackendApplicationStatus;
  aiScore: number;
  appliedAt: string;
  resumeUrl: string;
}

const pipelineColumns: PipelineStage[] = ['New', 'Screening', 'Shortlisted', 'Interview', 'Hired', 'Rejected'];
const pieColors = ['#3E9169', '#1C6B4D'];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function RecruiterDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<DashboardApplicant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [scheduledInterviewIds, setScheduledInterviewIds] = useState<Set<string>>(new Set());
  const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());

  const loadDashboard = async () => {
    const user = authStore.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'recruiter') {
      router.push('/');
      return;
    }

    setLoading(true);
    try {
      const [jobList, receivedResponse] = await Promise.all([
        jobStore.getJobsByRecruiterId(user.id),
        apiClient.get<{ applications: BackendReceivedApplication[] }>('/applications/received'),
      ]);

      const mappedApps: DashboardApplicant[] = (receivedResponse.applications || []).map((app) => ({
        id: app._id,
        candidateId: app.candidate._id,
        candidateAvatarUrl: app.candidate.avatarUrl || app.candidate.avatar_url || app.candidate.profileImageUrl || '',
        name: `${app.candidate.firstName} ${app.candidate.lastName}`.trim(),
        email: app.candidate.email || '',
        phone: app.candidate.phoneNumber || '',
        school: app.candidate.school || '',
        jobId: app.job._id,
        jobTitle: app.job.title || 'Untitled role',
        jobCompany: app.job.company || '',
        status: app.status,
        aiScore: typeof app.aiScore === 'number' ? app.aiScore : 0,
        appliedAt: app.createdAt,
        resumeUrl: app.resume?.url ? `${API_BASE_URL}${app.resume.url}` : '',
      }));

      setJobs(jobList);
      setApplications(mappedApps);
      setShortlistedIds(
        new Set(mappedApps.filter((app) => app.aiScore >= 85 && !['rejected', 'hired'].includes(app.status)).map((a) => a.id))
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load recruiter dashboard';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    void loadDashboard();
  }, [router]);

  const inDateWindow = (dateISO: string, filter: DateFilter) => {
    if (filter === 'all') return true;
    const days = filter === '7d' ? 7 : filter === '30d' ? 30 : 90;
    const limit = new Date();
    limit.setDate(limit.getDate() - days);
    return new Date(dateISO) >= limit;
  };

  const stageByAppId = useMemo(() => {
    const map = new Map<string, PipelineStage>();
    applications.forEach((app) => {
      let stage: PipelineStage = 'New';
      if (app.status === 'rejected') {
        stage = 'Rejected';
      } else if (app.status === 'hired') {
        stage = 'Hired';
      } else if (app.status === 'interview' || scheduledInterviewIds.has(app.id)) {
        stage = 'Interview';
      } else if (shortlistedIds.has(app.id)) {
        stage = 'Shortlisted';
      } else if (app.status === 'reviewing') {
        stage = 'Screening';
      }
      map.set(app.id, stage);
    });
    return map;
  }, [applications, shortlistedIds, scheduledInterviewIds]);

  const filteredApplicants = useMemo(() => {
    return applications.filter((app) => {
      const stage = stageByAppId.get(app.id) || 'New';
      const bySearch = `${app.name} ${app.email} ${app.jobTitle}`.toLowerCase().includes(searchTerm.toLowerCase());
      const byJob = selectedJobId === 'all' || app.jobId === selectedJobId;
      const byStatus = statusFilter === 'all' || stage === statusFilter;
      const byDate = inDateWindow(app.appliedAt, dateFilter);
      return bySearch && byJob && byStatus && byDate;
    });
  }, [applications, stageByAppId, searchTerm, selectedJobId, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    const total = filteredApplicants.length;
    const shortlisted = filteredApplicants.filter((a) => stageByAppId.get(a.id) === 'Shortlisted').length;
    const pending = filteredApplicants.filter((a) => {
      const stage = stageByAppId.get(a.id);
      return stage === 'New' || stage === 'Screening';
    }).length;
    const interview = filteredApplicants.filter((a) => stageByAppId.get(a.id) === 'Interview').length;

    return {
      total,
      shortlisted,
      pending,
      interview,
    };
  }, [filteredApplicants, stageByAppId]);

  const scoreDistributionData = useMemo(() => {
    const buckets = { '0-49': 0, '50-69': 0, '70-84': 0, '85-100': 0 };
    filteredApplicants.forEach((app) => {
      if (app.aiScore < 50) buckets['0-49'] += 1;
      else if (app.aiScore < 70) buckets['50-69'] += 1;
      else if (app.aiScore < 85) buckets['70-84'] += 1;
      else buckets['85-100'] += 1;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [filteredApplicants]);

  const applicantsByJobData = useMemo(() => {
    const counts = new Map<string, number>();
    filteredApplicants.forEach((app) => {
      counts.set(app.jobTitle, (counts.get(app.jobTitle) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([job, count]) => ({ job: job.length > 18 ? `${job.slice(0, 18)}...` : job, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredApplicants]);

  const funnelData = useMemo(() => {
    const byStage = {
      New: 0,
      Screening: 0,
      Shortlisted: 0,
      Interview: 0,
      Hired: 0,
      Rejected: 0,
    };
    filteredApplicants.forEach((app) => {
      const stage = stageByAppId.get(app.id) || 'New';
      byStage[stage] += 1;
    });
    return pipelineColumns.map((stage) => ({ value: byStage[stage], name: stage }));
  }, [filteredApplicants, stageByAppId]);

  const hiringFunnelChartData = useMemo(() => {
    const baseline = funnelData[0]?.value || 0;
    return funnelData.map((entry) => ({
      ...entry,
      conversion: baseline > 0 ? Math.round((entry.value / baseline) * 100) : 0,
    }));
  }, [funnelData]);

  const monthlyTrendData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      return { key, label, applications: 0 };
    });
    const indexMap = new Map(months.map((m) => [m.key, m]));
    filteredApplicants.forEach((app) => {
      const d = new Date(app.appliedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const target = indexMap.get(key);
      if (target) target.applications += 1;
    });
    return months.map(({ label, applications: count }) => ({ label, count }));
  }, [filteredApplicants]);

  const acceptedRejectedData = useMemo(() => {
    const accepted = filteredApplicants.filter((a) => stageByAppId.get(a.id) === 'Hired').length;
    const rejected = filteredApplicants.filter((a) => stageByAppId.get(a.id) === 'Rejected').length;
    return [
      { name: 'Accepted', value: accepted },
      { name: 'Rejected', value: rejected },
    ];
  }, [filteredApplicants, stageByAppId]);

  const pipelineBoard = useMemo(() => {
    const grouped: Record<PipelineStage, DashboardApplicant[]> = {
      New: [],
      Screening: [],
      Shortlisted: [],
      Interview: [],
      Hired: [],
      Rejected: [],
    };
    filteredApplicants.forEach((app) => {
      const stage = stageByAppId.get(app.id) || 'New';
      grouped[stage].push(app);
    });
    return grouped;
  }, [filteredApplicants, stageByAppId]);

  const applicantAvatarById = useMemo(() => {
    const map = new Map<string, string>();
    filteredApplicants.forEach((app) => {
      const avatarUrl =
        app.candidateAvatarUrl ||
        (app.candidateId ? authStore.getJobSeekerProfile(app.candidateId)?.avatar_url || '' : '');
      if (avatarUrl) {
        map.set(app.id, avatarUrl);
      }
    });
    return map;
  }, [filteredApplicants]);

  const jobPerformance = useMemo(() => {
    return jobs.map((job) => {
      const jobApps = filteredApplicants.filter((app) => app.jobId === job.id);
      const applicationsCount = jobApps.length;
      const highScore = jobApps.filter((app) => app.aiScore >= 85).length;
      const avgScore =
        applicationsCount > 0
          ? Math.round(jobApps.reduce((sum, app) => sum + app.aiScore, 0) / applicationsCount)
          : 0;
      const conversion = applicationsCount > 0 ? Math.round((highScore / applicationsCount) * 100) : 0;
      return {
        id: job.id,
        title: job.title,
        applications: applicationsCount,
        highScore,
        averageScore: avgScore,
        conversion,
      };
    });
  }, [filteredApplicants, jobs]);

  const topPerformingJobs = useMemo(() => {
    return [...jobPerformance]
      .sort((a, b) => b.conversion - a.conversion || b.applications - a.applications)
      .slice(0, 4);
  }, [jobPerformance]);

  const postedJobs = useMemo(() => {
    const statsByJob = new Map<string, { applications: number; highScore: number; averageScore: number }>();

    jobs.forEach((job) => {
      const jobApps = applications.filter((app) => app.jobId === job.id);
      const totalScore = jobApps.reduce((sum, app) => sum + app.aiScore, 0);
      const averageScore = jobApps.length > 0 ? Math.round(totalScore / jobApps.length) : 0;
      const highScore = jobApps.filter((app) => app.aiScore >= 85).length;

      statsByJob.set(job.id, {
        applications: jobApps.length,
        highScore,
        averageScore,
      });
    });

    return [...jobs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((job) => {
        const metrics = statsByJob.get(job.id) || { applications: 0, highScore: 0, averageScore: 0 };
        return {
          ...job,
          ...metrics,
        };
      });
  }, [jobs, applications]);

  const quickListedJobs = useMemo(() => postedJobs.slice(0, 6), [postedJobs]);

  const aiInsights = useMemo(() => {
    const insights: string[] = [];
    const highestApplicantJob = [...applicantsByJobData].sort((a, b) => b.count - a.count)[0];
    if (highestApplicantJob) {
      insights.push(`${highestApplicantJob.job} role has ${highestApplicantJob.count} new applicants in your filtered view.`);
    }

    const highScoreCount = filteredApplicants.filter((a) => a.aiScore >= 85).length;
    insights.push(`${highScoreCount} candidates scored above 85% AI match.`);

    const lowConversion = [...jobPerformance]
      .filter((job) => job.applications > 0 && job.conversion < 4)
      .sort((a, b) => a.conversion - b.conversion)[0];
    if (lowConversion) {
      insights.push(`${lowConversion.title} has low conversion (${lowConversion.conversion}%). Consider updating role details.`);
    }

    if (stats.pending > 0) {
      insights.push(`Review ${stats.pending} pending candidates before upcoming interview deadlines.`);
    }

    return insights.length > 0 ? insights : ['Not enough recent application data for deeper insight yet.'];
  }, [applicantsByJobData, filteredApplicants, jobPerformance, stats.pending]);

  const handleToggleShortlist = (applicationId: string) => {
    setShortlistedIds((prev) => {
      const next = new Set(prev);
      if (next.has(applicationId)) next.delete(applicationId);
      else next.add(applicationId);
      return next;
    });
    toast.success('Candidate shortlist updated');
  };

  const handleScheduleInterview = (applicationId: string) => {
    setScheduledInterviewIds((prev) => {
      const next = new Set(prev);
      next.add(applicationId);
      return next;
    });
    toast.success('Interview reminder added to dashboard');
  };

  const handleReject = async (applicationId: string) => {
    try {
      setRejectingIds((prev) => new Set(prev).add(applicationId));
      await jobStore.updateApplicationStatus(applicationId, 'rejected');
      toast.success('Candidate marked as rejected');
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject candidate';
      toast.error(message);
    } finally {
      setRejectingIds((prev) => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen page-gradient">
        <Navigation variant="recruiter" />
        <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-4">
            <Skeleton className="h-[340px] rounded-2xl" />
            <Skeleton className="h-[340px] rounded-2xl" />
          </div>
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
      </div>
    );
  }

  const openJobs = jobs.filter((job) => (job.status || 'open') === 'open').length;
  const kpiCards = [
    {
      label: 'Total Applicants',
      value: stats.total,
      icon: Users,
      tone: 'text-blue-700 bg-blue-50 border-blue-100',
    },
    {
      label: 'Strong Matches',
      value: stats.shortlisted,
      icon: UserRoundCheck,
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Interviews Scheduled',
      value: stats.interview,
      icon: CalendarClock,
      tone: 'text-amber-700 bg-amber-50 border-amber-100',
    },
    {
      label: 'Open Jobs',
      value: openJobs,
      icon: BriefcaseBusiness,
      tone: 'text-slate-700 bg-slate-50 border-slate-200',
    },
  ];

  const primaryAlerts = [
    {
      title: `${stats.shortlisted} strong candidates need review`,
      body: 'Prioritize final shortlist decisions to avoid losing high-quality applicants.',
      tone: 'border-emerald-200 bg-emerald-50/70',
    },
    {
      title: `${stats.pending} candidates are pending screening`,
      body: 'Screening queue is growing. Consider bulk review for faster response time.',
      tone: 'border-amber-200 bg-amber-50/70',
    },
    {
      title: `${openJobs} open roles active`,
      body: 'Monitor roles with low application flow and refresh job descriptions as needed.',
      tone: 'border-blue-200 bg-blue-50/70',
    },
  ];

  return (
    <div className="min-h-screen page-gradient relative overflow-hidden">
      <Navigation variant="recruiter" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 left-12 w-72 h-72 rounded-full bg-[#72bf98]/20 blur-3xl" />
        <div className="absolute top-40 right-0 w-80 h-80 rounded-full bg-[#2d7f5d]/20 blur-3xl" />
      </div>

      <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6 py-6 relative space-y-4">
        <section className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#073f2f]">Recruiter Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Decision-focused hiring view with clean pipeline monitoring and recruiter AI guidance.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/recruiter/jobs/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f5d43] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#0b4f39] transition"
              >
                <BriefcaseBusiness className="w-4 h-4" />
                Post New Job
              </Link>
              <Link
                href="/recruiter/saved-resumes"
                className="inline-flex items-center gap-2 rounded-xl border border-[#0f5d43]/20 text-[#0f5d43] px-4 py-2.5 text-sm font-medium hover:bg-[#edf7f1] transition"
              >
                <Eye className="w-4 h-4" />
                Saved Resumes
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidate, role, or email"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#0f5d43]/15 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full rounded-xl border border-[#0f5d43]/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              >
                <option value="all">All Job Posts</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedJobId('all');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#0f5d43]/15 hover:bg-[#edf6f1] transition"
            >
              <Filter className="w-4 h-4" />
              Reset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full rounded-xl border border-[#0f5d43]/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              >
                <option value="all">All Stages</option>
                {pipelineColumns.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-gray-500" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="w-full rounded-xl border border-[#0f5d43]/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              >
                <option value="all">All time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="surface-card rounded-2xl p-4 border border-gray-100 hover:-translate-y-0.5 hover:shadow-xl transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{kpi.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${kpi.tone}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-4">
          <div className="surface-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Hiring Funnel / Application Pipeline</h2>
              <span className="text-xs text-gray-500">{filteredApplicants.length} candidates in view</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {pipelineColumns.map((stage) => {
                const count = pipelineBoard[stage].length;
                const tone = stage === 'Hired'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : stage === 'Rejected'
                    ? 'text-red-700 bg-red-50 border-red-200'
                    : stage === 'Interview'
                      ? 'text-blue-700 bg-blue-50 border-blue-200'
                      : stage === 'Screening'
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-gray-700 bg-gray-50 border-gray-200';
                return (
                  <div key={stage} className={`rounded-xl border p-3 ${tone}`}>
                    <p className="text-xs uppercase tracking-wide">{stage}</p>
                    <p className="text-2xl font-bold mt-1">{count}</p>
                  </div>
                );
              })}
            </div>

            <div className="h-72 mt-4 rounded-xl border border-gray-100 bg-white p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hiringFunnelChartData} margin={{ top: 10, right: 18, left: 8, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6b7280" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#6b7280" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" allowDecimals={false} domain={[0, 100]} hide />
                  <RechartsTooltip />
                  <Bar yAxisId="left" dataKey="value" name="Candidates" radius={[8, 8, 0, 0]} fill="#2d8a62" />
                  <Line yAxisId="right" type="monotone" dataKey="conversion" name="Conversion %" stroke="#0f5d43" strokeWidth={2.5} dot={{ r: 3 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#0f5d43]" />
              <h2 className="text-base font-semibold text-gray-900"> Alerts</h2>
            </div>

            <div className="space-y-2">
              {primaryAlerts.map((alert) => (
                <div key={alert.title} className={`rounded-xl border p-3 ${alert.tone}`}>
                  <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{alert.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              {aiInsights.slice(0, 3).map((insight, idx) => (
                <div key={`${insight}-${idx}`} className="rounded-xl border border-[#0f5d43]/10 bg-[#f7fcf9] px-3 py-2.5 text-sm text-gray-700">
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">My Listed Jobs</h2>
              <p className="text-xs text-gray-500 mt-1">Fast access to manage role details and review applications.</p>
            </div>
            <span className="text-xs text-gray-500">{postedJobs.length} total jobs</span>
          </div>

          {quickListedJobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
              <p className="font-medium text-gray-700">No jobs listed yet</p>
              <Link href="/recruiter/jobs/new" className="mt-3 inline-flex items-center gap-1 text-sm text-[#0f5d43] font-medium hover:underline">
                Post your first job
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {quickListedJobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{job.title}</p>
                    <span className={`text-[11px] px-2 py-1 rounded-full border ${job.status === 'closed' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {(job.status || 'open').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{job.company}{job.location ? ` - ${job.location}` : ''}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center">
                      <p className="text-gray-500">Applicants</p>
                      <p className="font-semibold text-gray-900">{job.applications}</p>
                    </div>
                    <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center">
                      <p className="text-gray-500">85+ Score</p>
                      <p className="font-semibold text-gray-900">{job.highScore}</p>
                    </div>
                    <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center">
                      <p className="text-gray-500">Avg Score</p>
                      <p className="font-semibold text-gray-900">{job.averageScore}%</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link href={`/recruiter/jobs/${job.id}/edit`} className="inline-flex items-center justify-center rounded-lg border border-[#0f5d43]/20 text-[#0f5d43] px-3 py-2 text-xs font-medium hover:bg-[#edf7f1] transition">
                      Job Details
                    </Link>
                    <Link href={`/recruiter/jobs/${job.id}/applications`} className="inline-flex items-center justify-center rounded-lg bg-[#0f5d43] text-white px-3 py-2 text-xs font-medium hover:bg-[#0b4f39] transition">
                      Applications
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Applicants</h2>
            <span className="text-xs text-gray-500">Who needs action?</span>
          </div>

          {filteredApplicants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <Search className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="font-medium text-gray-700">No applicants match your current filters</p>
              <p className="text-sm text-gray-500 mt-1">Adjust filters to bring candidates back into view.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2.5 pr-3">Name</th>
                    <th className="py-2.5 pr-3">Applied Role</th>
                    <th className="py-2.5 pr-3">Score</th>
                    <th className="py-2.5 pr-3">Status</th>
                    <th className="py-2.5 pr-3">Resume</th>
                    <th className="py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.slice(0, 20).map((app) => {
                    const stage = stageByAppId.get(app.id) || 'New';
                    const candidateAvatar = applicantAvatarById.get(app.id) || '';
                    const rejecting = rejectingIds.has(app.id);
                    const statusTone = stage === 'Rejected'
                      ? 'text-red-700 bg-red-50 border-red-200'
                      : stage === 'Hired'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : stage === 'Interview'
                          ? 'text-blue-700 bg-blue-50 border-blue-200'
                          : stage === 'Screening'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-gray-700 bg-gray-50 border-gray-200';
                    return (
                      <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50/70 transition">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-[#e6f4ec] text-[#0f5d43] flex items-center justify-center text-xs font-semibold overflow-hidden">
                              {candidateAvatar ? (
                                <img
                                  src={candidateAvatar}
                                  alt={app.name || 'Candidate'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getInitials(app.name)
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{app.name}</p>
                              <p className="text-xs text-gray-500">{app.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-medium text-gray-900">{app.jobTitle}</p>
                          <p className="text-xs text-gray-500">{new Date(app.appliedAt).toLocaleDateString()}</p>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="w-24">
                            <p className="font-semibold text-gray-900">{app.aiScore}%</p>
                            <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#2d8a62] to-[#58b182]"
                                style={{ width: `${Math.min(100, Math.max(0, app.aiScore))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${statusTone}`}>
                            {stage}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <a
                            href={app.resumeUrl || undefined}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition ${
                              app.resumeUrl
                                ? 'border-[#0f5d43]/20 text-[#0f5d43] hover:bg-[#edf7f1]'
                                : 'border-gray-200 text-gray-400 pointer-events-none'
                            }`}
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            View
                          </a>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleShortlist(app.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#0f5d43]/20 text-[#0f5d43] px-2 py-1.5 text-xs hover:bg-[#edf7f1] transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Shortlist
                            </button>
                            <button
                              onClick={() => handleScheduleInterview(app.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 text-blue-700 px-2 py-1.5 text-xs hover:bg-blue-50 transition"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              Interview
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              disabled={rejecting}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 text-red-600 px-2 py-1.5 text-xs hover:bg-red-50 transition disabled:opacity-60"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {rejecting ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <details className="surface-card rounded-2xl p-4 sm:p-5 group">
          <summary className="list-none cursor-pointer flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Advanced Analytics</h2>
              <p className="text-xs text-gray-500 mt-1">Historical trends, source distribution, and department-style performance.</p>
            </div>
            <span className="text-xs text-[#0f5d43] font-medium group-open:hidden">Expand</span>
            <span className="text-xs text-[#0f5d43] font-medium hidden group-open:inline">Collapse</span>
          </summary>

          <div className="mt-4 space-y-4">
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 p-4 bg-white">
                <h3 className="font-semibold text-gray-900 mb-3">Resume screening score distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistributionData}>
                      <XAxis dataKey="range" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="#2d8a62" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 p-4 bg-white">
                <h3 className="font-semibold text-gray-900 mb-3">Applicants by job post</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={applicantsByJobData} layout="vertical">
                      <XAxis type="number" stroke="#6b7280" allowDecimals={false} />
                      <YAxis type="category" dataKey="job" stroke="#6b7280" width={130} />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="#3da072" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 p-4 bg-white">
                <h3 className="font-semibold text-gray-900 mb-3">Monthly applications trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrendData}>
                      <XAxis dataKey="label" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" allowDecimals={false} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="count" stroke="#2d8a62" fill="#bde6d1" strokeWidth={2.4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 p-4 bg-white">
                <h3 className="font-semibold text-gray-900 mb-3">Accepted vs rejected ratio</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={acceptedRejectedData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {acceptedRejectedData.map((entry, idx) => (
                          <Cell key={entry.name} fill={pieColors[idx % pieColors.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-gray-100 p-4 bg-white">
                <h3 className="font-semibold text-gray-900 mb-3">Top job post performance</h3>
                <div className="space-y-2">
                  {topPerformingJobs.length === 0 ? (
                    <div className="text-sm text-gray-500">No performance data yet.</div>
                  ) : (
                    topPerformingJobs.map((job) => (
                      <div key={job.id} className="rounded-lg border border-gray-100 p-3 hover:shadow-sm transition">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm text-gray-900 truncate">{job.title}</p>
                          <span className="text-xs text-[#0f5d43] font-semibold">{job.conversion}% conversion</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-gray-600">
                          <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center"><p>Apps</p><p className="font-semibold text-gray-900">{job.applications}</p></div>
                          <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center"><p>85+ Score</p><p className="font-semibold text-gray-900">{job.highScore}</p></div>
                          <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center"><p>Avg Score</p><p className="font-semibold text-gray-900">{job.averageScore}%</p></div>
                          <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center"><p>Conv.</p><p className="font-semibold text-gray-900">{job.conversion}%</p></div>
                        </div>
                        <Link href={`/recruiter/jobs/${job.id}/applications`} className="mt-1 inline-flex items-center gap-1 text-xs text-[#0f5d43] hover:underline">
                          View job details
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </section>

            <section className="rounded-xl border border-gray-100 p-4 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="font-semibold text-gray-900">Posted Jobs</h3>
                <span className="text-xs text-gray-500">{postedJobs.length} job posts</span>
              </div>

              {postedJobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                  <p className="font-medium text-gray-700">No jobs posted yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {postedJobs.map((job) => (
                    <div key={job.id} className="rounded-xl border border-gray-100 bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{job.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{job.company} {job.location ? `- ${job.location}` : ''}</p>
                        </div>
                        <span className={`text-[11px] px-2 py-1 rounded-full border ${job.status === 'closed' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {(job.status || 'open').toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                        <div className="rounded-lg bg-gray-50 px-2 py-2 text-center"><p className="text-gray-500">Applicants</p><p className="font-semibold text-gray-900">{job.applications}</p></div>
                        <div className="rounded-lg bg-gray-50 px-2 py-2 text-center"><p className="text-gray-500">85+ Score</p><p className="font-semibold text-gray-900">{job.highScore}</p></div>
                        <div className="rounded-lg bg-gray-50 px-2 py-2 text-center"><p className="text-gray-500">Avg Score</p><p className="font-semibold text-gray-900">{job.averageScore}%</p></div>
                      </div>
                      <Link href={`/recruiter/jobs/${job.id}/applications`} className="mt-3 inline-flex items-center justify-center w-full gap-1 rounded-lg border border-[#0f5d43]/20 text-[#0f5d43] px-3 py-2 text-sm font-medium hover:bg-[#edf7f1] transition">
                        Open Job Page
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </details>
      </div>
    </div>
  );
}
