import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { QRCodeSVG } from 'qrcode.react';

interface QueueEntry {
  id: string;
  youtubeUrl: string;
  videoId: string;
  title: string;
  userName: string;
  addedAt: string;
}

interface QueueResponse {
  current: QueueEntry | null;
  queue: QueueEntry[];
  queueLength: number;
  upNext: number;
}

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function Splash() {
  const [currentVideo, setCurrentVideo] = useState<QueueEntry | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [upNext, setUpNext] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [playerError, setPlayerError] = useState(false);
  const [errorType, setErrorType] = useState<'embedding' | 'other'>('other');
  const [qrCodeUrl, setQrCodeUrl] = useState('https://sing.cogo1k.com/add');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const currentVideoIdRef = useRef<string | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const autoEnqueueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-enqueue a random song from the playlist
  const autoEnqueueSong = async () => {
    try {
      console.log('Auto-enqueueing random song from playlist...');
      const response = await fetch('/api/queue/auto-enqueue', { method: 'POST' });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auto-enqueued:', data.entry.title);
        // Fetch the updated queue
        await fetchCurrentVideo();
      } else {
        console.error('Failed to auto-enqueue');
      }
    } catch (error) {
      console.error('Error auto-enqueueing:', error);
    }
  };

  // Fetch current video from queue
  const fetchCurrentVideo = async () => {
    try {
      const response = await fetch('/api/queue/current');
      const data: QueueResponse = await response.json();
      
      // Check if queue length increased (user added a song)
      const oldQueueLength = queue.length;
      const newQueueLength = (data.queue || []).length + (data.current ? 1 : 0);
      
      setCurrentVideo(data.current);
      setQueue(data.queue || []);
      setUpNext(data.upNext);
      
      // If video changed, load it in player
      if (data.current && data.current.videoId !== currentVideoIdRef.current) {
        currentVideoIdRef.current = data.current.videoId;
        loadVideo(data.current.videoId);
        // Update activity time when a new video starts
        lastActivityTimeRef.current = Date.now();
      } else if (!data.current && currentVideoIdRef.current) {
        // Queue is empty - clear the player
        currentVideoIdRef.current = null;
        setPlayerError(false); // Clear any error state
        if (playerRef.current) {
          try {
            playerRef.current.stopVideo();
          } catch (e) {
            // Ignore errors when stopping player
          }
        }
      }
      
      // Reset activity time if queue length increased (user added a song)
      if (newQueueLength > oldQueueLength) {
        console.log('Queue length increased, resetting activity timer');
        lastActivityTimeRef.current = Date.now();
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching current video:', error);
      setIsLoading(false);
    }
  };

  // Remove current video from queue
  const removeCurrentVideo = async () => {
    try {
      await fetch('/api/queue/remove', { method: 'DELETE' });
      // Fetch the next video
      await fetchCurrentVideo();
    } catch (error) {
      console.error('Error removing video:', error);
    }
  };

  // Load video in YouTube player
  const loadVideo = (videoId: string) => {
    if (playerRef.current && videoId) {
      setPlayerError(false); // Reset error state
      playerRef.current.loadVideoById(videoId);
    }
  };

  // Open video in new window
  const openInNewWindow = () => {
    if (currentVideo) {
      window.open(currentVideo.youtubeUrl, '_blank', 'width=1280,height=720');
    }
  };

  // Handle manual next song
  const handleNextSong = async () => {
    setPlayerError(false);
    await removeCurrentVideo();
  };

  // Handle delete queue entry
  const handleDeleteEntry = async (id: string) => {
    try {
      const response = await fetch('/api/queue/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        // Refresh the queue
        await fetchCurrentVideo();
        setDeleteConfirmId(null);
      } else {
        console.error('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  // Initialize YouTube Player
  const initializePlayer = () => {
    if (!window.YT || !playerContainerRef.current) {
      return;
    }

    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      height: '100%',
      width: '100%',
      videoId: currentVideoIdRef.current || '',
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          console.log('Player ready');
          if (currentVideoIdRef.current) {
            event.target.playVideo();
          }
        },
        onStateChange: (event: any) => {
          // YT.PlayerState.ENDED = 0
          if (event.data === 0) {
            console.log('Video ended');
            removeCurrentVideo();
          }
        },
        onError: (event: any) => {
          const errorCode = event.data;
          console.log('Player error:', errorCode);
          
          // Error codes: 2 = Invalid ID, 5 = HTML5 error, 100 = Not found, 101/150 = Embedding disabled
          if (errorCode === 101 || errorCode === 150) {
            setPlayerError(true);
            setErrorType('embedding');
          } else {
            setPlayerError(true);
            setErrorType('other');
          }
        },
      },
    });
  };

  // Set QR code URL on client side
  useEffect(() => {
    setQrCodeUrl('https://sing.cogo1k.com/add');
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    // Load YouTube IFrame API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API ready');
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    // Initial fetch
    fetchCurrentVideo();

    // Poll every 5 seconds
    const interval = setInterval(fetchCurrentVideo, 5000);

    return () => {
      clearInterval(interval);
      if (autoEnqueueTimeoutRef.current) {
        clearTimeout(autoEnqueueTimeoutRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Check for idle time and auto-enqueue if needed
  useEffect(() => {
    const checkIdleTime = () => {
      const idleTime = Date.now() - lastActivityTimeRef.current;
      const threeMinutes = 3 * 60 * 1000; // 3 minutes in milliseconds
      
      // If idle for more than 3 minutes and queue is empty, auto-enqueue
      if (idleTime >= threeMinutes && !currentVideo && queue.length === 0) {
        console.log('Idle for 3+ minutes with empty queue, auto-enqueueing...');
        autoEnqueueSong();
        // Reset the activity time to prevent immediate re-enqueueing
        lastActivityTimeRef.current = Date.now();
      }
    };

    // Check immediately
    checkIdleTime();

    // Check for idle time every 30 seconds
    const idleCheckInterval = setInterval(checkIdleTime, 30000);

    return () => {
      clearInterval(idleCheckInterval);
    };
  }, [currentVideo, queue]);

  return (
    <>
      <Head>
        <title>Karaoke - Now Playing</title>
      </Head>
      
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Video Player */}
          <div className="flex-1 relative bg-black">
          <div 
            ref={playerContainerRef}
            className="absolute inset-0"
            style={{ display: playerError ? 'none' : 'block', visibility: currentVideo ? 'visible' : 'hidden' }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-2xl bg-black">
              Loading...
            </div>
          )}
          
          {!isLoading && !currentVideo && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-2xl bg-black">
              No videos in queue. Add some songs!
            </div>
          )}

          {/* Fallback UI for non-embeddable videos */}
          {playerError && currentVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
              <div className="text-center px-8 max-w-2xl">
                <div className="mb-8">
                  <svg className="w-24 h-24 mx-auto mb-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h2 className="text-4xl font-bold text-white mb-4">
                    {errorType === 'embedding' ? 'Video Cannot Be Embedded' : 'Video Error'}
                  </h2>
                  <p className="text-xl text-gray-300 mb-2">
                    {errorType === 'embedding' 
                      ? 'This video has embedding disabled by the owner' 
                      : 'This video could not be loaded'}
                  </p>
                  <p className="text-lg text-gray-400 mb-8">
                    Requested by: <span className="font-semibold text-white">{currentVideo.userName}</span>
                  </p>
                </div>

                <div className="space-y-6">
                  <button
                    onClick={openInNewWindow}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-3xl font-bold py-8 px-10 rounded-2xl shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    🎬 Open Video in New Window
                  </button>
                  
                  <button
                    onClick={handleNextSong}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-3xl font-bold py-8 px-10 rounded-2xl shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    ⏭️ Next Song
                  </button>
                </div>

                <p className="text-gray-500 text-sm mt-6">
                  After watching in the new window, click "Next Song" to continue
                </p>
              </div>
            </div>
          )}
          </div>

          {/* Queue Sidebar */}
          <div className="w-80 bg-gray-800 border-l-4 border-purple-500 overflow-y-auto flex flex-col">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600">
              <h3 className="text-sm font-bold text-white text-center">Up Next</h3>
            </div>
            
            <div className="p-2 space-y-2 flex-1">
              {queue.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  <p className="text-xs">Empty</p>
                </div>
              ) : (
                queue.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className="bg-gray-700 rounded p-2 border-l-2 border-pink-500 hover:bg-gray-600 transition-colors relative"
                  >
                    {deleteConfirmId === entry.id ? (
                      // Confirmation UI
                      <div className="flex flex-col gap-2">
                        <p className="text-white text-xs font-semibold text-center">Delete?</p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded font-semibold"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-xs py-1 px-2 rounded font-semibold"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Normal display
                      <div className="flex items-start gap-1">
                        <div className="flex-shrink-0 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white text-xs">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">
                            {entry.userName}
                          </p>
                          <p className="text-gray-400 text-xs truncate" title={entry.title}>
                            {entry.title}
                          </p>
                        </div>
                        <button
                          onClick={() => setDeleteConfirmId(entry.id)}
                          className="flex-shrink-0 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center text-xs font-bold transition-colors"
                          title="Delete entry"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* QR Code */}
            <div className="p-3 mt-auto">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-center mb-2">
                  <p className="text-sm font-bold text-gray-800">Add a Song!</p>
                </div>
                <div className="w-full flex justify-center">
                  <QRCodeSVG 
                    value={qrCodeUrl}
                    size={280}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#7c3aed"
                    className="w-full h-auto"
                    style={{ maxWidth: '280px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="bg-gray-800 text-white p-8">
          <div className="w-full px-8">
            {currentVideo ? (
              <div className="flex gap-6 items-stretch">
                {/* Logo - Click to add random song */}
                <div className="flex-shrink-0 flex items-center">
                  <img 
                    src="/link-ventures.png" 
                    alt="Link Ventures" 
                    className="h-20 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={autoEnqueueSong}
                    title="Click to add a random Christmas song"
                  />
                </div>
                
                {/* Current Song - Takes remaining space */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">🎵 Now Playing</h2>
                  <p className="text-xl text-gray-300 mb-1">
                    <span className="font-bold text-white">{currentVideo.title}</span>
                  </p>
                  <p className="text-lg text-gray-400">
                    Requested by: <span className="font-semibold text-pink-400">{currentVideo.userName}</span>
                  </p>
                </div>
                
                {/* Next Song - Fixed width */}
                <div className="w-80 flex flex-col justify-center items-center border-l-4 border-purple-500 pl-6">
                  {queue.length > 0 ? (
                    <>
                      <div className="text-center mb-3">
                        <p className="text-sm text-gray-400 mb-2">Up Next:</p>
                        <p className="text-lg text-white font-bold">{queue[0].title}</p>
                        <p className="text-sm text-pink-400">{queue[0].userName}</p>
                      </div>
                      <button
                        onClick={handleNextSong}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                      >
                        ⏭️ Next Song
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleNextSong}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                      ⏭️ Next Song
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex gap-6 items-center">
                {/* Logo - Click to add random song */}
                <div className="flex-shrink-0">
                  <img 
                    src="/link-ventures.png" 
                    alt="Link Ventures" 
                    className="h-20 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={autoEnqueueSong}
                    title="Click to add a random Christmas song"
                  />
                </div>
                
                <div className="flex-1 text-center">
                  <h2 className="text-3xl font-bold mb-2">Queue is Empty</h2>
                  <p className="text-xl text-gray-400">Waiting for songs to be added...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

