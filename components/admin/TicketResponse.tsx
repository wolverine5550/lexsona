'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

interface TicketResponseProps {
  ticketId: string;
}

export function TicketResponse({ ticketId }: TicketResponseProps) {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('messages').insert([
        {
          type: 'ticket',
          content: response,
          metadata: {
            ticket_id: ticketId,
            sender_type: 'staff'
          },
          status: 'unread'
        }
      ]);

      if (error) throw error;
      setResponse('');
    } catch (error) {
      console.error('Error sending response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={response}
        onChange={handleChange}
        placeholder="Type your response..."
        rows={4}
        className="w-full"
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Response'}
      </Button>
    </form>
  );
}
