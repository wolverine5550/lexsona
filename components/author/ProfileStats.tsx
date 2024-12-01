import { Author } from '@/types/author';
import { Users, Headphones, BookOpen } from 'lucide-react';

interface ProfileStatsProps {
  author: Author;
}

const ProfileStats = ({ author }: ProfileStatsProps) => {
  const stats = [
    {
      label: 'Total Listens',
      value: author.totalListens,
      icon: Headphones
    },
    {
      label: 'Followers',
      value: author.followers,
      icon: Users
    },
    {
      label: 'Published Works',
      value: author.works.length,
      icon: BookOpen
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4"
          data-testid="stat-card"
        >
          <div className="p-3 bg-blue-50 rounded-full">
            <stat.icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            <p
              className="text-gray-600"
              data-testid="stat-label"
              aria-label={`${stat.label}: ${stat.value.toLocaleString()}`}
            >
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats;
