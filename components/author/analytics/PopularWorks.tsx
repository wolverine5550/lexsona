import Image from 'next/image';
import { BarChart2 } from 'lucide-react';
import { AuthorWork } from '@/types/author';

interface PopularWorksProps {
  works: AuthorWork[];
}

const PopularWorks = ({ works }: PopularWorksProps) => {
  // Sort works by listens (mock data - replace with actual metrics)
  const popularWorks = works
    .map((work) => ({
      ...work,
      listens: Math.floor(Math.random() * 10000), // Mock listen count
      trend: Math.floor(Math.random() * 20) - 10 // Mock trend percentage
    }))
    .sort((a, b) => b.listens - a.listens)
    .slice(0, 5); // Top 5 works

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-6">Popular Works</h2>

      <div className="space-y-4">
        {popularWorks.map((work, index) => (
          <div
            key={work.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Rank */}
            <span className="text-lg font-semibold text-gray-400 w-6">
              {index + 1}
            </span>

            {/* Book Cover */}
            <div className="relative w-12 h-16 flex-shrink-0">
              <Image
                src={work.coverImage}
                alt={work.title}
                fill
                className="object-cover rounded"
                sizes="48px"
              />
            </div>

            {/* Work Info */}
            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {work.title}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                {work.listens.toLocaleString()} listens
              </p>
            </div>

            {/* Trend Indicator */}
            <div
              className={`text-sm ${
                work.trend > 0
                  ? 'text-green-600'
                  : work.trend < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {work.trend > 0 ? '+' : ''}
              {work.trend}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularWorks;
