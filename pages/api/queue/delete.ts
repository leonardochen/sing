import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteQueueEntry } from '@/lib/queue';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { id } = req.body;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Entry ID is required' });
    }
    
    const success = deleteQueueEntry(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting queue entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
}

