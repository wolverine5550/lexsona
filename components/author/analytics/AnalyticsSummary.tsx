import { Author } from '@/types/author';
import { TrendingUp, Users, PlayCircle, Clock } from 'lucide-react';

interface AnalyticsSummaryProps {
  author: Author;
}

// Analytics card data type
interface AnalyticCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
}

const AnalyticsSummary = ({ author }: AnalyticsSummaryProps) => {
  // Sample analytics cards data
  const cards: AnalyticCard[] = [
    {
      title: 'Total Listens',
      value: author.totalListens.toLocaleString(),
      change: 12.5,
      icon: PlayCircle,
      trend: 'up'
    },
    {
      title: 'Active Listeners',
      value: '2,845',
      change: -2.4,
      icon: Users,
      trend: 'down'
    },
    {
      title: 'Avg. Listen Time',
      value: '18:32',
      change: 3.2,
      icon: Clock,
      trend: 'up'
    },
    {
      title: 'Engagement Rate',
      value: '64%',
      change: 0.8,
      icon: TrendingUp,
      trend: 'up'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          {/* Card Header */}
          <div className="flex justify-between items-start">
            <div
              className={`p-2 rounded-lg ${
                card.trend === 'up'
                  ? 'bg-green-50'
                  : card.trend === 'down'
                    ? 'bg-red-50'
                    : 'bg-gray-50'
              }`}
            >
              <card.icon
                className={`w-6 h-6 ${
                  card.trend === 'up'
                    ? 'text-green-600'
                    : card.trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              />
            </div>
            {/* Trend Indicator */}
            <div
              className={`text-sm ${
                card.trend === 'up'
                  ? 'text-green-600'
                  : card.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {card.change > 0 ? '+' : ''}
              {card.change}%
            </div>
          </div>

          {/* Card Content */}
          <div className="mt-4">
            <h3 className="text-gray-600 text-sm">{card.title}</h3>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsSummary;
