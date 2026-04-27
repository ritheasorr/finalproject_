import Link from 'next/link';
import { MapPin, Mail, Globe, Linkedin } from 'lucide-react';

interface ProfileHeaderProps {
  avatarImage?: string;
  name: string;
  roleLabel: string;
  company?: string;
  location?: string;
  email?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  readOnly?: boolean;
}

export default function ProfileHeader({
  avatarImage,
  name,
  roleLabel,
  company,
  location,
  email,
  websiteUrl,
  linkedinUrl,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  readOnly = false,
}: ProfileHeaderProps) {
  return (
    <div className="surface-card px-5 md:px-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-white bg-[#e8f5ef] shadow-md overflow-hidden flex items-center justify-center text-[#0f5d43] text-2xl font-bold">
            {avatarImage ? (
              <img src={avatarImage} alt={name} className="w-full h-full object-cover" />
            ) : (
              name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#043927]">{name}</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              {roleLabel}
              {company ? ` at ${company}` : ''}
            </p>
          </div>
        </div>

        {!readOnly && actionLabel && actionHref ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f5d43] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#0b4d38] transition"
            >
              {actionLabel}
            </Link>
            {secondaryActionLabel && secondaryActionHref && (
              <Link
                href={secondaryActionHref}
                className="inline-flex items-center gap-2 rounded-lg border border-[#0f5d43]/20 text-[#0f5d43] px-4 py-2.5 text-sm font-medium hover:bg-[#edf7f1] transition"
              >
                {secondaryActionLabel}
              </Link>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
        {location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#0f5d43]" />
            {location}
          </span>
        )}
        {email && (
          <span className="inline-flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-[#0f5d43]" />
            {email}
          </span>
        )}
        {websiteUrl && (
          <a href={websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-[#0f5d43] transition">
            <Globe className="w-4 h-4 text-[#0f5d43]" />
            Website
          </a>
        )}
        {linkedinUrl && (
          <a href={linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-[#0f5d43] transition">
            <Linkedin className="w-4 h-4 text-[#0f5d43]" />
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}
