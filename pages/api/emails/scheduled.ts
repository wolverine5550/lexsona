import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { Resend } from 'resend';
import { isBefore, parseISO } from 'date-fns';
import { EmailDraft } from '@/components/communication/email/types';

// Define Supabase attachment type
interface SupabaseAttachment {
  id: string;
  email_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  created_by: string;
}

// Type guard for Supabase attachment
function isSupabaseAttachment(obj: unknown): obj is SupabaseAttachment {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'storage_path' in obj &&
    'file_name' in obj &&
    'id' in obj &&
    'email_id' in obj &&
    typeof (obj as any).storage_path === 'string' &&
    typeof (obj as any).file_name === 'string'
  );
}

// Define Resend attachment type
interface ResendAttachment {
  filename: string;
  path: string;
}

// Initialize Resend and Supabase clients
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API endpoint for handling scheduled emails
 * This endpoint should be called by a CRON job every minute
 * It checks for emails that are scheduled to be sent and sends them
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests with proper authorization
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Verify the request is from an authorized source
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get current time
    const now = new Date();

    // Fetch all scheduled emails that are due to be sent
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('email_drafts')
      .select(
        `
        *,
        attachments:email_attachments(*)
      `
      )
      .eq('status', 'scheduled')
      .not('scheduled_for', 'is', null);

    if (fetchError) throw fetchError;

    // Process each scheduled email
    const results = await Promise.allSettled(
      (scheduledEmails || []).map(async (draft) => {
        // Type assertion for draft
        const typedDraft = draft as EmailDraft & {
          attachments: unknown[];
        };

        // Skip if not yet time to send
        if (
          !typedDraft.scheduled_for ||
          !isBefore(parseISO(typedDraft.scheduled_for), now)
        ) {
          return null;
        }

        // Get attachment URLs if any
        const attachments = await Promise.all(
          (typedDraft.attachments || []).map(async (attachment) => {
            if (!isSupabaseAttachment(attachment)) return null;

            const { data } = supabase.storage
              .from('attachments')
              .getPublicUrl(attachment.storage_path);

            return {
              filename: attachment.file_name,
              path: data.publicUrl
            } as ResendAttachment;
          })
        );

        // Filter out null attachments and ensure type safety
        const validAttachments: ResendAttachment[] = attachments.filter(
          (attachment): attachment is ResendAttachment => attachment !== null
        );

        // Send the email
        const { data: emailData, error: sendError } = await resend.emails.send({
          from: process.env.EMAIL_FROM_ADDRESS!,
          to: typedDraft.recipient_email!,
          subject: typedDraft.subject!,
          html: typedDraft.content!,
          attachments: validAttachments,
          replyTo: process.env.EMAIL_REPLY_TO_ADDRESS
        });

        if (sendError) throw sendError;

        // Update draft status to sent
        const { error: updateError } = await supabase
          .from('email_drafts')
          .update({
            status: 'sent',
            sent_at: now.toISOString(),
            metadata: {
              ...(typeof typedDraft.metadata === 'object'
                ? (typedDraft.metadata as Record<string, unknown>)
                : {}),
              emailId: emailData?.id,
              scheduledSendComplete: true
            }
          })
          .eq('id', typedDraft.id);

        if (updateError) throw updateError;

        return {
          id: typedDraft.id,
          status: 'sent',
          emailId: emailData?.id
        };
      })
    );

    // Count successes and failures
    const succeeded = results.filter(
      (r) => r.status === 'fulfilled' && r.value
    ).length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const skipped = results.filter(
      (r) => r.status === 'fulfilled' && !r.value
    ).length;

    return res.status(200).json({
      message: 'Scheduled emails processed',
      stats: {
        total: results.length,
        succeeded,
        failed,
        skipped
      }
    });
  } catch (error) {
    console.error('Scheduled emails processing error:', error);
    return res
      .status(500)
      .json({ error: 'Failed to process scheduled emails' });
  }
}
