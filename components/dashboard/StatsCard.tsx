import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface StatsCardProps {
  title: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
}

export function StatsCard({
  title,
  value,
  trend,
  trendDirection
}: StatsCardProps) {
  return (
    <div className="rounded-lg bg-zinc-900 p-6">
      <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-white">{value}</p>
        {trend && (
          <span
            className={`inline-flex items-baseline text-sm font-medium ${
              trendDirection === 'up'
                ? 'text-green-500'
                : trendDirection === 'down'
                  ? 'text-red-500'
                  : 'text-zinc-400'
            }`}
          >
            {trendDirection === 'up' && (
              <ArrowUpIcon className="mr-0.5 h-4 w-4" />
            )}
            {trendDirection === 'down' && (
              <ArrowDownIcon className="mr-0.5 h-4 w-4" />
            )}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
