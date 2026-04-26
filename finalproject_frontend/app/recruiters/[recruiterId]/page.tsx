'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, BriefcaseBusiness, Building2, MapPin, Users } from 'lucide-react';
import Navigation from '@/components/Navigation';
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileJobList from '@/components/profile/ProfileJobList';
import ProfileStats from '@/components/profile/ProfileStats';
import { Skeleton } from '@/components/ui/skeleton';
import { authStore } from '@/store/authStore';
import { jobStore, RecruiterPublicProfile } from '@/store/jobStore';
import { Job } from '@/types/job';

const fallbackCover =
  'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1800&q=80';

export default function PublicRecruiterProfilePage() {
  const params = useParams();
  const router = useRouter();
  const recruiterId = params?.recruiterId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<RecruiterPublicProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [aboutText, setAboutText] = useState('');
  const [coverImage, setCoverImage] = useState(fallbackCover);
  const [avatarImage, setAvatarImage] = useState('');

  useEffect(() => {
    const user = authStore.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [recruiterProfile, recruiterJobs] = await Promise.all([
          jobStore.getRecruiterPublicProfile(recruiterId),
          jobStore.getJobsByRecruiterId(recruiterId),
        ]);

        if (!recruiterProfile) {
          setError('Recruiter profile not found.');
          setLoading(false);
          return;
        }

        const localMeta = authStore.getRecruiterProfileMeta(recruiterId);
        setProfile(recruiterProfile);
        setJobs(recruiterJobs.filter((job) => !!job.id));
        setAboutText(
          localMeta?.about ||
            `${recruiterProfile.fullName} helps teams hire top talent across active roles at ${recruiterProfile.company}.`
        );
        setCoverImage(localMeta?.cover_image_url || fallbackCover);
        setAvatarImage(localMeta?.avatar_url || '');
      } catch {
        setError('Failed to load recruiter profile.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [recruiterId, router]);

  const stats = useMemo(() => {
    if (!profile) return [];
    const avgApplicants = profile.totalActiveJobs > 0
      ? Math.round(profile.totalApplicants / profile.totalActiveJobs)
      : 0;
    return [
      { label: 'Active Jobs', value: profile.totalActiveJobs, icon: BriefcaseBusiness },
      { label: 'Total Applicants', value: profile.totalApplicants, icon: Users },
      { label: 'Company', value: profile.company, icon: Building2 },
      { label: 'Location', value: profile.location || 'N/A', icon: MapPin },
      { label: 'Avg Applicants / Job', value: avgApplicants, icon: Users },
    ];
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen page-gradient">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-72 mb-4" />
          <Skeleton className="h-20 mb-4" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen page-gradient">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="surface-card p-10 text-center">
            <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
            <h1 className="text-xl font-semibold text-gray-900">Recruiter profile unavailable</h1>
            <p className="text-gray-500 mt-1">{error || 'The requested profile could not be loaded.'}</p>
            <Link
              href="/jobseeker/jobs"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f5d43] text-white px-4 py-2.5 mt-5 text-sm font-medium hover:bg-[#0b4d38] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-gradient">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <Link
          href="/jobseeker/jobs"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#0f5d43] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Job Search
        </Link>

        <ProfileHeader
          coverImage={coverImage}
          avatarImage={avatarImage}
          name={profile.fullName}
          roleLabel="Recruiter"
          company={profile.company}
          location={profile.location}
          email={profile.email}
          readOnly
        />

        <ProfileStats stats={stats} />

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
          <ProfileAbout title="About Recruiter" about={aboutText} />
          <ProfileJobList
            jobs={jobs}
            title="Available Job Openings"
            emptyTitle="No active openings available"
            emptyDescription="This recruiter currently has no open jobs."
            ctaLabel="View Details"
          />
        </div>
      </div>
    </div>
  );
}
