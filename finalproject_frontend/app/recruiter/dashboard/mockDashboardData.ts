export interface MockPerformanceMetrics {
  views: number;
  conversionRate: number;
  trend: number[];
}

export function generateSparkline(seed: number, points = 12): number[] {
  const out: number[] = [];
  let value = 40 + (seed % 20);
  for (let i = 0; i < points; i += 1) {
    const shift = ((seed * (i + 3)) % 9) - 4;
    value = Math.max(5, Math.min(100, value + shift));
    out.push(value);
  }
  return out;
}

export function generateMockPerformance(applications: number, seed: number): MockPerformanceMetrics {
  const views = Math.max(60, applications * 14 + 60 + (seed % 11) * 9);
  const conversionRate = Number(((applications / views) * 100).toFixed(1));
  return {
    views,
    conversionRate,
    trend: generateSparkline(seed + applications, 10),
  };
}

export const fallbackInsights = [
  'Post details with clear skill requirements to increase quality applicants.',
  'Use shortlist tagging to prioritize candidates above 85% AI match.',
  'Review pending candidates before interview deadlines to avoid drop-offs.',
];
