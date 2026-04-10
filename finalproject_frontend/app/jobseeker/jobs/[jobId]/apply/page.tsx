'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LegacyApplyRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;

  useEffect(() => {
    if (!jobId) return;
    router.replace(`/jobseeker/jobs/${jobId}`);
  }, [jobId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Redirecting...</div>
    </div>
  );
}
