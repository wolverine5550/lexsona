import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { TicketMessages } from '@/components/help/tickets/TicketMessages';
import { formatDistanceToNow } from 'date-fns';

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

export default async function TicketPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Get ticket details
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!ticket) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-12">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Ticket Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">{ticket.title}</h1>
            <Badge
              className={
                statusColors[ticket.status as keyof typeof statusColors]
              }
            >
              {statusLabels[ticket.status as keyof typeof statusLabels]}
            </Badge>
          </div>
          <div className="mt-2 flex items-center text-sm text-zinc-400">
            <span>Ticket #{ticket.id}</span>
            <span className="mx-2">•</span>
            <span>{ticket.category}</span>
            <span className="mx-2">•</span>
            <span>
              Created{' '}
              {formatDistanceToNow(new Date(ticket.created_at), {
                addSuffix: true
              })}
            </span>
          </div>
        </div>

        {/* Ticket Description */}
        <div className="mb-8 rounded-lg bg-zinc-900 p-6">
          <h2 className="mb-4 text-sm font-medium text-white">Description</h2>
          <p className="whitespace-pre-wrap text-zinc-400">
            {ticket.description}
          </p>
        </div>

        {/* Messages */}
        <TicketMessages ticketId={ticket.id} />
      </div>
    </div>
  );
}
