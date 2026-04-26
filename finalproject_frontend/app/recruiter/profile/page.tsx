'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  MapPin,
  Save,
  Users,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileJobList from '@/components/profile/ProfileJobList';
import ProfileStats from '@/components/profile/ProfileStats';
import { Skeleton } from '@/components/ui/skeleton';
import { authStore } from '@/store/authStore';
import { jobStore, RecruiterPublicProfile } from '@/store/jobStore';
import { Job } from '@/types/job';

const defaultCover =
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1800&q=80';

export default function RecruiterProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<RecruiterPublicProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    location: '',
    title: 'Lead Recruiter',
    about: '',
    coverImage: defaultCover,
    avatarImage: '',
    websiteUrl: '',
    linkedinUrl: '',
    phoneNumber: '',
  });

  const loadData = async () => {
    const user = authStore.getCurrentUser();
    if (!user || user.role !== 'recruiter') {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const [publicProfile, recruiterJobs] = await Promise.all([
        jobStore.getRecruiterPublicProfile(user.id),
        jobStore.getJobsByRecruiterId(user.id),
      ]);

      const localMeta = authStore.getRecruiterProfileMeta(user.id);

      if (publicProfile) {
        setProfile(publicProfile);
        setFormData({
          fullName: publicProfile.fullName || user.full_name,
          company: localMeta?.company || publicProfile.company || '',
          location: localMeta?.location || publicProfile.location || '',
          title: localMeta?.title || 'Lead Recruiter',
          about:
            localMeta?.about ||
            'I help connect high-potential candidates with roles where they can grow and create impact.',
          coverImage: localMeta?.cover_image_url || defaultCover,
          avatarImage: localMeta?.avatar_url || '',
          websiteUrl: localMeta?.website_url || '',
          linkedinUrl: localMeta?.linkedin_url || '',
          phoneNumber: publicProfile.phoneNumber || '',
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          fullName: user.full_name,
        }));
      }

      setJobs(recruiterJobs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    void loadData();
  }, [router]);

  const stats = useMemo(() => {
    const averageApplicants =
      jobs.length > 0 ? Math.round((profile?.totalApplicants || 0) / jobs.length) : 0;
    return [
      { label: 'Active Jobs', value: profile?.totalActiveJobs || jobs.length, icon: BriefcaseBusiness },
      { label: 'Total Applicants', value: profile?.totalApplicants || 0, icon: Users },
      { label: 'Avg Applicants / Role', value: averageApplicants, icon: BarChart3 },
      { label: 'Primary Location', value: formData.location || 'N/A', icon: MapPin },
    ];
  }, [jobs, profile, formData.location]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = authStore.getCurrentUser();
    if (!user) return;

    try {
      setIsSaving(true);
      const [firstName, ...rest] = formData.fullName.trim().split(' ').filter(Boolean);
      const lastName = rest.join(' ');
      await authStore.updateUserProfile({
        firstName: firstName || '',
        lastName: lastName || '',
        phoneNumber: formData.phoneNumber || '',
      });

      authStore.updateRecruiterProfileMeta(user.id, {
        company: formData.company,
        location: formData.location,
        title: formData.title,
        about: formData.about,
        cover_image_url: formData.coverImage,
        avatar_url: formData.avatarImage,
        website_url: formData.websiteUrl,
        linkedin_url: formData.linkedinUrl,
      });

      toast.success('Recruiter profile updated');
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen page-gradient">
        <Navigation variant="recruiter" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-72 mb-4" />
          <Skeleton className="h-28 mb-4" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-gradient">
      <Navigation variant="recruiter" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href="/recruiter/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#0f5d43] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <ProfileHeader
          coverImage={formData.coverImage || defaultCover}
          avatarImage={formData.avatarImage}
          name={formData.fullName}
          roleLabel={formData.title || 'Recruiter'}
          company={formData.company || profile?.company}
          location={formData.location || profile?.location}
          email={profile?.email}
          websiteUrl={formData.websiteUrl}
          linkedinUrl={formData.linkedinUrl}
          actionLabel="View Public Profile"
          actionHref={`/recruiters/${profile?.id || authStore.getCurrentUser()?.id}`}
          secondaryActionLabel="Post New Job"
          secondaryActionHref="/recruiter/jobs/new"
        />

        <ProfileStats stats={stats} />

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5">
          <div className="space-y-5">
            <ProfileAbout title="About Recruiter / Company" about={formData.about} />
            <ProfileJobList
              jobs={jobs}
              title="Available Job Openings"
              emptyTitle="No active jobs published"
              emptyDescription="Create a new job posting to appear on your public profile."
              ctaLabel="View Details"
            />
          </div>

          <div className="surface-card p-5 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile Details</h2>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <input
                value={formData.fullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Full name"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <input
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Professional title"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <input
                value={formData.company}
                onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                placeholder="Company name"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <input
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Location"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <input
                value={formData.phoneNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="Phone number"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <input
                value={formData.websiteUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder="Website URL"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <input
                value={formData.linkedinUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                placeholder="LinkedIn URL"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <input
                value={formData.coverImage}
                onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
                placeholder="Cover image URL"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <input
                value={formData.avatarImage}
                onChange={(e) => setFormData((prev) => ({ ...prev, avatarImage: e.target.value }))}
                placeholder="Avatar image URL"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <textarea
                value={formData.about}
                onChange={(e) => setFormData((prev) => ({ ...prev, about: e.target.value }))}
                placeholder="About recruiter/company"
                rows={5}
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 resize-none"
              />

              <button
                type="submit"
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f5d43] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#0b4d38] transition disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
