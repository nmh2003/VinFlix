
import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

// --- Dynamic Imports Helper ---
const getModule = (mod: any) => (mod && mod.default) ? mod.default : mod;

// Strictly limited supported types based on stability
export type PlayerType = 'oplayer' | 'embed' | 'videojs' | 'shaka' | 'reactplayer' | 'xgplayer';

interface VideoPlayerProps {
  srcM3u8?: string;
  srcEmbed?: string;
  poster?: string;
  autoPlay?: boolean;
  playerType: PlayerType;
  onEnded?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
  initialTime?: number;
  onFatalError?: () => void;
}

interface PlayerRef {
  seek: (time: number) => void;
  pause: () => void;
  play: () => void;
}

// ============================================================================
// 1. OPLAYER (Dynamic)
// ============================================================================
const OPlayerComponent = forwardRef<PlayerRef, any>(({ srcM3u8, poster, autoPlay, onEnded, onProgress, onError, initialTime }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const callbacks = useRef({ onEnded, onProgress, onError });
  const [loadError, setLoadError] = useState(false);
  
  useEffect(() => { callbacks.current = { onEnded, onProgress, onError }; }, [onEnded, onProgress, onError]);

  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      if (playerRef.current) {
        try { 
          playerRef.current.seek(time); 
          if(autoPlay) playerRef.current.play();
        } catch(e) {}
      }
    },
    pause: () => { if(playerRef.current) try { playerRef.current.pause(); } catch(e) {} },
    play: () => { if(playerRef.current) try { playerRef.current.play(); } catch(e) {} }
  }));

  useEffect(() => {
    let mounted = true;
    let player: any = null;

    const init = async () => {
        if (!srcM3u8) return;
        try {
            const [Core, UI, HLS] = await Promise.all([
                import('@oplayer/core'),
                import('@oplayer/ui'),
                import('@oplayer/hls')
            ]);

            if (!mounted) return;
            
            // CRITICAL CHECK: Check container existence strictly right before usage
            if (!containerRef.current) {
                // Container missing means component unmounted or ref failed. Abort.
                return;
            }

            const OPlayer = getModule(Core);
            const OPlayerUI = getModule(UI);
            const OPlayerHLS = getModule(HLS);

            if (playerRef.current) try { playerRef.current.destroy(); } catch(e) {}

            // Double check before 'make'
            if (!containerRef.current) return;

            player = OPlayer.make(containerRef.current, {
                source: { src: srcM3u8, poster: poster, format: 'hls' },
                autoplay: autoPlay, 
                isLive: false,
                videoAttr: { crossOrigin: 'anonymous', playsInline: true, preload: 'auto' }
            }).use([
                OPlayerUI({ theme: { primaryColor: '#e50914' }, pictureInPicture: true, screenshot: false, keyboard: { global: true } }),
                OPlayerHLS({ forceHLS: true, options: { maxMaxBufferLength: 30, enableWorker: true, manifestLoadingMaxRetry: 3, levelLoadingMaxRetry: 3, fragLoadingMaxRetry: 4 } })
            ]);

            player.create();
            playerRef.current = player;

            if (initialTime && initialTime > 0) {
                player.seek(initialTime);
            }

            player.on('ended', () => { if(callbacks.current.onEnded) callbacks.current.onEnded(); });
            player.on('timeupdate', () => { 
                try {
                    if(callbacks.current.onProgress && player.currentTime) {
                       const curr = player.currentTime;
                       const dur = player.duration;
                       if (Number.isFinite(curr) && Number.isFinite(dur)) callbacks.current.onProgress(curr, dur); 
                    }
                } catch(e) {}
            });
            player.on('error', (e: any) => {
                 if (e && e.payload && e.payload.fatal) {
                     if (e.payload.type === 'mediaError') {
                         if(player.hls) player.hls.recoverMediaError();
                     } else {
                         if(callbacks.current.onError) callbacks.current.onError();
                     }
                 }
            });

        } catch (e) {
            console.error("OPlayer Load Failed", e);
            if(mounted) { setLoadError(true); if(callbacks.current.onError) callbacks.current.onError(); }
        }
    };
    init();
    return () => { mounted = false; if (player) try { player.destroy(); } catch(e) {} };
  }, [srcM3u8]); 

  if (loadError) return <div className="text-white flex justify-center items-center h-full bg-black"><Loader2 className="animate-spin text-red-600" /></div>;
  return <div ref={containerRef} className="w-full h-full bg-black oplayer-wrapper" />;
});

// ============================================================================
// 2. SHAKA PLAYER (Dynamic)
// ============================================================================
const ShakaPlayerComponent = forwardRef<PlayerRef, any>(({ srcM3u8, poster, autoPlay, onEnded, onProgress, onError, initialTime }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null); 
  const uiRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const [loadError, setLoadError] = useState(false);

  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        if (autoPlay) videoRef.current.play().catch(() => {});
      }
    },
    pause: () => { if(videoRef.current) videoRef.current.pause(); },
    play: () => { if(videoRef.current) videoRef.current.play().catch(()=>{}); }
  }));

  useEffect(() => {
    isMountedRef.current = true;
    const videoElement = videoRef.current;
    const containerElement = containerRef.current;
    if (!videoElement || !containerElement || !srcM3u8) return;

    const initPlayer = async () => {
      try {
        // @ts-ignore
        const shakaModule = await import('shaka-player');
        const Shaka = getModule(shakaModule) || (window as any).shaka;
        
        if (!Shaka) throw new Error("Shaka lib missing");
        if (Shaka.Polyfill) Shaka.Polyfill.installAll();

        if (!isMountedRef.current) return;
        if (!videoElement) return; // Defensive check

        const player = new Shaka.Player(videoElement);
        playerRef.current = player;
        player.configure({
            streaming: {
                retryParameters: { maxAttempts: 4, baseDelay: 1000, backoffFactor: 2, fuzzFactor: 0.5, timeout: 10000 },
                bufferingGoal: 30, rebufferingGoal: 5
            }
        });

        player.addEventListener('error', (event: any) => {
            if (event.detail && event.detail.severity === 2 && onError && isMountedRef.current) onError();
        });

        if (Shaka.ui && Shaka.ui.Overlay) {
             // Ensure container is still valid
             if (containerElement && containerElement.isConnected) {
                 const ui = new Shaka.ui.Overlay(player, containerElement, videoElement);
                 ui.configure({
                    controlPanelElements: ['play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 'fullscreen', 'overflow_menu'],
                    overflowMenuButtons: ['quality', 'language', 'picture_in_picture', 'playback_rate'],
                 });
                 uiRef.current = ui;
             }
        }

        const onTime = () => {
            try {
                if (videoElement && onProgress && isMountedRef.current) {
                    if (Number.isFinite(videoElement.currentTime) && Number.isFinite(videoElement.duration)) {
                       onProgress(videoElement.currentTime, videoElement.duration);
                    }
                }
            } catch (e) {}
        };
        videoElement.addEventListener('ended', () => onEnded && isMountedRef.current && onEnded());
        videoElement.addEventListener('timeupdate', onTime);
        
        await player.load(srcM3u8);
        
        if (initialTime && initialTime > 0) {
            videoElement.currentTime = initialTime;
        }
        
        if (autoPlay && isMountedRef.current) videoElement.play().catch(() => {});

      } catch (e) { 
          console.error("Shaka Load Failed", e);
          if (isMountedRef.current) {
             setLoadError(true);
             if(onError) onError();
          }
      }
    };

    initPlayer();
    return () => {
        isMountedRef.current = false;
        const cleanup = async () => {
            if (uiRef.current) try { await uiRef.current.destroy(); } catch(e) {}
            if (playerRef.current) try { await playerRef.current.destroy(); } catch(e) {}
        };
        cleanup();
    };
  }, [srcM3u8]);

  if (loadError) return <div className="text-white flex justify-center items-center h-full bg-black"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <div ref={containerRef} className="w-full h-full relative group bg-black shaka-video-container">
      <video ref={videoRef} className="w-full h-full" poster={poster} playsInline crossOrigin="anonymous" />
    </div>
  );
});

// ============================================================================
// 3. VIDEO.JS (Dynamic)
// ============================================================================
const VideoJSPlayer = forwardRef<PlayerRef, any>(({ srcM3u8, poster, autoPlay, onEnded, onProgress, onError, initialTime }, ref) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const callbacks = useRef({ onEnded, onProgress, onError });
  const [loadError, setLoadError] = useState(false);
  
  useEffect(() => { callbacks.current = { onEnded, onProgress, onError }; }, [onEnded, onProgress, onError]);

  useImperativeHandle(ref, () => ({
    seek: (time: number) => { if (playerRef.current) try { playerRef.current.currentTime(time); if(autoPlay) playerRef.current.play(); } catch(e) {} },
    pause: () => { if(playerRef.current) playerRef.current.pause(); },
    play: () => { if(playerRef.current) playerRef.current.play(); }
  }));

  useEffect(() => {
    if (!videoRef.current) return;
    
    let player: any;
    let mounted = true;

    const init = async () => {
        try {
            // @ts-ignore
            const vjsModule = await import('video.js');
            const videojs = getModule(vjsModule);

            if (!mounted) return;
            // CRITICAL CHECK: ref must exist
            if (!videoRef.current) return;

            videoRef.current.innerHTML = '';
            const videoElement = document.createElement("video-js");
            videoElement.classList.add("vjs-big-play-centered", "w-full", "h-full");
            videoRef.current.appendChild(videoElement);

            player = videojs(videoElement, {
                autoplay: autoPlay, controls: true, responsive: true, fluid: true, poster: poster,
                sources: [{ src: srcM3u8, type: 'application/x-mpegURL' }],
                html5: { hls: { overrideNative: true, enableLowInitialPlaylist: true } }
            });
            playerRef.current = player;
            
            if (initialTime && initialTime > 0) {
                player.ready(() => player.currentTime(initialTime));
            }

            player.on('ended', () => callbacks.current.onEnded && callbacks.current.onEnded());
            player.on('timeupdate', () => { if (callbacks.current.onProgress && !player.isDisposed()) callbacks.current.onProgress(player.currentTime(), player.duration()); });
            player.on('error', () => callbacks.current.onError && callbacks.current.onError());

        } catch (e) {
            console.error("VideoJS Load Failed", e);
            if(mounted) {
                setLoadError(true);
                if (callbacks.current.onError) callbacks.current.onError();
            }
        }
    }

    init();

    return () => { 
        mounted = false;
        if (player && !player.isDisposed()) try { player.dispose(); } catch(e) {} 
    };
  }, [srcM3u8]); 

  if (loadError) return <div className="text-white flex justify-center items-center h-full bg-black"><Loader2 className="animate-spin text-red-600" /></div>;
  return <div ref={videoRef} className="w-full h-full" />;
});

// ============================================================================
// 4. REACT PLAYER (Dynamic)
// ============================================================================
const ReactPlayerComponent = forwardRef<PlayerRef, any>(({ srcM3u8, poster, autoPlay, onEnded, onProgress, onError, initialTime }, ref) => {
  const playerRef = useRef<any>(null);
  const callbacks = useRef({ onEnded, onProgress, onError });
  const hasSeeked = useRef(false);
  const [RP, setRP] = useState<any>(null);
  
  useEffect(() => { callbacks.current = { onEnded, onProgress, onError }; }, [onEnded, onProgress, onError]);
  
  useImperativeHandle(ref, () => ({
    seek: (time: number) => { if (playerRef.current) try { playerRef.current.seekTo(time, 'seconds'); } catch(e) {} },
    pause: () => {}, play: () => {}
  }));

  useEffect(() => {
      import('react-player').then(mod => {
          setRP(() => getModule(mod));
      }).catch(e => {
          console.error("ReactPlayer Load Failed", e);
          if(onError) onError();
      });
  }, []);

  if (!RP) return <div className="text-white flex justify-center items-center h-full bg-black"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="w-full h-full bg-black relative">
       <RP
          ref={playerRef}
          url={srcM3u8}
          playing={autoPlay}
          controls={true}
          width="100%"
          height="100%"
          onEnded={() => callbacks.current.onEnded && callbacks.current.onEnded()}
          onError={(e: any, data: any) => { if (data && data.fatal === false) return; if(callbacks.current.onError) callbacks.current.onError(); }}
          onProgress={(state: any) => {
             // Hacky way to handle initial seek for ReactPlayer
             if (initialTime && initialTime > 0 && !hasSeeked.current && state.loadedSeconds > 0) {
                 playerRef.current.seekTo(initialTime);
                 hasSeeked.current = true;
             }
             if (callbacks.current.onProgress) callbacks.current.onProgress(state.playedSeconds, state.loadedSeconds);
          }}
          config={{ file: { attributes: { poster: poster, crossOrigin: "anonymous", playsInline: true }, hlsOptions: { enableWorker: true } } }}
       />
    </div>
  );
});

// ============================================================================
// 5. XGPLAYER (Dynamic - New)
// ============================================================================
const XGPlayerComponent = forwardRef<PlayerRef, any>(({ srcM3u8, poster, autoPlay, onEnded, onProgress, onError, initialTime }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const callbacks = useRef({ onEnded, onProgress, onError });
  const [loadError, setLoadError] = useState(false);

  useEffect(() => { callbacks.current = { onEnded, onProgress, onError }; }, [onEnded, onProgress, onError]);

  useImperativeHandle(ref, () => ({
    seek: (time: number) => { if (playerRef.current) playerRef.current.currentTime = time; },
    pause: () => { if (playerRef.current) playerRef.current.pause(); },
    play: () => { if (playerRef.current) playerRef.current.play(); }
  }));

  useEffect(() => {
    if (!containerRef.current || !srcM3u8) return;
    let player: any;
    let mounted = true;

    const init = async () => {
      try {
        const [XGPlayer, HlsPlugin] = await Promise.all([
             import('xgplayer'),
             import('xgplayer-hls')
        ]);
        
        const Player = getModule(XGPlayer);
        const Hls = getModule(HlsPlugin);

        if (!mounted) return;
        
        // Cleanup previous
        if (containerRef.current) containerRef.current.innerHTML = '';
        
        // Config: https://v2.h5player.bytedance.com/en/config/
        player = new Player({
          el: containerRef.current,
          url: srcM3u8,
          poster: poster,
          autoplay: autoPlay,
          height: '100%',
          width: '100%',
          playbackRate: [0.5, 0.75, 1, 1.5, 2],
          pip: true,
          cssFullscreen: true,
          lang: 'vi',
          volume: 0.7,
          playsinline: true,
          plugins: [Hls], // Use HLS plugin for wider compatibility
        });
        
        playerRef.current = player;

        if (initialTime && initialTime > 0) {
            player.once('ready', () => {
                player.currentTime = initialTime;
            });
        }

        player.on('ended', () => callbacks.current.onEnded && callbacks.current.onEnded());
        player.on('timeupdate', () => {
             if (callbacks.current.onProgress) callbacks.current.onProgress(player.currentTime, player.duration);
        });
        player.on('error', (e: any) => {
             console.error("XGPlayer Error", e);
             if (callbacks.current.onError) callbacks.current.onError();
        });

      } catch (e) {
        console.error("XGPlayer init failed", e);
        if (mounted) {
            setLoadError(true);
            if(callbacks.current.onError) callbacks.current.onError();
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (player) player.destroy();
    };
  }, [srcM3u8]);

  if (loadError) return <div className="text-white flex justify-center items-center h-full bg-black"><Loader2 className="animate-spin text-red-600" /></div>;
  return <div ref={containerRef} className="w-full h-full bg-black xgplayer-wrapper" />;
});


const EmbedPlayer: React.FC<{ srcEmbed?: string }> = ({ srcEmbed }) => {
  if (!srcEmbed) return <div className="flex items-center justify-center h-full text-gray-500 bg-black">Embed không khả dụng</div>;
  return <iframe src={srcEmbed} className="w-full h-full border-0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title="Embedded Video" />;
};


// ============================================================================
// MAIN CONTROLLER
// ============================================================================
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  srcM3u8, srcEmbed, poster, autoPlay = false, playerType, 
  onEnded, onProgress, initialTime = 0, onFatalError
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [key, setKey] = useState(0); 
  const activePlayerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    setRetryCount(0);
    setIsRecovering(false);
    setKey(k => k + 1);
  }, [srcM3u8, srcEmbed, playerType]); 

  const handleInternalError = useCallback(() => {
    if (playerType === 'embed') return; 
    if (isRecovering) return; 

    console.warn(`VideoPlayer: Error detected on ${playerType}. Attempting recovery...`);
    setIsRecovering(true);

    setTimeout(() => {
        if (retryCount < 2) {
            setRetryCount(prev => prev + 1);
            setKey(prev => prev + 1); 
            setIsRecovering(false);
        } else {
            setIsRecovering(false);
            if (onFatalError) onFatalError(); 
        }
    }, 1500); 
  }, [retryCount, playerType, onFatalError, isRecovering]);

  const renderActivePlayer = () => {
    if (isRecovering) {
       return (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
            <p className="text-gray-400 text-sm">Đang tự động khắc phục lỗi...</p>
         </div>
       );
    }

    if ((!srcM3u8 && playerType !== 'embed') || playerType === 'embed') {
       return <EmbedPlayer srcEmbed={srcEmbed} />;
    }

    const commonProps = {
      key: `${playerType}-${key}`, 
      srcM3u8, poster, autoPlay, onEnded, onProgress, 
      initialTime, // Pass purely for auto-seek on mount
      onError: handleInternalError,
      ref: activePlayerRef
    };

    switch (playerType) {
      case 'oplayer': return <OPlayerComponent {...commonProps} />;
      case 'shaka': return <ShakaPlayerComponent {...commonProps} />;
      case 'videojs': return <VideoJSPlayer {...commonProps} />;
      case 'reactplayer': return <ReactPlayerComponent {...commonProps} />;
      case 'xgplayer': return <XGPlayerComponent {...commonProps} />;
      default: return <EmbedPlayer srcEmbed={srcEmbed} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-black group overflow-hidden rounded-lg">
        {renderActivePlayer()}
    </div>
  );
};
