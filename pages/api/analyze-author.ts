import { NextApiRequest, NextApiResponse } from 'next';
import { AuthorAnalyzer } from '@/services/author-analyzer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { authorId } = req.body;
    const analysis = await AuthorAnalyzer.analyze(authorId);
    res.status(200).json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze author' });
  }
}
