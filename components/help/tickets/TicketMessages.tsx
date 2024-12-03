'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import Button from '@/components/ui/Button';

interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_staff: boolean;
  created_at: string;
}

interface TicketMessagesProps {
  ticketId: string;
}

export function TicketMessages({ ticketId }: TicketMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`ticket_messages:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase]);

  // Send message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('ticket_messages').insert([
        {
          ticket_id: ticketId,
          user_id: user.id,
          content: newMessage,
          is_staff: false
        }
      ]);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages List */}
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.is_staff ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                message.is_staff
                  ? 'bg-zinc-800 text-white'
                  : 'bg-blue-500 text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="mt-1 text-xs opacity-70">
                {formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true
                })}
              </p>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="text-center text-zinc-400">No messages yet</p>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-lg bg-zinc-800 px-4 py-2 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
          required
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
