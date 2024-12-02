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
        const { data: categories, error: fetchError } = await supabase
          .from('template_categories')
          .select('*')
          .order('name');

        if (fetchError) throw fetchError;
        return res.status(200).json(categories);

      case 'POST':
        const { data: newCategory, error: createError } = await supabase
          .from('template_categories')
          .insert({
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        return res.status(201).json(newCategory);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Template Categories API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
