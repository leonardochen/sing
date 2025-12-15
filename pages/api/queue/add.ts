import type { NextApiRequest, NextApiResponse } from 'next';
import { addToQueue } from '@/lib/queue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { youtubeUrl, userName } = req.body;
    
    if (!youtubeUrl || !userName) {
      return res.status(400).json({ error: 'youtubeUrl and userName are required' });
    }
    
    if (typeof youtubeUrl !== 'string' || typeof userName !== 'string') {
      return res.status(400).json({ error: 'youtubeUrl and userName must be strings' });
    }
    
    if (userName.trim().length === 0) {
      return res.status(400).json({ error: 'userName cannot be empty' });
    }
    
    const entry = await addToQueue(youtubeUrl, userName.trim());
    
    res.status(201).json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('Error adding to queue:', error);
    
    if (error instanceof Error && error.message === 'Invalid YouTube URL') {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    res.status(500).json({ error: 'Failed to add video to queue' });
  }
}

