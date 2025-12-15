import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

interface QueueEntry {
  id: string;
  youtubeUrl: string;
  videoId: string;
  userName: string;
  addedAt: string;
}

interface QueueResponse {
  current: QueueEntry | null;
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
  const [upNext, setUpNext] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [playerError, setPlayerError] = useState(false);
  const [errorType, setErrorType] = useState<'embedding' | 'other'>('other');
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const currentVideoIdRef = useRef<string | null>(null);

  // Fetch current video from queue
  const fetchCurrentVideo = async () => {
    try {
      const response = await fetch('/api/queue/current');
      const data: QueueResponse = await response.json();
      
      setCurrentVideo(data.current);
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

                <div className="space-y-4">
                  <button
                    onClick={openInNewWindow}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-2xl font-bold py-6 px-8 rounded-xl shadow-2xl transition-all duration-200 transform hover:scale-105"
                  >
                    🎬 Open Video in New Window
                  </button>
                  
                  <button
                    onClick={handleNextSong}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-2xl font-bold py-6 px-8 rounded-xl shadow-2xl transition-all duration-200 transform hover:scale-105"
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

        {/* Info Bar */}
        <div className="bg-gray-800 text-white p-6">
          <div className="max-w-4xl mx-auto">
            {currentVideo ? (
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Now Playing</h2>
                  <p className="text-lg text-gray-300">
                    Requested by: <span className="font-semibold">{currentVideo.userName}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg text-gray-400">
                    Up next: <span className="text-2xl font-bold text-white">{upNext}</span> {upNext === 1 ? 'song' : 'songs'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">Queue is Empty</h2>
                <p className="text-gray-400">Waiting for songs to be added...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

