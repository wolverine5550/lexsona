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
    return res.status(400).json({ error: 'Invalid template ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const { data: template, error: fetchError } = await supabase
          .from('message_templates')
          .select(
            `
            *,
            category:template_categories(*),
            placeholders:template_placeholders(*)
          `
          )
          .eq('id', id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            return res.status(404).json({ error: 'Template not found' });
          }
          throw fetchError;
        }

        return res.status(200).json(template);

      case 'PUT':
        const {
          title,
          content,
          category,
          placeholders,
          status,
          lastModifiedBy
        } = req.body;

        // First update the template
        const { data: updatedTemplate, error: updateError } = await supabase
          .from('message_templates')
          .update({
            title,
            content,
            category_id: category.id,
            status,
            last_modified_by: lastModifiedBy,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Delete existing placeholders
        const { error: deleteError } = await supabase
          .from('template_placeholders')
          .delete()
          .eq('template_id', id);

        if (deleteError) throw deleteError;

        // Create new placeholders
        if (placeholders && placeholders.length > 0) {
          const { error: placeholdersError } = await supabase
            .from('template_placeholders')
            .insert(
              placeholders.map((p: any) => ({
                ...p,
                template_id: id
              }))
            );

          if (placeholdersError) throw placeholdersError;
        }

        // Fetch the complete updated template
        const { data: completeTemplate, error: fetchCompleteError } =
          await supabase
            .from('message_templates')
            .select(
              `
            *,
            category:template_categories(*),
            placeholders:template_placeholders(*)
          `
            )
            .eq('id', id)
            .single();

        if (fetchCompleteError) throw fetchCompleteError;

        return res.status(200).json(completeTemplate);

      case 'DELETE':
        // Delete placeholders first (foreign key constraint)
        const { error: deletePlaceholdersError } = await supabase
          .from('template_placeholders')
          .delete()
          .eq('template_id', id);

        if (deletePlaceholdersError) throw deletePlaceholdersError;

        // Then delete the template
        const { error: deleteTemplateError } = await supabase
          .from('message_templates')
          .delete()
          .eq('id', id);

        if (deleteTemplateError) throw deleteTemplateError;

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Template API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
