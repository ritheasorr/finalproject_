'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Clock,
  Briefcase,
  Search,
  Building2,
  LayoutGrid,
  List,
  Tag,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { jobStore } from '@/store/jobStore';
import { Job } from '@/types/job';
import { PageShell } from '@/components/ui/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import JobImage from '@/components/jobs/JobImage';

type SortMode = 'newest' | 'oldest' | 'title';

export default function JobSeekerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    void loadJobs();
  }, [router]);

  const loadJobs = async () => {
    try {
      const allJobs = await jobStore.getAllJobs();
      setJobs(allJobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'FULLTIME':
        return 'Full-Time';
      case 'PARTTIME':
        return 'Part-Time';
      case 'INTERNSHIP':
        return 'Internship';
      default:
        return type;
    }
  };

  const getJobTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'FULLTIME':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'PARTTIME':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'INTERNSHIP':
        return 'bg-violet-50 text-violet-700 border border-violet-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    if (status === 'closed') return 'bg-red-50 text-red-700 border border-red-200';
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  const filteredJobs = useMemo(() => {
    const bySearchAndFilter = jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || job.job_type === filterType;
      return matchesSearch && matchesType;
    });

    return [...bySearchAndFilter].sort((a, b) => {
      if (sortMode === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortMode === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [jobs, searchTerm, filterType, sortMode]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('ALL');
    setSortMode('newest');
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-6xl px-4">
          <Skeleton className="h-14 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageShell variant="jobseeker" title="Find Jobs" subtitle={`${jobs.length} open positions`}>
      <div className="surface-card p-4 mb-6 fade-in">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#043927]/20 focus:border-[#043927]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#043927]/20 focus:border-[#043927] bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="FULLTIME">Full-Time</option>
              <option value="PARTTIME">Part-Time</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#043927]/20 focus:border-[#043927] bg-white"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">A-Z Title</option>
              </select>
            </div>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 transition ${
                      viewMode === 'list' ? 'bg-[#043927] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>List view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 transition ${
                      viewMode === 'grid' ? 'bg-[#043927] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Grid view</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-500 flex items-center justify-between">
        <span>
          Showing {filteredJobs.length} of {jobs.length} jobs
        </span>
        {(searchTerm || filterType !== 'ALL' || sortMode !== 'newest') && (
          <button onClick={clearFilters} className="text-[#043927] font-medium hover:underline">
            Reset filters
          </button>
        )}
      </div>

      {filteredJobs.length === 0 ? (
        <div className="surface-card p-16 text-center fade-in">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No jobs found</h3>
          <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters</p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#043927] text-white text-sm font-medium hover:bg-[#065a3a] transition"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => router.push(`/jobseeker/jobs/${job.id}`)}
              className="surface-card surface-card-hover surface-card-press cursor-pointer group fade-in-up overflow-hidden"
            >
              <JobImage
                imageUrl={job.image_url}
                alt={job.title}
                heightClassName="h-44"
                className="rounded-t-2xl"
              />
              <div className="p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#043927]/5 border border-[#043927]/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-[#043927]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#043927] transition">{job.title}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">{job.company}</p>
                      {job.recruiter_name && (
                        <p className="text-xs text-gray-500 mt-0.5">Recruiter: {job.recruiter_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getJobTypeBadgeColor(job.job_type)}`}>
                        {getJobTypeLabel(job.job_type)}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(job.status)}`}>
                        {job.status === 'closed' ? 'Closed' : 'Open'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#043927] transition" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </span>
                    )}
                    {job.salary && <span>{job.salary}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(job.created_at)}
                    </span>
                  </div>

                  {job.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>}

                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skills.slice(0, 5).map((skill, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
                          <Tag className="w-3 h-3" />
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 5 && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs">+{job.skills.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => router.push(`/jobseeker/jobs/${job.id}`)}
              className="surface-card surface-card-hover surface-card-press cursor-pointer group flex flex-col fade-in-up overflow-hidden"
            >
              <JobImage
                imageUrl={job.image_url}
                alt={job.title}
                heightClassName="h-40"
                className="rounded-t-2xl"
              />
              <div className="p-5 flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#043927]/5 border border-[#043927]/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-[#043927]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#043927] transition line-clamp-2">{job.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
                    {job.recruiter_name && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">Recruiter: {job.recruiter_name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getJobTypeBadgeColor(job.job_type)}`}>
                    {getJobTypeLabel(job.job_type)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(job.status)}`}>
                    {job.status === 'closed' ? 'Closed' : 'Open'}
                  </span>
                  <span className="text-xs text-gray-400">&bull;</span>
                  <span className="text-xs text-gray-500">{formatDate(job.created_at)}</span>
                </div>

                {job.location && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="line-clamp-1">{job.location}</span>
                  </div>
                )}

                {job.salary && <p className="text-sm text-gray-600 mb-3">{job.salary}</p>}

                {job.description && <p className="text-sm text-gray-600 line-clamp-3 mb-3">{job.description}</p>}

                {job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs">+{job.skills.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-gray-100">
                <span className="text-sm text-[#043927] font-medium group-hover:underline">View &amp; Apply &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
