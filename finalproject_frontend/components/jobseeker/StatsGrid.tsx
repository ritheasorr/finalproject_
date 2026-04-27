import { LucideIcon } from 'lucide-react';

export interface JobseekerStatItem {
  key: string;
  label: string;
  value: string;
  hint: string;
  progress: number;
  icon: LucideIcon;
  iconStyle: string;
  barStyle: string;
}

interface StatsGridProps {
  stats: JobseekerStatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className="surface-card rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-xl transition duration-200 fade-in-up"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
                <p className="text-xs text-gray-500 mt-1">{item.hint}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconStyle}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full rounded-full ${item.barStyle}`} style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

