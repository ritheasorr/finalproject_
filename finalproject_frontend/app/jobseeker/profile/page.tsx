'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { User, JobSeekerProfile } from '@/types/user';

export default function JobSeekerProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    education: '',
    skills: '',
    location: '',
  });

  useEffect(() => {
    setMounted(true);
    const currentUser = authStore.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'jobseeker') {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    
    const profile = authStore.getJobSeekerProfile(currentUser.id);
    if (profile) {
      setFormData({
        full_name: profile.full_name || currentUser.full_name,
        education: profile.education || '',
        skills: profile.skills || '',
        location: profile.location || '',
      });
    } else {
      setFormData({
        full_name: currentUser.full_name,
        education: '',
        skills: '',
        location: '',
      });
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSuccessMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSaving(true);
    
    // Update profile
    authStore.updateJobSeekerProfile(user.id, formData);
    
    // Show success message
    setSuccessMessage('Profile updated successfully! ✅');
    setIsSaving(false);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  if (!mounted || !user) {
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
              <Link 
                href="/jobseeker/dashboard" 
                className="text-gray-700 hover:text-[#043927] transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#043927] mb-2">Edit Profile</h1>
          <p className="text-gray-600">Update your information to help employers find you</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-[#043927]/10 w-16 h-16 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-[#043927]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#043927]">{user.full_name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* Full Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
              required
            />
          </div>

          {/* Education */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Education
            </label>
            <textarea
              name="education"
              value={formData.education}
              onChange={handleChange}
              placeholder="e.g., Computer Science - State University, Expected 2026"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              Include your degree, major, university, and graduation year
            </p>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Skills
            </label>
            <textarea
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., React, JavaScript, TypeScript, Python, SQL"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927] resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              List your technical and soft skills, separated by commas
            </p>
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., San Francisco, CA"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-[#043927] text-white px-6 py-3 rounded-lg hover:bg-[#065a3a] transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/jobseeker/dashboard"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Profile Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Complete profiles get 3x more views from recruiters</li>
            <li>• List specific skills that match job requirements</li>
            <li>• Keep your education and experience up to date</li>
            <li>• Be specific about your location preferences</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
