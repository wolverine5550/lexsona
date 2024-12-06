'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TicketResponse } from '@/components/admin/TicketResponse';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  created_at: string;
  profiles: {
    email: string;
  };
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Load tickets
  useEffect(() => {
    async function loadTickets() {
      try {
        // Check if user is admin
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: roleData } = await supabase
          .from('staff_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role !== 'admin') {
          throw new Error('Not authorized');
        }

        // Get tickets
        const { data: ticketData, error: ticketError } = await supabase
          .from('support_tickets')
          .select(
            `
            *,
            profiles:user_id (
              email
            )
          `
          )
          .order('created_at', { ascending: false });

        if (ticketError) throw ticketError;
        setTickets(ticketData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tickets');
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [supabase]);

  // Handle status updates
  const handleStatusChange = (ticketId: string, newStatus: string) => {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16">
        <div className="container mx-auto px-4 py-12">
          <p className="text-zinc-400">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="rounded bg-red-500/10 p-4 text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-zinc-100">
              Support Ticket Administration
            </h1>
            <p className="mt-2 text-lg text-zinc-400">
              Manage and respond to user support tickets.
            </p>
          </div>

          {/* Tickets List */}
          <div className="space-y-6">
            {tickets.length === 0 ? (
              <p className="text-zinc-400">No tickets to display</p>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-medium text-zinc-100">
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

                    {/* User Info */}
                    <p className="mt-2 text-sm text-zinc-400">
                      From: {ticket.profiles.email}
                    </p>

                    {/* Category */}
                    <p className="mt-1 text-sm text-zinc-400">
                      Category: {ticket.category}
                    </p>

                    {/* Description */}
                    <p className="mt-4 text-zinc-300">{ticket.description}</p>

                    {/* Metadata */}
                    <div className="mt-4 text-xs text-zinc-500">
                      Created: {new Date(ticket.created_at).toLocaleString()}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-4">
                      <TicketResponse
                        ticketId={ticket.id}
                        currentStatus={ticket.status}
                        onStatusChange={(newStatus) =>
                          handleStatusChange(ticket.id, newStatus)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
