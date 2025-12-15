import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentVideo, getQueueLength, getAllVideos } from '@/lib/queue';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const allVideos = getAllVideos();
    const current = allVideos.length > 0 ? allVideos[0] : null;
    const queue = allVideos.slice(1); // All videos except the current one
    const queueLength = allVideos.length;
    
    res.status(200).json({
      current,
      queue,
      queueLength,
      upNext: Math.max(0, queueLength - 1),
    });
  } catch (error) {
    console.error('Error getting current video:', error);
    res.status(500).json({ error: 'Failed to get current video' });
  }
}

