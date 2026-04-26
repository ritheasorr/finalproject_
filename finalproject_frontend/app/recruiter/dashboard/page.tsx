'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Funnel,
  FunnelChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Eye,
  FileDown,
  Filter,
  Layers3,
  ListFilter,
  Search,
  Sparkles,
  UserRoundCheck,
  UserRoundX,
  Users,
  UserSearch,
  XCircle,
} from 'lucide-react';

import Navigation from '@/components/Navigation';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { API_BASE_URL, apiClient } from '@/lib/api';
import { Job } from '@/types/job';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fallbackInsights,
  generateMockPerformance,
  generateSparkline,
} from './mockDashboardData';

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

interface KpiCard {
  label: string;
  value: number;
  change: number;
  icon: ComponentType<{ className?: string }>;
  sparkline: number[];
  accent: string;
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

function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1 || 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-full h-10">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
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
        jobStore.getAllJobs(),
        apiClient.get<{ applications: BackendReceivedApplication[] }>('/applications/received'),
      ]);

      const mappedApps: DashboardApplicant[] = (receivedResponse.applications || []).map((app) => ({
        id: app._id,
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
    const rejected = filteredApplicants.filter((a) => stageByAppId.get(a.id) === 'Rejected').length;
    const activeJobs = selectedJobId === 'all' ? jobs.length : jobs.filter((j) => j.id === selectedJobId).length;
    const interview = filteredApplicants.filter((a) => stageByAppId.get(a.id) === 'Interview').length;

    const now = new Date();
    const recent = filteredApplicants.filter((a) => {
      const d = new Date(a.appliedAt);
      return now.getTime() - d.getTime() <= 30 * 24 * 60 * 60 * 1000;
    }).length;
    const previous = filteredApplicants.filter((a) => {
      const d = new Date(a.appliedAt);
      const diff = now.getTime() - d.getTime();
      return diff > 30 * 24 * 60 * 60 * 1000 && diff <= 60 * 24 * 60 * 60 * 1000;
    }).length;

    const baseChange = percentChange(recent, previous);
    const kpis: KpiCard[] = [
      { label: 'Total Applicants', value: total, change: baseChange, icon: Users, sparkline: generateSparkline(total + 4), accent: '#206f50' },
      { label: 'Shortlisted Candidates', value: shortlisted, change: baseChange - 6, icon: UserRoundCheck, sparkline: generateSparkline(shortlisted + 11), accent: '#2d8a62' },
      { label: 'Pending Reviews', value: pending, change: baseChange - 12, icon: Clock3, sparkline: generateSparkline(pending + 19), accent: '#5aa37d' },
      { label: 'Rejected Candidates', value: rejected, change: baseChange + 4, icon: UserRoundX, sparkline: generateSparkline(rejected + 27), accent: '#88bca1' },
      { label: 'Active Job Posts', value: activeJobs, change: baseChange + 2, icon: BriefcaseBusiness, sparkline: generateSparkline(activeJobs + 34), accent: '#0f5d43' },
      { label: 'Interview Scheduled', value: interview, change: baseChange + 9, icon: CalendarClock, sparkline: generateSparkline(interview + 43), accent: '#3c9f74' },
    ];

    return {
      kpis,
      total,
      shortlisted,
      pending,
      rejected,
      interview,
    };
  }, [filteredApplicants, jobs, selectedJobId, stageByAppId]);

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

  const jobPerformance = useMemo(() => {
    const appCountByJob = new Map<string, number>();
    filteredApplicants.forEach((app) => {
      appCountByJob.set(app.jobId, (appCountByJob.get(app.jobId) || 0) + 1);
    });

    return jobs.map((job, idx) => {
      const applicationsCount = appCountByJob.get(job.id) || 0;
      const mockPerf = generateMockPerformance(applicationsCount, idx + 3);
      return {
        id: job.id,
        title: job.title,
        applications: applicationsCount,
        views: mockPerf.views,
        conversion: mockPerf.conversionRate,
        trend: mockPerf.trend,
      };
    });
  }, [filteredApplicants, jobs]);

  const topPerformingJobs = useMemo(() => {
    return [...jobPerformance]
      .sort((a, b) => b.conversion - a.conversion || b.applications - a.applications)
      .slice(0, 4);
  }, [jobPerformance]);

  const aiInsights = useMemo(() => {
    const insights: string[] = [];
    const highestApplicantJob = [...applicantsByJobData].sort((a, b) => b.count - a.count)[0];
    if (highestApplicantJob) {
      insights.push(`${highestApplicantJob.job} role has ${highestApplicantJob.count} new applicants in your filtered view.`);
    }

    const highScoreCount = filteredApplicants.filter((a) => a.aiScore >= 85).length;
    insights.push(`${highScoreCount} candidates scored above 85% AI match.`);

    const lowConversion = [...jobPerformance]
      .filter((job) => job.views > 0 && job.conversion < 4)
      .sort((a, b) => a.conversion - b.conversion)[0];
    if (lowConversion) {
      insights.push(`${lowConversion.title} has low conversion (${lowConversion.conversion}%). Consider updating role details.`);
    }

    if (stats.pending > 0) {
      insights.push(`Review ${stats.pending} pending candidates before upcoming interview deadlines.`);
    }

    return insights.length > 0 ? insights : fallbackInsights;
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
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            <Skeleton className="h-[620px]" />
            <div className="space-y-4">
              <Skeleton className="h-36" />
              <div className="grid md:grid-cols-3 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-gradient relative overflow-hidden">
      <Navigation variant="recruiter" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 left-12 w-72 h-72 rounded-full bg-[#72bf98]/20 blur-3xl" />
        <div className="absolute top-40 right-0 w-80 h-80 rounded-full bg-[#2d7f5d]/20 blur-3xl" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="surface-card p-4 h-fit sticky top-20">
            <div className="rounded-xl hero-shell p-4 text-white mb-4">
              <p className="text-xs text-white/80">Recruiter Console</p>
              <h2 className="text-lg font-semibold mt-1">Analytics Center</h2>
            </div>

            <nav className="space-y-1 text-sm">
              {[
                { label: 'Overview', href: '#overview', icon: Layers3 },
                { label: 'Screening Analytics', href: '#analytics', icon: BarChart3 },
                { label: 'Pipeline Board', href: '#pipeline', icon: Activity },
                { label: 'Recent Applicants', href: '#recent', icon: UserSearch },
                { label: 'Job Performance', href: '#performance', icon: BriefcaseBusiness },
                { label: 'AI Insights', href: '#insights', icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 hover:bg-[#eef6f1] hover:text-[#0b5d43] transition"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <div className="mt-5 pt-4 border-t border-[#0f5d43]/10">
              <Link
                href="/recruiter/jobs/new"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#0f5d43] text-white px-4 py-2.5 rounded-lg hover:bg-[#0b4f39] transition"
              >
                <BriefcaseBusiness className="w-4 h-4" />
                Post New Job
              </Link>
            </div>
          </aside>

          <main className="space-y-6">
            <section id="overview" className="space-y-4">
              <div className="surface-card p-4 md:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#073f2f]">Welcome back, Recruiter</h1>
                    <p className="text-sm md:text-base text-gray-600 mt-1">
                      You have {stats.pending} pending screenings, {stats.total} total applicants, and {jobs.length} active job posts.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#0f5d43] bg-[#ecf7f1] border border-[#0f5d43]/15 px-4 py-3 rounded-xl">
                    <CircleDashed className="w-4 h-4" />
                    Live recruiting analytics enabled
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                  <div className="relative md:col-span-3">
                    <Search className="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search candidate name, role, or email..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#0f5d43]/15 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedJobId('all');
                      setStatusFilter('all');
                      setDateFilter('all');
                    }}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#0f5d43]/15 hover:bg-[#edf6f1] transition"
                  >
                    <Filter className="w-4 h-4" />
                    Reset Filters
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-gray-500" />
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full rounded-lg border border-[#0f5d43]/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                    >
                      <option value="all">All job posts</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      className="w-full rounded-lg border border-[#0f5d43]/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                    >
                      <option value="all">All pipeline stages</option>
                      {pipelineColumns.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-gray-500" />
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                      className="w-full rounded-lg border border-[#0f5d43]/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
                    >
                      <option value="all">All time</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {stats.kpis.map((kpi) => {
                  const Icon = kpi.icon;
                  const positive = kpi.change >= 0;
                  return (
                    <div
                      key={kpi.label}
                      className="surface-card p-4 hover:shadow-xl hover:-translate-y-0.5 transition duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">{kpi.label}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.accent}1F` }}>
                          <Icon className="w-5 h-5" style={{ color: kpi.accent }} />
                        </div>
                      </div>
                      <div className={`text-xs font-medium mt-2 ${positive ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {positive ? '+' : ''}
                        {kpi.change}% vs previous period
                      </div>
                      <div className="mt-3">
                        <MiniSparkline data={kpi.sparkline} color={kpi.accent} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section id="analytics" className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="surface-card p-4">
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

              <div className="surface-card p-4">
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

              <div className="surface-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Candidate pipeline funnel</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <RechartsTooltip />
                      <Funnel dataKey="value" data={funnelData} isAnimationActive>
                        {funnelData.map((entry, idx) => (
                          <Cell
                            key={entry.name}
                            fill={`hsl(149, 45%, ${35 + idx * 6}%)`}
                          />
                        ))}
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="surface-card p-4">
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

              <div className="surface-card p-4 xl:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Accepted vs rejected ratio</h3>
                  <span className="text-xs text-gray-500">Based on current filtered applicants</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={acceptedRejectedData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
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

            <section id="pipeline" className="surface-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="font-semibold text-gray-900">Candidate Pipeline Board</h3>
                <span className="text-xs text-gray-500">Kanban-style view by current stage</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                {pipelineColumns.map((column) => (
                  <div key={column} className="rounded-xl border border-[#0f5d43]/10 bg-white/80">
                    <div className="px-3 py-2 border-b border-[#0f5d43]/10 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#0f5d43]">{column}</span>
                      <span className="text-xs text-gray-500">{pipelineBoard[column].length}</span>
                    </div>
                    <div className="p-2 space-y-2 max-h-[260px] overflow-auto">
                      {pipelineBoard[column].length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-400">
                          No candidates
                        </div>
                      ) : (
                        pipelineBoard[column].map((candidate) => (
                          <div key={candidate.id} className="rounded-lg border border-[#0f5d43]/12 p-2 bg-white hover:shadow-sm transition">
                            <div className="text-xs font-semibold text-gray-800 truncate">{candidate.name}</div>
                            <div className="text-[11px] text-gray-500 truncate">{candidate.jobTitle}</div>
                            <div className="mt-1 text-[11px] text-[#0f5d43] font-medium">
                              AI: {candidate.aiScore}%
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="recent" className="surface-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="font-semibold text-gray-900">Recent Applicants</h3>
                <span className="text-xs text-gray-500">{filteredApplicants.length} results</span>
              </div>

              {filteredApplicants.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#0f5d43]/20 p-8 text-center">
                  <Search className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="font-medium text-gray-700">No applicants match your current filters</p>
                  <p className="text-sm text-gray-500 mt-1">Adjust search, job post, stage, or date range.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredApplicants.slice(0, 12).map((app) => {
                    const stage = stageByAppId.get(app.id) || 'New';
                    const rejecting = rejectingIds.has(app.id);
                    return (
                      <div
                        key={app.id}
                        className="rounded-xl border border-[#0f5d43]/12 bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#e6f4ec] text-[#0f5d43] flex items-center justify-center text-sm font-semibold">
                              {getInitials(app.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{app.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[180px]">{app.jobTitle}</p>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-[#eaf7f0] text-[#0f5d43] border border-[#0f5d43]/20">
                            {stage}
                          </span>
                        </div>

                        <div className="mt-3 text-xs text-gray-600 space-y-1">
                          <div>{app.email}</div>
                          <div>Applied {new Date(app.appliedAt).toLocaleDateString()}</div>
                        </div>

                        <div className="mt-3 rounded-lg bg-[#f2faf6] border border-[#0f5d43]/10 px-3 py-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">AI match score</span>
                            <span className="font-semibold text-[#0f5d43]">{app.aiScore}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-[#d6eee2] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#2d8a62] to-[#58b182]"
                              style={{ width: `${Math.min(100, Math.max(0, app.aiScore))}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <a
                            href={app.resumeUrl || undefined}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs border transition ${
                              app.resumeUrl
                                ? 'border-[#0f5d43]/20 text-[#0f5d43] hover:bg-[#edf7f1]'
                                : 'border-gray-200 text-gray-400 pointer-events-none'
                            }`}
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            View CV
                          </a>
                          <button
                            onClick={() => handleToggleShortlist(app.id)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs border border-[#0f5d43]/20 text-[#0f5d43] hover:bg-[#edf7f1] transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={rejecting}
                            className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-60"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {rejecting ? 'Rejecting...' : 'Reject'}
                          </button>
                          <button
                            onClick={() => handleScheduleInterview(app.id)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs border border-[#0f5d43]/20 text-[#0f5d43] hover:bg-[#edf7f1] transition"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                            Schedule
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section id="performance" className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="surface-card p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Top job post performance</h3>
                <div className="space-y-3">
                  {topPerformingJobs.length === 0 ? (
                    <div className="text-sm text-gray-500">No job performance data yet.</div>
                  ) : (
                    topPerformingJobs.map((job) => (
                      <div key={job.id} className="rounded-xl border border-[#0f5d43]/12 p-3 bg-white">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm text-gray-900 truncate">{job.title}</p>
                          <span className="text-xs text-[#0f5d43] font-semibold">{job.conversion}% conversion</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-600">
                          <div className="rounded-lg bg-[#f3faf6] px-2 py-1.5 text-center">
                            <p className="text-gray-500">Views</p>
                            <p className="font-semibold text-gray-900">{job.views}</p>
                          </div>
                          <div className="rounded-lg bg-[#f3faf6] px-2 py-1.5 text-center">
                            <p className="text-gray-500">Applications</p>
                            <p className="font-semibold text-gray-900">{job.applications}</p>
                          </div>
                          <div className="rounded-lg bg-[#f3faf6] px-2 py-1.5 text-center">
                            <p className="text-gray-500">Conversion</p>
                            <p className="font-semibold text-gray-900">{job.conversion}%</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <MiniSparkline data={job.trend} color="#2d8a62" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="surface-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Applications vs views trend</h3>
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={topPerformingJobs}>
                      <XAxis dataKey="title" hide />
                      <YAxis yAxisId="left" stroke="#6b7280" />
                      <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                      <RechartsTooltip />
                      <Line yAxisId="left" type="monotone" dataKey="views" stroke="#88bca1" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="applications" stroke="#2d8a62" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section id="insights" className="surface-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#0f5d43]" />
                <h3 className="font-semibold text-gray-900">AI Insights Panel</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {aiInsights.map((insight, idx) => (
                  <div
                    key={`${insight}-${idx}`}
                    className="rounded-xl border border-[#0f5d43]/12 bg-gradient-to-r from-[#eef8f3] to-[#f8fcfa] px-4 py-3 text-sm text-gray-700"
                  >
                    {insight}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-[#0f5d43]/15 bg-[#f7fcf9] p-3 text-sm text-gray-600 flex items-center justify-between">
                <span>Need deeper review of applications and folders?</span>
                <Link
                  href="/recruiter/saved-resumes"
                  className="inline-flex items-center gap-1 text-[#0f5d43] font-medium hover:underline"
                >
                  <Eye className="w-4 h-4" />
                  Open Saved Resumes
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
