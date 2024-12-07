'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Message } from '@/types/services';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { format } from 'date-fns';

interface TicketMessagesProps {
  ticketId: string;
}

export function TicketMessages({ ticketId }: TicketMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('type', 'ticket')
        .eq('metadata->ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `type=eq.ticket,metadata->ticket_id=eq.${ticketId}`
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [ticketId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsLoading(true);
    const { error } = await supabase.from('messages').insert([
      {
        type: 'ticket',
        content: newMessage,
        metadata: {
          ticket_id: ticketId,
          sender_type: 'user'
        },
        status: 'unread'
      }
    ]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
    setIsLoading(false);
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.metadata?.sender_type === 'staff'
                ? 'justify-start'
                : 'justify-end'
            }`}
          >
            <div
              className={`flex gap-3 max-w-[80%] ${
                message.metadata?.sender_type === 'staff'
                  ? 'flex-row'
                  : 'flex-row-reverse'
              }`}
            >
              <Avatar size="sm">
                {message.metadata?.sender_avatar ? (
                  <AvatarImage src={message.metadata.sender_avatar} />
                ) : (
                  <AvatarFallback>
                    {message.metadata?.sender_name?.[0] || '?'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div
                className={`rounded-lg p-3 ${
                  message.metadata?.sender_type === 'staff'
                    ? 'bg-gray-100'
                    : 'bg-blue-100'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(message.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-zinc-400">No messages yet</p>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newMessage}
            onValueChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
