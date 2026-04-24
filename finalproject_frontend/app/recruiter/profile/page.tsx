'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { authStore } from '@/store/authStore';
import { User } from '@/types/user';
import { PageShell } from '@/components/ui/page-shell';

export default function RecruiterProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    company: '',
    phone: '',
    location: '',
  });

  useEffect(() => {
    setMounted(true);
    const currentUser = authStore.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'recruiter') {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    setFormData({
      full_name: currentUser.full_name || '',
      company: '',
      phone: '',
      location: '',
    });
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // Split full name into first and last name
      const nameParts = formData.full_name.trim().split(' ').filter(Boolean);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Update user name in MongoDB via API
      await authStore.updateUserProfile({
        firstName,
        lastName,
      });
      
      // Show success message
      setSuccessMessage('Profile updated successfully! ✅');
      
      // Refresh the page to show updated name in navigation
      window.location.reload();
    } catch (err: any) {
      setSuccessMessage('Error: ' + (err.message || 'Failed to update profile'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <PageShell
      variant="recruiter"
      title="Recruiter Profile"
      subtitle="Keep your recruiter identity and employer presence up to date"
      actions={
        <Link
          href="/recruiter/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#043927] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      }
    >

        {/* Profile Card */}
        <div className="surface-card p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#043927] text-white w-16 h-16 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#043927]">Recruiter Profile</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          {successMessage && (
            <div className={`mb-6 px-4 py-3 rounded-lg ${
              successMessage.includes('Error') 
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
                required
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter your company name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
              />
              <p className="text-sm text-gray-500 mt-1">
                This will appear on your job postings
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., +1 (555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
              />
            </div>

            {/* Location */}
            <div>
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

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-[#043927] text-white px-6 py-3 rounded-lg hover:bg-[#065a3a] transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/recruiter/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 surface-card p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Keep your profile up to date to help candidates learn more about your company and improve your employer brand.
          </p>
        </div>
    </PageShell>
  );
}
