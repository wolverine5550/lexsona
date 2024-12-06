import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CreateTicketForm from '@/components/help/CreateTicketForm';
import { getUser } from '@/utils/supabase/queries';

async function getTickets(userId: string) {
  const supabase = createClient();
  const { data: tickets, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return tickets;
}

export default async function TicketsPage() {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    return redirect('/signin');
  }

  const tickets = await getTickets(user.id);

  return (
    <section className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-zinc-100">
              Support Tickets
            </h1>
            <p className="mt-2 text-lg text-zinc-400">
              Need help? Create a ticket and our support team will assist you.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Create Ticket Form */}
            <div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <h2 className="text-xl font-semibold text-zinc-100">
                  Create New Ticket
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Please provide details about your issue
                </p>
                <div className="mt-6">
                  <CreateTicketForm />
                </div>
              </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-zinc-100">
                Your Tickets
              </h2>
              {tickets.length === 0 ? (
                <p className="text-zinc-400">No tickets yet</p>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-zinc-100">
                          {ticket.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            ticket.status === 'open'
                              ? 'bg-blue-500/10 text-blue-400'
                              : ticket.status === 'in_progress'
                                ? 'bg-yellow-500/10 text-yellow-400'
                                : ticket.status === 'resolved'
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-zinc-500/10 text-zinc-400'
                          }`}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">
                        {ticket.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                        <span>
                          Created:{' '}
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
