import { LucideIcon, Sparkles } from 'lucide-react';

interface InsightCardProps {
  title: string;
  body: string;
  icon?: LucideIcon;
}

export function InsightCard({ title, body, icon: Icon = Sparkles }: InsightCardProps) {
  return (
    <div className="surface-card rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-xl transition duration-200">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#e8f6ef] text-[#0f6a4c] flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
      </div>
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{body}</p>
    </div>
  );
}

