import type { NextApiRequest, NextApiResponse } from 'next';
import { removeCurrentVideo } from '@/lib/queue';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const removed = removeCurrentVideo();
    
    if (!removed) {
      return res.status(404).json({ error: 'No video in queue to remove' });
    }
    
    res.status(200).json({
      success: true,
      removed,
    });
  } catch (error) {
    console.error('Error removing video:', error);
    res.status(500).json({ error: 'Failed to remove video from queue' });
  }
}

