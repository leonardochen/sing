import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { QRCodeSVG } from 'qrcode.react';

interface QueueEntry {
  id: string;
  youtubeUrl: string;
  videoId: string;
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
  const [qrCodeUrl, setQrCodeUrl] = useState('/add');
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const currentVideoIdRef = useRef<string | null>(null);

  // Fetch current video from queue
  const fetchCurrentVideo = async () => {
    try {
      const response = await fetch('/api/queue/current');
      const data: QueueResponse = await response.json();
      
      setCurrentVideo(data.current);
      setQueue(data.queue || []);
      setUpNext(data.upNext);
      
      // If video changed, load it in player
      if (data.current && data.current.videoId !== currentVideoIdRef.current) {
        currentVideoIdRef.current = data.current.videoId;
        loadVideo(data.current.videoId);
      } else if (!data.current && currentVideoIdRef.current) {
        // Queue is empty
        currentVideoIdRef.current = null;
        if (playerRef.current) {
          playerRef.current.stopVideo();
        }
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
    setQrCodeUrl(`${window.location.origin}/add`);
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
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

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
            style={{ display: playerError ? 'none' : 'block' }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-2xl">
              Loading...
            </div>
          )}
          
          {!isLoading && !currentVideo && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-2xl">
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
          <div className="w-40 bg-gray-800 border-l-4 border-purple-500 overflow-y-auto">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600">
              <h3 className="text-sm font-bold text-white text-center">Up Next</h3>
            </div>
            
            <div className="p-2 space-y-2">
              {queue.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  <p className="text-xs">Empty</p>
                </div>
              ) : (
                queue.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className="bg-gray-700 rounded p-2 border-l-2 border-pink-500 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start gap-1">
                      <div className="flex-shrink-0 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">
                          {entry.userName}
                        </p>
                        <p className="text-gray-400 text-xs truncate" title={entry.videoId}>
                          {entry.videoId.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="bg-gray-800 text-white p-8 relative">
          <div className="max-w-6xl mx-auto">
            {currentVideo ? (
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-2">🎵 Now Playing</h2>
                  <p className="text-xl text-gray-300">
                    Requested by: <span className="font-semibold text-pink-400">{currentVideo.userName}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl text-gray-400">
                    Up next: <span className="text-3xl font-bold text-white">{upNext}</span> {upNext === 1 ? 'song' : 'songs'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Queue is Empty</h2>
                <p className="text-xl text-gray-400">Waiting for songs to be added...</p>
              </div>
            )}
          </div>

          {/* QR Code Footer */}
          <div className="absolute bottom-4 right-4 bg-white p-4 rounded-2xl shadow-2xl border-4 border-purple-500">
            <div className="text-center mb-2">
              <p className="text-sm font-bold text-gray-800">Add a Song!</p>
              <p className="text-xs text-gray-600">Scan to join</p>
            </div>
            <QRCodeSVG 
              value={qrCodeUrl}
              size={128}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#7c3aed"
            />
          </div>
        </div>
      </div>
    </>
  );
}

