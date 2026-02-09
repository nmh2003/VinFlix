import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, X, Loader2, Film, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { searchMovies, getImageUrl } from '../services/api';
import { searchComics, getComicImageUrl } from '../services/comicApi';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_KEYWORDS = [
  "One Piece", "Conan", "Harry Potter", "Avengers", "Naruto", "Dragon Ball", "Doraemon", "Marvel"
];

export const MobileSearchOverlay: React.FC<MobileSearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<{ movies: any[]; comics: any[] }>({ movies: [], comics: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Handle auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults({ movies: [], comics: [] });
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch Logic
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ movies: [], comics: [] });
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [movieRes, comicRes] = await Promise.allSettled([
          searchMovies(debouncedQuery, 10),
          searchComics(debouncedQuery, 1)
        ]);

        const movies = movieRes.status === 'fulfilled' ? (movieRes.value as any)?.data?.items || [] : [];
        const comics = comicRes.status === 'fulfilled' ? (comicRes.value as any)?.data?.items || [] : [];

        setResults({ movies, comics });
      } catch (error) {
        console.error("Mobile Search Error", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      onClose();
      navigate(`/tim-kiem?keyword=${encodeURIComponent(query)}`);
    }
  };

  const handleLinkClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  const hasResults = results.movies.length > 0 || results.comics.length > 0;
  const isQueryEmpty = !query.trim();

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-[#0b0b0b] flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Header Input Area */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0b0b0b]">
        <button 
          onClick={onClose}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-gray-100 dark:bg-gray-900/80 text-gray-900 dark:text-white border-none rounded-lg py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-primary/50 outline-none text-base font-medium placeholder:text-gray-500"
            placeholder="Tìm tên phim, truyện..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
             <button 
                type="button"
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
             >
               <X size={16} />
             </button>
          ) : null}
        </form>

        <button 
          onClick={() => handleSearchSubmit()}
          className="p-2.5 bg-primary text-white rounded-lg font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-transform"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        
        {/* Loading State */}
        {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Loader2 size={32} className="animate-spin text-primary mb-2" />
                <p className="text-sm">Đang tìm kiếm...</p>
            </div>
        )}

        {/* Empty State / Suggestions */}
        {isQueryEmpty && !isLoading && (
            <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <TrendingUp size={16} className="text-primary" /> Từ khóa phổ biến
                </div>
                <div className="flex flex-wrap gap-2">
                    {SUGGESTED_KEYWORDS.map((keyword, idx) => (
                        <button
                            key={idx}
                            onClick={() => setQuery(keyword)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium active:scale-95 transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            {keyword}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* No Results */}
        {!isQueryEmpty && !isLoading && !hasResults && (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Không tìm thấy kết quả</p>
                <p className="text-sm">Thử từ khóa khác xem sao?</p>
            </div>
        )}

        {/* Results List */}
        {!isLoading && hasResults && (
            <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-300">
                
                {/* Movies */}
                {results.movies.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-l-4 border-red-500 pl-2">
                            <Film size={16} /> Phim
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {results.movies.map(movie => (
                                <Link 
                                    key={movie._id}
                                    to={`/phim/${movie.slug}`}
                                    onClick={handleLinkClick}
                                    className="flex gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 active:bg-gray-200 dark:active:bg-gray-800 transition-colors"
                                >
                                    <div className="w-16 h-24 shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-800">
                                        <img 
                                            src={getImageUrl(movie.poster_url)} 
                                            alt={movie.name} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x150/1f1f1f/e5e5e5?text=IMG'; }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-2">{movie.name}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">{movie.origin_name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">{movie.year}</span>
                                            {movie.quality && <span className="border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded">{movie.quality}</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comics */}
                {results.comics.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-l-4 border-blue-500 pl-2">
                            <BookOpen size={16} /> Truyện
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {results.comics.map(comic => (
                                <Link 
                                    key={comic._id}
                                    to={`/truyen/${comic.slug}`}
                                    onClick={handleLinkClick}
                                    className="flex gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 active:bg-gray-200 dark:active:bg-gray-800 transition-colors"
                                >
                                    <div className="w-16 h-24 shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-800">
                                        <img 
                                            src={getComicImageUrl(comic.thumb_url)} 
                                            alt={comic.name} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x150/1f1f1f/e5e5e5?text=IMG'; }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-2">{comic.name}</h4>
                                        <div className="flex flex-wrap gap-1 mb-1">
                                            {comic.category?.slice(0, 2).map((cat: any, i: number) => (
                                                <span key={i} className="text-[10px] text-gray-500 bg-gray-200 dark:bg-gray-800 px-1.5 rounded">{cat.name}</span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-blue-500 font-medium">
                                            {comic.chaptersLatest?.[0]?.chapter_name ? `Mới nhất: Chap ${comic.chaptersLatest[0].chapter_name}` : 'Đang cập nhật'}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* View All Button */}
                <button 
                    onClick={() => handleSearchSubmit()}
                    className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-primary font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    Xem tất cả kết quả
                </button>

            </div>
        )}
      </div>
    </div>
  );
};