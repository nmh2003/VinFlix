import React from 'react';
import { Link } from 'react-router-dom';
import { GamePixItem } from '../types';
import { Gamepad2, Zap, Play } from 'lucide-react';

interface GameCardProps {
  game: GamePixItem;
  className?: string; // For grid spans (col-span-x, row-span-y)
  variant?: 'default' | 'bento'; // 'bento' style has text overlay and fills height
}

// OPTIMIZATION: Memoize to reduce re-render cost in the massive Game Catalog grid
export const GameCard: React.FC<GameCardProps> = React.memo(({ game, className = '', variant = 'default' }) => {
  // GamePix API returns pre-sized image URLs in the feed, so we use them directly.
  // Fallback to 'image' (icon) if banner is missing.
  const thumbSrc = game.banner_image || game.image;
  const isBento = variant === 'bento';

  return (
    <Link 
        to={`/game/${game.namespace}`} 
        state={{ gameData: game }} // Pass data to avoid re-fetch on detail page
        className={`group relative block overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-all duration-300 hover:shadow-lg ${isBento ? 'rounded-xl h-full' : 'rounded-md md:rounded-lg flex flex-col h-full'} ${className}`}
    >
      {/* Container logic: Bento fills parent, Default uses flex-col to fill height properly */}
      <div className={`relative overflow-hidden w-full ${isBento ? 'h-full' : 'aspect-[4/3] md:aspect-[4/3]'}`}>
        <img 
          src={thumbSrc} 
          alt={game.title} 
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isBento ? 'absolute inset-0' : ''}`}
          loading="lazy"
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/320x240/1f1f1f/e5e5e5?text=Game'; }}
        />
        
        {/* Overlay / Hover Effect */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${isBento ? 'opacity-0 group-hover:opacity-100 z-10' : 'opacity-0 group-hover:opacity-100 hidden md:flex'}`}>
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
             {isBento ? <Play className="w-6 h-6 text-white ml-1" fill="currentColor"/> : <Gamepad2 className="w-6 h-6 text-white" />}
          </div>
        </div>
        
        {/* Quality Badge */}
        {game.quality_score > 0.8 && (
           <div className="absolute top-2 right-2 z-20 bg-yellow-500 text-white text-[10px] md:text-xs px-1.5 py-0.5 rounded shadow-sm font-bold flex items-center gap-0.5">
             <Zap size={10} fill="currentColor" /> {Math.round(game.quality_score * 100)}%
           </div>
        )}

        {/* Bento Text Overlay (Permanent Gradient at bottom) */}
        {isBento && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-10 flex flex-col justify-end">
                <h3 className="text-white font-bold text-base md:text-lg leading-tight shadow-black drop-shadow-md">
                    {game.title}
                </h3>
                <span className="text-gray-300 text-xs mt-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full w-fit">
                    {game.category}
                </span>
            </div>
        )}
      </div>
      
      {/* Default Text Below (Only for non-Bento) */}
      {!isBento && (
        <div className="px-2 py-1.5 md:p-3 flex-1 flex flex-col justify-between">
            <h3 className="text-gray-900 dark:text-white font-medium text-[11px] md:text-sm line-clamp-2 leading-tight h-[2.5em] md:h-auto" title={game.title}>
            {game.title}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1 items-center justify-between">
                <span className="text-[9px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded capitalize truncate max-w-full">
                    {game.category}
                </span>
            </div>
        </div>
      )}
    </Link>
  );
});