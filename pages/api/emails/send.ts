import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { EmailDraft } from '@/components/communication/email/types';

// Define the attachment type from Supabase
interface EmailAttachment {
  id: string;
  email_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  created_by: string;
}

// Type guard for EmailAttachment
function isEmailAttachment(obj: any): obj is EmailAttachment {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'storage_path' in obj &&
    'file_name' in obj
  );
}

// Create clients that can be mocked in tests
export const resend = new Resend(process.env.RESEND_API_KEY);
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { draftId } = req.body;

    // Fetch the draft with attachments
    const { data: draft, error: fetchError } = await supabase
      .from('email_drafts')
      .select(
        `
        *,
        attachments:email_attachments(*)
      `
      )
      .eq('id', draftId)
      .single();

    console.log('Draft fetch result:', { draft, fetchError }); // Debug log

    if (fetchError) {
      console.log('Fetch error:', fetchError); // Debug log
      throw fetchError;
    }
    if (!draft) {
      console.log('No draft found'); // Debug log
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Type assertion for draft
    const typedDraft = draft as EmailDraft & { attachments: unknown[] };

    // Validate required fields
    if (
      !typedDraft.recipient_email ||
      !typedDraft.subject ||
      !typedDraft.content
    ) {
      return res.status(400).json({ error: 'Missing required email fields' });
    }

    // Get attachment URLs if any
    const attachments = await Promise.all(
      (typedDraft.attachments || []).map(async (attachment) => {
        if (!isEmailAttachment(attachment)) return null;

        const { data } = supabase.storage
          .from('attachments')
          .getPublicUrl(attachment.storage_path);

        return {
          filename: attachment.file_name,
          path: data.publicUrl
        };
      })
    );

    // Filter out any null attachments
    const validAttachments = attachments.filter(
      (attachment): attachment is { filename: string; path: string } =>
        attachment !== null
    );

    // Send email using Resend
    const { data: emailData, error: sendError } = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS!,
      to: typedDraft.recipient_email,
      subject: typedDraft.subject,
      html: typedDraft.content,
      attachments: validAttachments,
      replyTo: process.env.EMAIL_REPLY_TO_ADDRESS
    });

    if (sendError) throw sendError;
    if (!emailData) throw new Error('No email data returned');

    // Update draft status to sent
    const { error: updateError } = await supabase
      .from('email_drafts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          ...((typedDraft.metadata as Record<string, unknown>) || {}),
          emailId: emailData.id
        }
      })
      .eq('id', draftId);

    if (updateError) throw updateError;

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
