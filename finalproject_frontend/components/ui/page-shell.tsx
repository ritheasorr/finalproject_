import { ReactNode } from 'react';
import Navigation from '@/components/Navigation';

interface PageShellProps {
  variant: 'jobseeker' | 'recruiter';
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageShell({ variant, title, subtitle, actions, children }: PageShellProps) {
  return (
    <div className="min-h-screen page-gradient">
      <Navigation variant={variant} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="stagger-in">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="stagger-in">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
