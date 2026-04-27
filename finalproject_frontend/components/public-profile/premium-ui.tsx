import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

function initialsFromName(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface PublicAvatarProps {
  name: string;
  imageUrl?: string;
  sizeClass?: string;
  textClass?: string;
}

export function PublicAvatar({
  name,
  imageUrl,
  sizeClass = 'w-24 h-24',
  textClass = 'text-2xl',
}: PublicAvatarProps) {
  return (
    <div className={`${sizeClass} rounded-full bg-[#e8f5ef] ring-4 ring-white/70 shadow-[0_12px_35px_rgba(15,93,67,0.25)] overflow-hidden flex items-center justify-center text-[#0f5d43] font-bold ${textClass}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        initialsFromName(name || 'U')
      )}
    </div>
  );
}

interface PremiumBadgeProps {
  label: string;
  tone?: 'emerald' | 'slate' | 'blue' | 'amber';
  className?: string;
}

const toneMap: Record<NonNullable<PremiumBadgeProps['tone']>, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-900 border-emerald-300/40',
  slate: 'bg-white/75 text-slate-700 border-slate-200',
  blue: 'bg-blue-500/15 text-blue-900 border-blue-300/40',
  amber: 'bg-amber-500/15 text-amber-900 border-amber-300/40',
};

export function PremiumBadge({ label, tone = 'slate', className = '' }: PremiumBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${toneMap[tone]} ${className}`}>
      {label}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-white/65 bg-white/85 backdrop-blur-sm p-4 shadow-[0_14px_35px_rgba(16,24,40,0.08)] hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(16,24,40,0.12)] transition-all duration-200">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, subtitle, icon, children }: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur-sm p-5 md:p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 inline-flex items-center gap-2">
            {icon}
            {title}
          </h2>
          {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

interface CtaLinkProps {
  href: string;
  label: string;
}

export function CtaLink({ href, label }: CtaLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-[#0f5d43]/30 hover:text-[#0f5d43] hover:bg-[#f6fbf8] transition"
    >
      {label}
      <ChevronRight className="w-4 h-4" />
    </a>
  );
}
