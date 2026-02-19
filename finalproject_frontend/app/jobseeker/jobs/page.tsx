'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, DollarSign, Clock, Briefcase, Search } from 'lucide-react';
import { jobStore } from '@/store/jobStore';
import { Job } from '@/types/job';

export default function JobSeekerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadJobs();
  }, []);

  const loadJobs = () => {
    const allJobs = jobStore.getAllJobs();
    setJobs(allJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
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
      case 'FULLTIME': return 'bg-green-100 text-green-800';
      case 'PARTTIME': return 'bg-blue-100 text-blue-800';
      case 'INTERNSHIP': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || job.job_type === filterType;
    return matchesSearch && matchesType;
  });

  if (!mounted) {
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
            <Link href="/jobseeker" className="text-2xl font-bold text-[#043927]">
              CareerLaunch
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/jobseeker/dashboard" className="text-gray-700 hover:text-[#043927] transition">
                Dashboard
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-[#043927] transition">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#043927] mb-2">Browse Job Opportunities</h1>
          <p className="text-gray-600">Find your perfect role from {jobs.length} available positions</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
            >
              <option value="ALL">All Types</option>
              <option value="FULLTIME">Full-Time</option>
              <option value="PARTTIME">Part-Time</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
          </p>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <h3 className="text-xl font-bold text-[#043927]">{job.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getJobTypeBadgeColor(job.job_type)}`}>
                        {getJobTypeLabel(job.job_type)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Posted {formatDate(job.created_at)}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{job.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Requirements:</h4>
                      <p className="text-gray-600 text-sm">{job.requirements}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => router.push(`/jobseeker/jobs/${job.id}/apply`)}
                    className="flex-1 bg-[#043927] text-white px-6 py-3 rounded-lg hover:bg-[#065a3a] transition font-medium"
                  >
                    Apply Now
                  </button>
                  <button 
                    onClick={() => alert('Save feature coming soon!')}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
