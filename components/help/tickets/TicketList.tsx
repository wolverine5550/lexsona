'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  created_at: string;
  last_updated: string;
}

interface TicketListProps {
  tickets: Ticket[];
}

const statusColors = {
  open: 'bg-yellow-500/10 text-yellow-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  resolved: 'bg-green-500/10 text-green-500',
  closed: 'bg-zinc-500/10 text-zinc-500'
};

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed'
};

export function TicketList({ tickets }: TicketListProps) {
  if (!tickets.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <ul className="divide-y divide-zinc-800">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <Link
              href={`/help/tickets/${ticket.id}`}
              className="block hover:bg-zinc-800/50 transition-colors"
            >
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-sm font-medium text-white">
                      {ticket.title}
                    </h2>
                    <Badge className={statusColors[ticket.status]}>
                      {statusLabels[ticket.status]}
                    </Badge>
                  </div>
                  <div className="text-sm text-zinc-400">
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true
                    })}
                  </div>
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  {ticket.category}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
