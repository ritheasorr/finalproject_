import { type ComponentType } from 'react';

interface StatItem {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
}

interface ProfileStatsProps {
  stats: StatItem[];
}

export default function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="surface-card p-4 hover:-translate-y-0.5 hover:shadow-md transition">
            <div className="w-9 h-9 rounded-lg bg-[#e7f5ee] text-[#0f5d43] flex items-center justify-center mb-2">
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
