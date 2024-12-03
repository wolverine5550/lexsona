import { createClient } from '@/utils/supabase/server';
import { TicketList } from '@/components/help/tickets/TicketList';
import { CreateTicketButton } from '@/components/help/tickets/CreateTicketButton';

export default async function TicketsPage() {
  const supabase = createClient();

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Get user's tickets
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-950 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Support Tickets
            </h1>
            <p className="mt-2 text-zinc-400">Get help from our support team</p>
          </div>
          <CreateTicketButton />
        </div>

        {/* Tickets List */}
        <TicketList tickets={tickets || []} />

        {/* Empty State */}
        {(!tickets || tickets.length === 0) && (
          <div className="text-center py-12 bg-zinc-900 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-2">
              No Support Tickets
            </h3>
            <p className="text-zinc-400 mb-6">
              Create a new ticket if you need help with anything
            </p>
            <CreateTicketButton />
          </div>
        )}
      </div>
    </div>
  );
}
