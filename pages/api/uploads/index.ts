import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import formidable, { Fields, Files, File } from 'formidable';
import { createReadStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false
  }
};

const supabase = createClient<Database>(
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
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024 // 10MB limit
    });

    const [fields, files] = await new Promise<[Fields, Files]>(
      (resolve, reject) => {
        form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      }
    );

    // Handle file array from formidable
    const fileArray = files.file;
    if (!fileArray || !Array.isArray(fileArray) || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFile = fileArray[0];
    if (!uploadedFile?.originalFilename) {
      return res.status(400).json({ error: 'Invalid file' });
    }

    // Generate a unique file name
    const fileExt = uploadedFile.originalFilename.split('.').pop() || '';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `email-attachments/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(filePath, createReadStream(uploadedFile.filepath), {
        contentType: uploadedFile.mimetype || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get the public URL
    const {
      data: { publicUrl }
    } = supabase.storage.from('attachments').getPublicUrl(filePath);

    return res.status(200).json({
      id: fileName,
      path: filePath,
      url: publicUrl,
      name: uploadedFile.originalFilename,
      size: uploadedFile.size,
      type: uploadedFile.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
