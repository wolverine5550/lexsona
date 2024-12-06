'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Dialog } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';

interface TicketResponseProps {
  ticketId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

export function TicketResponse({
  ticketId,
  currentStatus,
  onStatusChange
}: TicketResponseProps) {
  // State for the response dialog
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase client
  const supabase = createClient();

  // Handle sending the response
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Get the current user (admin)
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert the response message
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert([
          {
            ticket_id: ticketId,
            user_id: user.id,
            content: message,
            is_staff: true
          }
        ]);

      if (messageError) throw messageError;

      // Clear form and close dialog
      setMessage('');
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;
      onStatusChange(newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <>
      {/* Response Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
      >
        Reply
      </button>

      {/* Status Select */}
      <select
        className="rounded bg-zinc-800 px-4 py-2 text-sm text-zinc-100"
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
      >
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      {/* Response Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-zinc-900 p-6">
            <h3 className="text-lg font-medium text-zinc-100">
              Respond to Ticket
            </h3>

            {error && (
              <div className="mt-4 rounded bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 p-3 text-zinc-100"
                rows={4}
                placeholder="Type your response..."
                required
              />

              <div className="mt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="flat"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Response'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </>
  );
}
