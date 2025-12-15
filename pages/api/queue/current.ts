import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentVideo, getQueueLength } from '@/lib/queue';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const current = getCurrentVideo();
    const queueLength = getQueueLength();
    
    res.status(200).json({
      current,
      queueLength,
      upNext: Math.max(0, queueLength - 1),
    });
  } catch (error) {
    console.error('Error getting current video:', error);
    res.status(500).json({ error: 'Failed to get current video' });
  }
}

