interface Interview {
  id: string;
  podcastName: string;
  hostName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'pending' | 'completed';
}

export function UpcomingInterviews() {
  // This will be replaced with real data later
  const interviews: Interview[] = [
    {
      id: '1',
      podcastName: 'The Author Hour',
      hostName: 'Sarah Johnson',
      date: '2024-01-20',
      time: '14:00',
      status: 'scheduled'
    },
    {
      id: '2',
      podcastName: 'Book Talk Daily',
      hostName: 'Mike Smith',
      date: '2024-01-22',
      time: '15:30',
      status: 'pending'
    }
  ];

  return (
    <div className="divide-y divide-zinc-800 rounded-lg bg-zinc-900">
      {interviews.map((interview) => (
        <div key={interview.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">
                {interview.podcastName}
              </h3>
              <p className="text-sm text-zinc-400">
                Host: {interview.hostName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white">
                {interview.date} at {interview.time}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium
                ${
                  interview.status === 'scheduled'
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-yellow-500/10 text-yellow-500'
                }`}
              >
                {interview.status.charAt(0).toUpperCase() +
                  interview.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
