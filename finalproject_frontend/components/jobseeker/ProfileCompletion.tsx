import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export interface ProfileChecklistItem {
  label: string;
  done: boolean;
}

interface ProfileCompletionProps {
  completion: number;
  items: ProfileChecklistItem[];
}

export function ProfileCompletion({ completion, items }: ProfileCompletionProps) {
  return (
    <div className="surface-card rounded-2xl p-4">
      <h3 className="font-semibold text-gray-900">Profile Completion</h3>
      <p className="text-sm text-gray-500 mt-1">Complete your profile: {completion}%</p>

      <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[#2c8f66] to-[#67be96]" style={{ width: `${completion}%` }} />
      </div>

      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Circle className="w-4 h-4 text-gray-400" />
            )}
            <span className={item.done ? 'text-gray-700' : 'text-gray-500'}>{item.label}</span>
          </div>
        ))}
      </div>

      <Link
        href="/jobseeker/profile"
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#0f5d43] hover:underline"
      >
        Complete Now
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

