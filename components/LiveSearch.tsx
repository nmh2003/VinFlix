
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Loader2, Film, BookOpen, X, ChevronRight, Zap } from 'lucide-react';
import { searchMovies, getImageUrl } from '../services/api';
import { searchComics, getComicImageUrl } from '../services/comicApi';

interface LiveSearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

const FALLBACK_IMAGE = 'https://yt3.googleusercontent.com/n--_Eh0Xsi4GX-AYU5n6jyIjx_KqEPnmvJFjoLr68b-5CVOCpFgvBVEVH3IM_uLTCoQ8DDjE=s900-c-k-c0x00ffffff-no-rj';

export const LiveSearch: React.FC<LiveSearchProps> = ({ placeholder, onSearch, className = '' }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<{ movies: any[]; comics: any[] }>({ movies: [], comics: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch logic
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ movies: [], comics: [] });
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setIsOpen(true);
      try {
        const [movieRes, comicRes] = await Promise.allSettled([
          searchMovies(debouncedQuery, 6),
          searchComics(debouncedQuery, 1)
        ]);

        const movies = movieRes.status === 'fulfilled' ? (movieRes.value as any)?.data?.items || [] : [];
        const comics = comicRes.status === 'fulfilled' ? (comicRes.value as any)?.data?.items || [] : [];

        setResults({ movies, comics });
      } catch (error) {
        console.error("Live Search Error", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(false);
      onSearch(query);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
  };

  const hasResults = results.movies.length > 0 || results.comics.length > 0;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm rounded-full py-2 px-4 pr-10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
          value={query}
          onChange={(e) => {
             setQuery(e.target.value);
             if(e.target.value.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if(query.trim()) setIsOpen(true); }}
        />
        {isLoading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 size={16} className="animate-spin text-primary" />
          </div>
        ) : query ? (
           <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
             <X size={16} />
           </button>
        ) : (
           <button onClick={() => onSearch(query)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
             <Search size={16} />
           </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && debouncedQuery && (
        <div className="absolute top-full right-0 mt-2 w-[90vw] md:w-[450px] max-h-[80vh] overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
           
           {!isLoading && !hasResults && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Search size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Không tìm thấy kết quả nào cho "{debouncedQuery}"</p>
              </div>
           )}

           {/* Movies Section */}
           {results.movies.length > 0 && (
              <div className="p-2">
                 <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-2">
                    <Film size={14} className="text-red-500" /> Phim
                 </div>
                 {results.movies.map((movie) => {
                    const posterSrc = getImageUrl(movie.poster_url);
                    
                    return (
                    <Link 
                      key={movie._id} 
                      to={`/phim/${movie.slug}`} 
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                       <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-sm relative">
                           <img 
                              src={posterSrc} 
                              alt={movie.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => { 
                                const target = e.currentTarget;
                                // 1. Try Thumb
                                if (target.src === posterSrc && movie.thumb_url) {
                                    target.src = getImageUrl(movie.thumb_url);
                                } 
                                // 2. Try Fallback Icon
                                else if (target.src !== FALLBACK_IMAGE) {
                                    target.src = FALLBACK_IMAGE;
                                } 
                                // 3. Placeholder
                                else {
                                    target.src = 'https://placehold.co/100x150/1f1f1f/e5e5e5?text=IMG'; 
                                }
                              }} 
                           />
                           <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-red-500 transition-colors">{movie.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{movie.origin_name} ({movie.year})</p>
                       </div>
                    </Link>
                 )})}
              </div>
           )}

           {/* Comics Section */}
           {results.comics.length > 0 && (
              <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                 <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-2">
                    <BookOpen size={14} className="text-blue-500" /> Truyện
                 </div>
                 {results.comics.map((comic) => (
                    <Link 
                      key={comic._id} 
                      to={`/truyen/${comic.slug}`} 
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                       <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-sm">
                           <img 
                              src={getComicImageUrl(comic.thumb_url)} 
                              alt={comic.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x150/1f1f1f/e5e5e5?text=IMG'; }}
                           />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-500 transition-colors">{comic.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {comic.chaptersLatest?.[0]?.chapter_name ? `Chap ${comic.chaptersLatest[0].chapter_name}` : 'Đang cập nhật'}
                          </p>
                       </div>
                    </Link>
                 ))}
              </div>
           )}

           {/* View All Action */}
           {hasResults && (
              <button 
                  onClick={() => { setIsOpen(false); onSearch(query); }}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center text-sm font-bold text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                  Xem tất cả kết quả cho "{query}" <ChevronRight size={16} />
              </button>
           )}
        </div>
      )}
    </div>
  );
};
