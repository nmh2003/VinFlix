
import React from 'react';
import { Link } from 'react-router-dom';
import { Comic } from '../types';
import { getComicImageUrl } from '../services/comicApi';
import { BookOpen } from 'lucide-react';

interface ComicCardProps {
  comic: Comic;
  domainImage?: string;
}

// OPTIMIZATION: Memoize to prevent unnecessary re-renders in large lists
export const ComicCard: React.FC<ComicCardProps> = React.memo(({ comic, domainImage }) => {
  const thumbSrc = getComicImageUrl(comic.thumb_url, domainImage);
  const latestChap = comic.chaptersLatest && comic.chaptersLatest.length > 0 ? comic.chaptersLatest[0].chapter_name : null;

  return (
    <Link to={`/truyen/${comic.slug}`} className="group relative block rounded-md md:rounded-lg overflow-hidden bg-white shadow-sm dark:bg-gray-800 dark:shadow-none transition-colors duration-300">
      <div className="aspect-[2/3] overflow-hidden relative">
        <img 
          src={thumbSrc} 
          alt={comic.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x450/1f1f1f/e5e5e5?text=No+Cover'; }}
        />
        
        {/* Overlay */}
        <div className="hidden md:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        
        {/* Status Badge */}
        <div className={`absolute top-1 left-1 md:top-2 md:left-2 text-[9px] md:text-xs px-1.5 py-0.5 rounded shadow-sm text-white font-bold tracking-wide z-10 ${comic.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'}`}>
          {comic.status === 'completed' ? 'Full' : 'On-going'}
        </div>
        
        {/* Latest Chapter Badge OR No Chapter Badge */}
        {latestChap ? (
           <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-yellow-600 text-white text-[9px] md:text-xs px-1.5 py-0.5 rounded shadow-sm max-w-[85%] truncate z-10 font-medium">
             Chap {latestChap}
           </div>
        ) : (
           <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-gray-600 text-white text-[9px] md:text-xs px-1.5 py-0.5 rounded shadow-sm z-10 font-medium opacity-90">
             Sắp có
           </div>
        )}
      </div>
      
      <div className="p-2">
        {/* UPDATED: line-clamp-3 for mobile, md:line-clamp-2 for desktop. Removed h-[2.5em] to fit content exactly. */}
        <h3 className="text-gray-900 dark:text-white font-medium text-[10px] md:text-sm line-clamp-3 md:line-clamp-2 leading-tight" title={comic.name}>
          {comic.name}
        </h3>
        <div className="flex flex-wrap gap-1 mt-1">
             {comic.category.slice(0, 2).map((cat, i) => (
                 <span key={i} className="text-[9px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 rounded">
                     {cat.name}
                 </span>
             ))}
        </div>
      </div>
    </Link>
  );
});
