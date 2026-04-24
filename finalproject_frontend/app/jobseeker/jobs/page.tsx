'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Briefcase, Search, Building2, LayoutGrid, List, Tag, ChevronRight } from 'lucide-react';
import { jobStore } from '@/store/jobStore';
import { authStore } from '@/store/authStore';
import { Job } from '@/types/job';
import { PageShell } from '@/components/ui/page-shell';

export default function JobSeekerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Check authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    
    loadJobs();
  }, [router]);

  const loadJobs = async () => {
    try {
      const allJobs = await jobStore.getAllJobs();
      setJobs(allJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
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
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || job.job_type === filterType;
    return matchesSearch && matchesType;
  });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading jobs...</div>
      </div>
    );
  }

  return (
    <PageShell
      variant="jobseeker"
      title="Find Jobs"
      subtitle={`${jobs.length} open positions`}
    >

        {/* Search & Filters Bar */}
        <div className="surface-card p-4 mb-6">
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
              {/* View Toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition ${viewMode === 'list' ? 'bg-[#043927] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition ${viewMode === 'grid' ? 'bg-[#043927] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-500">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 ? (
          <div className="surface-card p-16 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No jobs found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'list' ? (
          /* ========== LIST VIEW ========== */
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => router.push(`/jobseeker/jobs/${job.id}`)}
                className="surface-card surface-card-hover p-5 cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  {/* Company Icon */}
                  <div className="w-12 h-12 rounded-lg bg-[#043927]/5 border border-[#043927]/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-[#043927]" />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#043927] transition">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-0.5">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getJobTypeBadgeColor(job.job_type)}`}>
                          {getJobTypeLabel(job.job_type)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#043927] transition" />
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(job.created_at)}
                      </span>
                    </div>

                    {/* Description */}
                    {job.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>
                    )}

                    {/* Skills Tags */}
                    {job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.skills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
                            <Tag className="w-3 h-3" />
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs">
                            +{job.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ========== GRID VIEW ========== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => router.push(`/jobseeker/jobs/${job.id}`)}
                className="surface-card surface-card-hover cursor-pointer group flex flex-col"
              >
                <div className="p-5 flex-1">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#043927]/5 border border-[#043927]/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-[#043927]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#043927] transition line-clamp-2">
                        {job.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
                    </div>
                  </div>

                  {/* Badge + Meta */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getJobTypeBadgeColor(job.job_type)}`}>
                      {getJobTypeLabel(job.job_type)}
                    </span>
                    <span className="text-xs text-gray-400">&bull;</span>
                    <span className="text-xs text-gray-500">{formatDate(job.created_at)}</span>
                  </div>

                  {/* Location */}
                  {job.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="line-clamp-1">{job.location}</span>
                    </div>
                  )}

                  {/* Description */}
                  {job.description && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">{job.description}</p>
                  )}

                  {/* Skills */}
                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs">
                          +{job.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100">
                  <span className="text-sm text-[#043927] font-medium group-hover:underline">
                    View &amp; Apply &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
    </PageShell>
  );
}
