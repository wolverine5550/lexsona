import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid draft ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const { data: draft, error: fetchError } = await supabase
          .from('email_drafts')
          .select(
            `
            *,
            attachments:email_attachments(*)
          `
          )
          .eq('id', id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            return res.status(404).json({ error: 'Draft not found' });
          }
          throw fetchError;
        }

        return res.status(200).json(draft);

      case 'PUT':
        const updateData = req.body;

        // First update the draft
        const { data: updatedDraft, error: updateError } = await supabase
          .from('email_drafts')
          .update({
            subject: updateData.subject,
            content: updateData.content,
            status: updateData.status,
            recipient_email: updateData.recipient_email,
            recipient_name: updateData.recipient_name,
            template_id: updateData.template_id,
            scheduled_for: updateData.scheduled_for,
            last_modified_by: updateData.last_modified_by,
            metadata: updateData.metadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Handle attachments if they've changed
        if (updateData.attachments) {
          // First delete existing attachments
          const { error: deleteAttachmentsError } = await supabase
            .from('email_attachments')
            .delete()
            .eq('email_id', id);

          if (deleteAttachmentsError) throw deleteAttachmentsError;

          // Then create new attachments
          if (updateData.attachments.length > 0) {
            const { error: createAttachmentsError } = await supabase
              .from('email_attachments')
              .insert(
                updateData.attachments.map((attachment: any) => ({
                  ...attachment,
                  email_id: id
                }))
              );

            if (createAttachmentsError) throw createAttachmentsError;
          }
        }

        // Fetch the complete updated draft
        const { data: completeDraft, error: fetchCompleteError } =
          await supabase
            .from('email_drafts')
            .select(
              `
            *,
            attachments:email_attachments(*)
          `
            )
            .eq('id', id)
            .single();

        if (fetchCompleteError) throw fetchCompleteError;

        return res.status(200).json(completeDraft);

      case 'DELETE':
        // Delete attachments first (they have ON DELETE CASCADE)
        const { error: deleteError } = await supabase
          .from('email_drafts')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Email Draft API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
