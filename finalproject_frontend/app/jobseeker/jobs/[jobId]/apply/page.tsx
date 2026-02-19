'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Briefcase } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { jobStore } from '@/store/jobStore';
import { applicationStore } from '@/store/applicationStore';

export default function JobApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  
  const [user, setUser] = useState(authStore.getCurrentUser());
  const [job, setJob] = useState(jobStore.getJobById(jobId));
  const [profile, setProfile] = useState(user ? authStore.getJobSeekerProfile(user.id) : null);
  const [resumes, setResumes] = useState(user ? authStore.getResumesByUserId(user.id) : []);
  const [mounted, setMounted] = useState(false);
  
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = authStore.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'jobseeker') {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    setProfile(authStore.getJobSeekerProfile(currentUser.id));
    setResumes(authStore.getResumesByUserId(currentUser.id));
    
    const jobData = jobStore.getJobById(jobId);
    if (!jobData) {
      router.push('/jobseeker/jobs');
      return;
    }
    setJob(jobData);
    
    // Check if already applied
    if (applicationStore.hasApplied(currentUser.id, jobId)) {
      setError('You have already applied to this job');
    }
  }, [router, jobId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user || !profile || !job) return;
    
    if (!selectedResumeId && resumes.length > 0) {
      setError('Please select a resume');
      return;
    }
    
    if (!coverLetter.trim()) {
      setError('Please write a cover letter');
      return;
    }
    
    if (applicationStore.hasApplied(user.id, jobId)) {
      setError('You have already applied to this job');
      return;
    }

    setIsSubmitting(true);
    
    // Create application
    const resumeToUse = selectedResumeId || 'no-resume';
    applicationStore.createApplication(
      jobId,
      user.id,
      profile.full_name,
      user.email,
      resumeToUse,
      coverLetter
    );
    
    // Redirect to success or applications page
    alert('Application submitted successfully! 🎉');
    router.push('/jobseeker/dashboard');
  };

  if (!mounted || !user || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const hasApplied = applicationStore.hasApplied(user.id, jobId);

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
              <Link href="/jobseeker/jobs" className="text-gray-700 hover:text-[#043927] transition flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-[#043927] mb-2">{job.title}</h1>
          <p className="text-gray-600 mb-4">{job.location} · {job.salary}</p>
          <p className="text-gray-700">{job.description}</p>
        </div>

        {hasApplied ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <Briefcase className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Applied</h2>
            <p className="text-gray-600 mb-6">
              You have already submitted an application for this position.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/jobseeker/dashboard"
                className="bg-[#043927] text-white px-6 py-3 rounded-lg hover:bg-[#065a3a] transition"
              >
                View Dashboard
              </Link>
              <Link
                href="/jobseeker/jobs"
                className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition"
              >
                Browse More Jobs
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-[#043927] mb-6">Submit Application</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Resume Selection */}
            {resumes.length > 0 ? (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Select Resume *
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
                  required
                >
                  <option value="">Choose a resume...</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.fileName}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <Upload className="w-4 h-4 inline mr-2" />
                  No resumes found. You can still apply with a cover letter.
                </p>
                <p className="text-xs text-blue-600">
                  Tip: Upload a resume from your dashboard to improve your chances!
                </p>
              </div>
            )}

            {/* Cover Letter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Cover Letter *
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell us why you're a great fit for this position..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] resize-none"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                {coverLetter.length} characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#043927] text-white px-6 py-3 rounded-lg hover:bg-[#065a3a] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <Link
                href="/jobseeker/jobs"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
