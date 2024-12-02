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
  try {
    switch (req.method) {
      case 'GET':
        // Get query parameters for filtering
        const { status, search } = req.query;

        // Start building the query
        let query = supabase.from('email_drafts').select(`
            *,
            attachments:email_attachments(*)
          `);

        // Apply filters
        if (status) {
          query = query.eq('status', status);
        }

        if (search) {
          query = query.or(`
            subject.ilike.%${search}%,
            content.ilike.%${search}%,
            recipient_email.ilike.%${search}%,
            recipient_name.ilike.%${search}%
          `);
        }

        // Execute query
        const { data: drafts, error: fetchError } = await query.order(
          'updated_at',
          { ascending: false }
        );

        if (fetchError) throw fetchError;
        return res.status(200).json(drafts);

      case 'POST':
        const draftData = req.body;

        // First create the draft
        const { data: newDraft, error: createError } = await supabase
          .from('email_drafts')
          .insert({
            subject: draftData.subject,
            content: draftData.content,
            status: draftData.status,
            recipient_email: draftData.recipient_email,
            recipient_name: draftData.recipient_name,
            template_id: draftData.template_id,
            scheduled_for: draftData.scheduled_for,
            created_by: draftData.created_by,
            last_modified_by: draftData.last_modified_by,
            metadata: draftData.metadata
          })
          .select()
          .single();

        if (createError) throw createError;

        // Then create attachments if any
        if (draftData.attachments?.length > 0) {
          const { error: attachmentsError } = await supabase
            .from('email_attachments')
            .insert(
              draftData.attachments.map((attachment: any) => ({
                ...attachment,
                email_id: newDraft.id
              }))
            );

          if (attachmentsError) throw attachmentsError;
        }

        // Fetch the complete draft with attachments
        const { data: completeDraft, error: fetchCompleteError } =
          await supabase
            .from('email_drafts')
            .select(
              `
            *,
            attachments:email_attachments(*)
          `
            )
            .eq('id', newDraft.id)
            .single();

        if (fetchCompleteError) throw fetchCompleteError;

        return res.status(201).json(completeDraft);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Email Drafts API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
