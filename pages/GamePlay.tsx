import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchGameDetailsFallback, getGameEmbedUrl } from '../services/gameApi';
import { Loader2, Maximize, Heart, Share2, Info, ArrowLeft, Gamepad2, AlertCircle, ScanFace, Smartphone, Monitor, RotateCw, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { useStore } from '../hooks/useStore';
import { GamePixItem } from '../types';
import { Helmet } from 'react-helmet';
import { VirtualController } from '../components/VirtualController';

export const GamePlay: React.FC = () => {
  const { namespace } = useParams<{ namespace: string }>();
  const location = useLocation();
  const { addGameToHistory, toggleGameFavorite, gameFavorites } = useStore();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showController, setShowController] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Data strategy: Use passed state if available (from click), else fallback fetch (from URL refresh)
  const initialGameData = location.state?.gameData as GamePixItem | undefined;

  const { data: fetchedGame, isLoading, error } = useQuery({
      queryKey: ['game-detail', namespace],
      queryFn: () => fetchGameDetailsFallback(namespace!),
      enabled: !initialGameData && !!namespace, 
      staleTime: 1000 * 60 * 60, // 1 hour
      retry: 1
  });

  // ANTI-FRAGILE STRATEGY:
  // Even if API fails, we construct a "Ghost" game object because the Embed URL 
  // only relies on the namespace which we already have in the URL.
  // This allows the game to play even if the metadata server is down.
  const game = initialGameData || fetchedGame;
  
  // Ghost Game Fallback for "Self-Healing"
  const displayTitle = game?.title || namespace || 'Game';
  const displayCategory = game?.category || 'Arcade';
  const displayDescription = game?.description || 'Thông tin trò chơi hiện chưa có sẵn do lỗi kết nối, nhưng bạn vẫn có thể chơi.';
  
  const isFavorite = gameFavorites.some(f => f.namespace === namespace);

  // Orientation Logic
  const [isPortraitMode, setIsPortraitMode] = useState(false);

  // Sync orientation when game data is loaded
  useEffect(() => {
    if (game) {
        if (game.orientation === 'portrait') {
            setIsPortraitMode(true);
        } else {
            setIsPortraitMode(false);
        }
    }
  }, [game]);

  // Add to History on mount if we have a valid namespace
  useEffect(() => {
      if (namespace) {
          addGameToHistory({
              namespace: namespace,
              title: game?.title || namespace,
              image: game?.banner_image || game?.image || 'https://placehold.co/100x100?text=Game',
              timestamp: Date.now()
          });
      }
  }, [game, namespace]);

  // Fullscreen Logic
  const handleFullscreen = () => {
      const elem = document.getElementById('game-frame-container');
      if (!elem) return;

      if (!document.fullscreenElement) {
          elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
      } else {
          document.exitFullscreen().then(() => setIsFullscreen(false));
      }
  };

  useEffect(() => {
      const handler = () => {
          setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handler);
      return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Show simplified loader only during initial fetch if no fallback exists
  if (isLoading && !game) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  // FATAL ERROR: Only if no namespace
  if (!namespace) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <h1 className="text-xl font-bold">Lỗi đường dẫn</h1>
              <Button onClick={() => window.history.back()} className="mt-4 gap-2"><ArrowLeft size={16}/> Quay lại</Button>
          </div>
      );
  }

  const embedUrl = getGameEmbedUrl(namespace);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0b0b0b] pb-24 md:pb-0">
        <Helmet>
            <title>{displayTitle} - Chơi Game Online | VinFlix</title>
            <meta name="description" content={`Chơi game ${displayTitle} miễn phí trên VinFlix. ${displayDescription.slice(0, 150)}...`} />
        </Helmet>

        {/* Virtual Controller Overlay */}
        {showController && <VirtualController onClose={() => setShowController(false)} />}

        {/* Game Container */}
        <div className="max-w-6xl mx-auto px-0 md:px-4 py-0 md:py-6">
            
            {/* API Warning Toast if running in Ghost Mode */}
            {error && !game && (
                <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 p-2 text-xs md:text-sm text-center mb-2 rounded mx-4 md:mx-0">
                    <Info size={14} className="inline mr-1" />
                    Không tải được thông tin game, nhưng hệ thống đã kích hoạt chế độ <strong>"Chơi Dự Phòng"</strong>.
                </div>
            )}

            {/* 
                RESPONSIVE CONTAINER LOGIC:
                - isFullscreen: Takes over entire screen.
                - isPortraitMode (True): Uses h-[75vh] (tall) to fit vertical games on phone.
                - isPortraitMode (False): Uses aspect-video (16:9) (wide) for standard landscape games.
            */}
            <div 
                id="game-frame-container" 
                className={`relative bg-black w-full overflow-hidden shadow-2xl transition-all duration-300
                ${isFullscreen 
                    ? 'h-screen flex items-center justify-center' 
                    : isPortraitMode 
                        ? 'h-[75vh] md:h-[85vh] md:w-auto md:aspect-[9/16] md:mx-auto md:rounded-xl' 
                        : 'aspect-video w-full md:rounded-xl'
                }`}
            >
                <iframe 
                    key={iframeKey} // Key change forces re-mount (Hard Reset)
                    src={embedUrl}
                    title={displayTitle}
                    className={`w-full h-full border-0 ${isFullscreen ? 'absolute inset-0' : ''}`}
                    allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; payment; ambient-light-sensor; microphone"
                    allowFullScreen
                    sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-presentation allow-scripts allow-same-origin"
                />
            </div>

            {/* Hint for "Rotate Device" error */}
            <div className="px-4 md:px-0 mt-2 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 p-2 rounded border border-orange-100 dark:border-orange-900/30">
                <RotateCw size={14} className="shrink-0" />
                <span>Mẹo: Nếu game hiện thông báo <strong>"Rotate Device"</strong> hoặc bị cắt màn hình, hãy thử chuyển <strong>Chế độ Dọc/Ngang</strong> hoặc <strong>Full màn hình</strong>.</span>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4 px-4 md:px-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Gamepad2 className="text-primary" /> {displayTitle}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-xs uppercase font-bold">{displayCategory}</span>
                        <span className="bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-xs uppercase font-bold">{isPortraitMode ? 'Dọc (Portrait)' : 'Ngang (Landscape)'}</span>
                        {game?.quality_score && <span>Rating: {Math.round(game.quality_score * 100)}%</span>}
                    </div>
                </div>

                {/* Optimized Mobile Grid / Desktop Flex */}
                <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:items-center">
                    
                    {/* ORIENTATION TOGGLE BUTTON */}
                    <Button 
                        onClick={() => setIsPortraitMode(!isPortraitMode)} 
                        variant="outline"
                        className="w-full md:w-auto justify-center gap-2 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Chuyển chế độ màn hình Dọc/Ngang"
                    >
                        {isPortraitMode ? <Monitor size={18} /> : <Smartphone size={18} />}
                        {isPortraitMode ? 'Chế độ Ngang' : 'Chế độ Dọc'}
                    </Button>

                    <Button 
                        onClick={() => toggleGameFavorite({ namespace: namespace!, title: displayTitle, image: game?.banner_image || '' })} 
                        variant="secondary"
                        className={`w-full md:w-auto justify-center gap-2 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                    >
                        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} /> {isFavorite ? 'Thích' : 'Thích'}
                    </Button>
                    
                    <Button 
                        onClick={() => setShowController(!showController)} 
                        variant={showController ? 'primary' : 'outline'}
                        className="w-full md:w-auto justify-center gap-2"
                    >
                        <ScanFace size={18} /> {showController ? 'Tắt Pad' : 'Bật Pad'}
                    </Button>

                    <Button onClick={handleFullscreen} className="w-full md:w-auto justify-center gap-2">
                        <Maximize size={18} /> Full
                    </Button>
                    
                    {/* HARD RESET BUTTON: Self-Healing mechanism for iframe hangs */}
                    <Button onClick={() => setIframeKey(k => k + 1)} variant="outline" className="hidden md:flex w-full md:w-auto justify-center gap-2" title="Tải lại game">
                        <RefreshCw size={18} /> Reload
                    </Button>
                </div>
            </div>

            {/* Description */}
            <div className="mt-8 px-4 md:px-0 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                     <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Info size={20} className="text-blue-500" /> Giới thiệu
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                            {displayDescription}
                        </p>
                     </div>
                </div>
                
                {/* Sidebar Info */}
                <div className="md:col-span-1 space-y-4">
                     <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                         <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Thông tin</h3>
                         <div className="space-y-3 text-sm">
                             <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                 <span className="text-gray-500">Phát hành</span>
                                 <span className="text-gray-900 dark:text-white font-medium">{game?.date_published ? new Date(game.date_published).toLocaleDateString() : 'N/A'}</span>
                             </div>
                             <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                 <span className="text-gray-500">Thể loại</span>
                                 <span className="text-gray-900 dark:text-white font-medium">{displayCategory}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-gray-500">Màn hình</span>
                                 <span className="text-gray-900 dark:text-white font-medium capitalize">{game?.orientation || 'Auto'}</span>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};