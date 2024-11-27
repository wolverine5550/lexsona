interface Activity {
  id: string;
  type: 'match' | 'message' | 'interview' | 'review';
  title: string;
  description: string;
  date: string;
}

export function ActivityFeed() {
  // This will be replaced with real data later
  const activities: Activity[] = [
    {
      id: '1',
      type: 'match',
      title: 'New Match Found',
      description: 'You matched with "The Author Hour" podcast',
      date: '2024-01-15'
    },
    {
      id: '2',
      type: 'message',
      title: 'New Message',
      description: 'Sarah from Book Talk Daily sent you a message',
      date: '2024-01-14'
    }
  ];

  return (
    <div className="divide-y divide-zinc-800 rounded-lg bg-zinc-900">
      {activities.map((activity) => (
        <div key={activity.id} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-white">{activity.title}</h3>
              <p className="text-sm text-zinc-400">{activity.description}</p>
            </div>
            <p className="text-xs text-zinc-500">{activity.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
