import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const QUEUE_FILE_PATH = path.join(process.cwd(), 'queue.txt');

export interface QueueEntry {
  id: string;
  youtubeUrl: string;
  videoId: string;
  title: string;
  userName: string;
  addedAt: string;
}

/**
 * Extracts the video ID from a YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Standard youtube.com watch URL
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v');
    }
    
    // Short youtu.be URL
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    // Embed URL
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.includes('/embed/')) {
      return urlObj.pathname.split('/embed/')[1]?.split('?')[0];
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Reads all entries from the queue file
 */
export function readQueue(): QueueEntry[] {
  try {
    if (!fs.existsSync(QUEUE_FILE_PATH)) {
      return [];
    }
    
    const content = fs.readFileSync(QUEUE_FILE_PATH, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    console.error('Error reading queue:', error);
    return [];
  }
}

/**
 * Writes all entries to the queue file
 */
function writeQueue(entries: QueueEntry[]): void {
  const content = entries.map(entry => JSON.stringify(entry)).join('\n');
  fs.writeFileSync(QUEUE_FILE_PATH, content + (entries.length > 0 ? '\n' : ''), 'utf-8');
}

/**
 * Gets the current (first) video in the queue
 */
export function getCurrentVideo(): QueueEntry | null {
  const queue = readQueue();
  return queue.length > 0 ? queue[0] : null;
}

/**
 * Gets all videos in the queue
 */
export function getAllVideos(): QueueEntry[] {
  return readQueue();
}

/**
 * Fetches video metadata from YouTube oEmbed API
 */
export async function fetchVideoMetadata(youtubeUrl: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.title || null;
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return null;
  }
}

/**
 * Adds a new video to the end of the queue
 */
export async function addToQueue(youtubeUrl: string, userName: string): Promise<QueueEntry> {
  const videoId = extractVideoId(youtubeUrl);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }
  
  // Try to fetch the video title from oEmbed
  const title = await fetchVideoMetadata(youtubeUrl) || videoId;
  
  const entry: QueueEntry = {
    id: randomUUID(),
    youtubeUrl,
    videoId,
    title,
    userName,
    addedAt: new Date().toISOString(),
  };
  
  const queue = readQueue();
  queue.push(entry);
  writeQueue(queue);
  
  return entry;
}

/**
 * Removes the current (first) video from the queue
 */
export function removeCurrentVideo(): QueueEntry | null {
  const queue = readQueue();
  
  if (queue.length === 0) {
    return null;
  }
  
  const removed = queue.shift()!;
  writeQueue(queue);
  
  return removed;
}

/**
 * Gets the number of videos in the queue
 */
export function getQueueLength(): number {
  return readQueue().length;
}

/**
 * Deletes a specific video from the queue by ID
 */
export function deleteQueueEntry(id: string): boolean {
  const queue = readQueue();
  const initialLength = queue.length;
  const updatedQueue = queue.filter(entry => entry.id !== id);
  
  if (updatedQueue.length === initialLength) {
    return false; // Entry not found
  }
  
  writeQueue(updatedQueue);
  return true;
}

