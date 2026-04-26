import Link from 'next/link';
import { Building2, MapPin, UserRound } from 'lucide-react';

interface RecruiterMiniCardProps {
  recruiterId: string;
  recruiterName: string;
  companyName: string;
  location?: string;
  avatarUrl?: string;
}

export default function RecruiterMiniCard({
  recruiterId,
  recruiterName,
  companyName,
  location,
  avatarUrl,
}: RecruiterMiniCardProps) {
  return (
    <Link
      href={`/recruiters/${recruiterId}`}
      className="block surface-card p-4 hover:-translate-y-0.5 hover:shadow-md transition"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-[#e8f5ef] border border-[#0f5d43]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={recruiterName} className="w-full h-full object-cover" />
          ) : (
            <UserRound className="w-5 h-5 text-[#0f5d43]" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{recruiterName}</p>
          <p className="text-sm text-gray-600 inline-flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#0f5d43]" />
            {companyName}
          </p>
          {location ? (
            <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </p>
          ) : null}
          <p className="text-xs font-medium text-[#0f5d43] mt-2">View Profile</p>
        </div>
      </div>
    </Link>
  );
}
