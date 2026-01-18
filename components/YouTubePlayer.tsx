import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Declaration for the YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate: (currentTime: number) => void;
  shouldPause: boolean;
  onPaused: () => void;
  onReady?: (duration: number) => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  videoId, 
  onTimeUpdate, 
  shouldPause,
  onPaused,
  onReady
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initializePlayer();
    } else {
      if (!window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = () => {
          if (window.YT) initializePlayer();
        };
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      } else {
        const oldCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (oldCallback) oldCallback();
          initializePlayer();
        };
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      if (playerRef.current) {
        try {
            playerRef.current.destroy();
        } catch(e) {
            console.warn("Error destroying player", e);
        }
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const initializePlayer = () => {
    if (playerRef.current) return;
    if (!containerRef.current) return;
    
    // Reset error state on new init
    setError(null);

    // Safe origin retrieval
    const origin = window.location.origin !== 'null' ? window.location.origin : undefined;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        playsinline: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        origin: origin,
      },
      events: {
        onReady: (event: any) => {
            setIsReady(true);
            const duration = event.target.getDuration();
            if (onReady) onReady(duration);
            
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            intervalRef.current = window.setInterval(() => {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                    const currentTime = playerRef.current.getCurrentTime();
                    onTimeUpdate(currentTime);
                }
            }, 500);
        },
        onError: (event: any) => {
          console.error("YouTube Player Error Code:", event.data);
          // Error 150 or 153 means restricted embedding (often due to domain)
          if (event.data === 150 || event.data === 153) {
            setError("Playback Restricted: This video cannot be played in this preview environment due to YouTube's embedding policies. Please deploy the app to a real domain (like Vercel/Netlify) to fix this.");
          } else if (event.data === 100 || event.data === 101) {
             setError("Video Not Found: This video might have been removed or is private.");
          } else {
             setError(`Player Error (${event.data}): Something went wrong with playback.`);
          }
        },
        onStateChange: (event: any) => {
             // Handle state changes if needed
        }
      }
    });
  };

  useEffect(() => {
    if (isReady && playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        if (shouldPause) {
            playerRef.current.pauseVideo();
            onPaused();
        }
    }
  }, [shouldPause, isReady, onPaused]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center z-10">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-white text-xl font-bold mb-2">Video Unavailable</h3>
          <p className="text-slate-300 max-w-md">{error}</p>
        </div>
      )}
    </div>
  );
};