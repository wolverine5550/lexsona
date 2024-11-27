interface PodcastMatch {
  id: string;
  podcastName: string;
  hostName: string;
  matchScore: number;
  date: string;
}

export function RecentMatches() {
  // This will be replaced with real data later
  const matches: PodcastMatch[] = [
    {
      id: '1',
      podcastName: 'The Author Hour',
      hostName: 'Sarah Johnson',
      matchScore: 95,
      date: '2024-01-15'
    },
    {
      id: '2',
      podcastName: 'Book Talk Daily',
      hostName: 'Mike Smith',
      matchScore: 88,
      date: '2024-01-14'
    }
  ];

  return (
    <div className="divide-y divide-zinc-800 rounded-lg bg-zinc-900">
      {matches.map((match) => (
        <div key={match.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">{match.podcastName}</h3>
              <p className="text-sm text-zinc-400">Host: {match.hostName}</p>
            </div>
            <div className="text-right">
              <span className="rounded-full bg-blue-500/10 px-2 py-1 text-sm font-medium text-blue-500">
                {match.matchScore}% Match
              </span>
              <p className="mt-1 text-xs text-zinc-500">{match.date}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
