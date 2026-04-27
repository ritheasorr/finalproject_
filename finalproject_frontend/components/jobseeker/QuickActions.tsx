import Link from 'next/link';
import { BriefcaseBusiness, UploadCloud, UserCog } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="surface-card rounded-2xl p-4">
      <h3 className="font-semibold text-gray-900">Quick Actions</h3>
      <p className="text-sm text-gray-500 mt-1">Stay active in your job search.</p>
      <div className="mt-3 space-y-2">
        <Link
          href="/jobseeker/jobs"
          className="w-full inline-flex items-center gap-2 rounded-xl bg-[#0f5d43] text-white px-3 py-2.5 text-sm font-medium hover:bg-[#0b4f39] transition"
        >
          <BriefcaseBusiness className="w-4 h-4" />
          Browse Jobs
        </Link>
        <Link
          href="/jobseeker/profile"
          className="w-full inline-flex items-center gap-2 rounded-xl border border-[#0f5d43]/20 text-[#0f5d43] px-3 py-2.5 text-sm font-medium hover:bg-[#edf7f1] transition"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Resume
        </Link>
        <Link
          href="/jobseeker/profile"
          className="w-full inline-flex items-center gap-2 rounded-xl border border-[#0f5d43]/20 text-[#0f5d43] px-3 py-2.5 text-sm font-medium hover:bg-[#edf7f1] transition"
        >
          <UserCog className="w-4 h-4" />
          Update Profile
        </Link>
      </div>
    </div>
  );
}

