'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  GraduationCap,
  MapPin,
  Save,
  Sparkles,
  Users,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import { Skeleton } from '@/components/ui/skeleton';
import { authStore } from '@/store/authStore';
import { applicationStore } from '@/store/applicationStore';
import { Application } from '@/types/job';

const defaultCover =
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1800&q=80';

export default function JobSeekerProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    location: '',
    education: '',
    experience: '',
    professionalTitle: '',
    skills: '',
    bio: '',
    coverImage: defaultCover,
    avatarImage: '',
    linkedinUrl: '',
  });

  const loadProfile = async () => {
    const user = authStore.getCurrentUser();
    if (!user || user.role !== 'jobseeker') {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const profile = authStore.getJobSeekerProfile(user.id);
      const apps = await applicationStore.getApplicationsByUserId(user.id);
      setApplications(apps);

      setFormData({
        fullName: profile?.full_name || user.full_name || '',
        location: profile?.location || '',
        education: profile?.education || '',
        experience: profile?.experience || '',
        professionalTitle: profile?.professional_title || 'Aspiring Professional',
        skills: profile?.skills || '',
        bio:
          profile?.bio ||
          'Motivated candidate focused on building practical skills and contributing to high-impact teams.',
        coverImage: profile?.cover_image_url || defaultCover,
        avatarImage: profile?.avatar_url || '',
        linkedinUrl: profile?.linkedin_url || '',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    void loadProfile();
  }, [router]);

  const skillsList = useMemo(
    () =>
      formData.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    [formData.skills]
  );

  const profileCompleteness = useMemo(() => {
    const checks = [
      !!formData.fullName,
      !!formData.location,
      !!formData.professionalTitle,
      !!formData.education,
      !!formData.skills,
      !!formData.bio,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [formData]);

  const stats = useMemo(() => {
    const pending = applications.filter((app) => app.status === 'pending').length;
    const accepted = applications.filter((app) => app.status === 'accepted').length;
    return [
      { label: 'Profile Completeness', value: `${profileCompleteness}%`, icon: Sparkles },
      { label: 'Applications Sent', value: applications.length, icon: BriefcaseBusiness },
      { label: 'In Review', value: pending, icon: Users },
      { label: 'Accepted', value: accepted, icon: CheckCircle2 },
    ];
  }, [applications, profileCompleteness]);

  const handleSave = async (e: React.FormEvent) => {
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
      });

      authStore.updateJobSeekerProfile(user.id, {
        full_name: formData.fullName,
        location: formData.location,
        education: formData.education,
        skills: formData.skills,
        professional_title: formData.professionalTitle,
        experience: formData.experience,
        bio: formData.bio,
        cover_image_url: formData.coverImage,
        avatar_url: formData.avatarImage,
        linkedin_url: formData.linkedinUrl,
      });

      toast.success('Profile updated successfully');
      await loadProfile();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen page-gradient">
        <Navigation variant="jobseeker" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-72 mb-4" />
          <Skeleton className="h-24 mb-4" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-gradient">
      <Navigation variant="jobseeker" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <Link
          href="/jobseeker/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#0f5d43] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <ProfileHeader
          coverImage={formData.coverImage || defaultCover}
          avatarImage={formData.avatarImage}
          name={formData.fullName}
          roleLabel={formData.professionalTitle}
          company=""
          location={formData.location}
          linkedinUrl={formData.linkedinUrl}
          readOnly={false}
          actionLabel="Find Jobs"
          actionHref="/jobseeker/jobs"
          secondaryActionLabel="View Dashboard"
          secondaryActionHref="/jobseeker/dashboard"
        />

        <ProfileStats stats={stats} />

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5">
          <div className="space-y-5">
            <ProfileAbout title="About Candidate" about={formData.bio} />

            <div className="surface-card p-5 md:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
              {skillsList.length === 0 ? (
                <p className="text-sm text-gray-500">No skills added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-full bg-[#edf7f1] border border-[#0f5d43]/15 text-[#0f5d43] text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="surface-card p-5 md:p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Education</h2>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {formData.education || 'No education details provided yet.'}
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Experience</h2>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {formData.experience || 'No experience details provided yet.'}
                </p>
              </div>
            </div>

            <div className="surface-card p-5 md:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Application History Summary</h2>
              <p className="text-sm text-gray-600">
                You have submitted {applications.length} application{applications.length !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>

          <div className="surface-card p-5 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <input
                value={formData.fullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Full name"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <input
                value={formData.professionalTitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, professionalTitle: e.target.value }))}
                placeholder="Professional title"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <input
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Location"
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20"
              />
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="About / bio"
                rows={4}
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 resize-none"
              />
              <textarea
                value={formData.skills}
                onChange={(e) => setFormData((prev) => ({ ...prev, skills: e.target.value }))}
                placeholder="Skills, comma separated"
                rows={3}
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 resize-none"
              />
              <textarea
                value={formData.education}
                onChange={(e) => setFormData((prev) => ({ ...prev, education: e.target.value }))}
                placeholder="Education"
                rows={3}
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 resize-none"
              />
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData((prev) => ({ ...prev, experience: e.target.value }))}
                placeholder="Experience"
                rows={3}
                className="w-full rounded-lg border border-[#0f5d43]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5d43]/20 resize-none"
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

              <button
                type="submit"
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f5d43] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#0b4d38] transition disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>

            <div className="mt-4 rounded-lg border border-[#0f5d43]/15 bg-[#f6fbf8] p-3 text-xs text-gray-600">
              <p className="font-medium text-[#0f5d43] mb-1">Profile Completeness</p>
              <div className="h-2 rounded-full bg-[#dcefe4] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2f8e66] to-[#58b182]"
                  style={{ width: `${profileCompleteness}%` }}
                />
              </div>
              <p className="mt-1">{profileCompleteness}% complete</p>
            </div>

            <div className="mt-4 rounded-lg border border-[#0f5d43]/15 bg-[#f6fbf8] p-3 text-xs text-gray-600">
              <p className="font-medium text-[#0f5d43] mb-2">Resume / CV</p>
              {authStore.getResumesByUserId(authStore.getCurrentUser()?.id || '').length > 0 ? (
                <p className="inline-flex items-center gap-1 text-[#0f5d43]">
                  <FileText className="w-3.5 h-3.5" />
                  Resume uploaded
                </p>
              ) : (
                <p>No resume uploaded yet. Add one from your dashboard.</p>
              )}
            </div>
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-[#0f5d43]/10 p-3">
              <p className="font-medium text-gray-900 inline-flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#0f5d43]" />
                Education visibility
              </p>
              <p className="text-gray-600 mt-1">Recruiters can better match you when education is complete.</p>
            </div>
            <div className="rounded-lg border border-[#0f5d43]/10 p-3">
              <p className="font-medium text-gray-900 inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#0f5d43]" />
                Location preferences
              </p>
              <p className="text-gray-600 mt-1">Keep your location updated for better job discovery.</p>
            </div>
            <div className="rounded-lg border border-[#0f5d43]/10 p-3">
              <p className="font-medium text-gray-900 inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0f5d43]" />
                Skills relevance
              </p>
              <p className="text-gray-600 mt-1">Align your skills with the jobs you are applying to.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
