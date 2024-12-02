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
        const { data: templates, error: fetchError } = await supabase
          .from('message_templates')
          .select(
            `
            *,
            category:template_categories(*),
            placeholders:template_placeholders(*)
          `
          )
          .order('updated_at', { ascending: false });

        if (fetchError) throw fetchError;
        return res.status(200).json(templates);

      case 'POST':
        const {
          title,
          content,
          category,
          placeholders,
          status,
          createdBy,
          lastModifiedBy
        } = req.body;

        // First create the template
        const { data: newTemplate, error: createError } = await supabase
          .from('message_templates')
          .insert({
            title,
            content,
            category_id: category.id,
            status: status || 'draft',
            created_by: createdBy,
            last_modified_by: lastModifiedBy,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;

        // Then create the placeholders
        if (placeholders && placeholders.length > 0) {
          const { error: placeholdersError } = await supabase
            .from('template_placeholders')
            .insert(
              placeholders.map((p: any) => ({
                ...p,
                template_id: newTemplate.id
              }))
            );

          if (placeholdersError) throw placeholdersError;
        }

        // Fetch the complete template with relations
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
            .eq('id', newTemplate.id)
            .single();

        if (fetchCompleteError) throw fetchCompleteError;

        return res.status(201).json(completeTemplate);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Template API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
