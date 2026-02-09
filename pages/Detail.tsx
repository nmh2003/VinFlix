
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMovieDetailUnified, getImageUrl, fetchCategory, fetchPeople, fetchKeywords, fetchMovieImages } from '../services/api';
import { 
  Loader2, Play, Film, AlertCircle, RefreshCw, 
  Star, Eye, Video, X, CheckCircle, Hourglass, MonitorPlay, ChevronDown, ChevronUp, Calendar, Clock, Globe, User, ExternalLink, FastForward, Tag, Image as ImageIcon,
  List, ChevronRight, ChevronLeft, ZoomIn, ZoomOut
} from 'lucide-react';
import { Button } from '../components/Button';
import { Helmet } from 'react-helmet';
import { MovieCard } from '../components/MovieCard';
import { useStore } from '../hooks/useStore';
import { ServerData, EpisodeData } from '../types';

const FALLBACK_IMAGE = 'https://yt3.googleusercontent.com/n--_Eh0Xsi4GX-AYU5n6jyIjx_KqEPnmvJFjoLr68b-5CVOCpFgvBVEVH3IM_uLTCoQ8DDjE=s900-c-k-c0x00ffffff-no-rj';

// --- Internal Helper Components ---

// Trailer Modal
const TrailerModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
  const [embedId, setEmbedId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      if (!url) throw new Error("No URL");
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        setEmbedId(match[2]);
      } else {
        throw new Error("Invalid YouTube URL");
      }
    } catch (e) {
      console.warn("Trailer URL parse failed:", e);
      setError(true);
    }
  }, [url]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-3 bg-gray-900 border-b border-gray-800">
            <h3 className="text-white font-bold flex items-center gap-2">
                <Video size={20} className="text-primary" /> Trailer
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>
        <div className="relative w-full aspect-video bg-black">
            {error || !embedId ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <AlertCircle size={48} className="mb-4 text-red-500" />
                <p>Không thể tải Trailer. Link hỏng hoặc không tồn tại.</p>
                <Button onClick={() => window.open(url, '_blank')} variant="outline" className="mt-4 gap-2">
                    Thử mở trên YouTube <MonitorPlay size={16} />
                </Button>
            </div>
            ) : (
            <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${embedId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`}
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
            )}
        </div>
      </div>
    </div>
  );
};

// Lightbox Component (Messenger Style)
const Lightbox: React.FC<{ 
    images: any[]; 
    initialIndex: number; 
    baseUrl: string; 
    onClose: () => void 
}> = ({ images, initialIndex, baseUrl, onClose }) => {
    const [index, setIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        setScale(1);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        setScale(1);
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            if (e.key === 'ArrowRight') setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [images.length, onClose]);

    if (!images || images.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
            {/* Controls */}
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 bg-black/50 rounded-full z-50">
                <X size={32} />
            </button>
            
            <div className="absolute top-4 left-4 text-white/80 font-medium z-50 bg-black/50 px-3 py-1 rounded-full text-sm">
                {index + 1} / {images.length}
            </div>

            {/* Navigation */}
            {images.length > 1 && (
                <>
                    <button onClick={handlePrev} className="absolute left-2 md:left-8 text-white/70 hover:text-white p-3 bg-black/50 rounded-full z-50 hover:bg-white/10 transition-colors">
                        <ChevronLeft size={32} />
                    </button>
                    <button onClick={handleNext} className="absolute right-2 md:right-8 text-white/70 hover:text-white p-3 bg-black/50 rounded-full z-50 hover:bg-white/10 transition-colors">
                        <ChevronRight size={32} />
                    </button>
                </>
            )}

            {/* Image */}
            <div className="w-full h-full flex items-center justify-center p-2 md:p-10" onClick={(e) => e.stopPropagation()}>
                <img 
                    src={`${baseUrl}${images[index].file_path}`} 
                    alt={`Gallery ${index}`} 
                    className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-200"
                    style={{ transform: `scale(${scale})` }}
                    onClick={() => setScale(scale === 1 ? 1.5 : 1)} // Simple Zoom
                />
            </div>
        </div>
    );
};

// Gallery Modal Grid (View All)
const GalleryModal: React.FC<{ 
    images: any[]; 
    baseUrl: string; 
    onClose: () => void;
    onImageClick: (index: number) => void;
}> = ({ images, baseUrl, onClose, onImageClick }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
             <div className="relative w-full max-w-6xl h-[80vh] bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center p-3 bg-gray-900 border-b border-gray-800">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <ImageIcon size={20} className="text-primary" /> Tất Cả Hình Ảnh
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full"><X size={24} /></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                         {images.map((img, idx) => (
                             <div 
                                key={idx} 
                                className="relative group rounded overflow-hidden bg-black/50 cursor-zoom-in aspect-video"
                                onClick={() => onImageClick(idx)}
                             >
                                 <img 
                                    src={`${baseUrl}${img.file_path}`} 
                                    alt="Movie Still" 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                 />
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-white/10 transition-colors pointer-events-none"/>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
        </div>
    )
}

// Episode List Component with Scroll-To-Range
const ServerEpisodeList: React.FC<{ server: ServerData; serverIndex: number; movieSlug: string; historyItem: any }> = ({ server, serverIndex, movieSlug, historyItem }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const gridRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemsPerPage = 50;

    const episodes = server.server_data;
    const totalRanges = Math.ceil(episodes.length / itemsPerPage);
    
    // Generate ranges (1-50, 51-100)
    const ranges = useMemo(() => {
        return Array.from({ length: totalRanges }, (_, i) => {
            const start = i * itemsPerPage + 1;
            const end = Math.min((i + 1) * itemsPerPage, episodes.length);
            return { label: `${start}-${end}`, startIdx: i * itemsPerPage };
        });
    }, [totalRanges, episodes.length]);

    // Scroll function: Scrolls the CONTAINER, not the page
    const handleRangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const startIdx = parseInt(e.target.value);
        if (gridRef.current && scrollContainerRef.current) {
            const targetNode = gridRef.current.children[startIdx] as HTMLElement;
            if (targetNode) {
                // Calculate position relative to container
                const topPos = targetNode.offsetTop - gridRef.current.offsetTop;
                scrollContainerRef.current.scrollTo({
                    top: topPos,
                    behavior: 'smooth'
                });
            }
        }
    };

    return (
        <div className="mb-4 last:mb-0 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50 transition-all">
            {/* Header - Improved for Mobile */}
            <div 
                className="flex flex-wrap md:flex-nowrap items-center justify-between p-2 md:p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none gap-2"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Left: Icon & Server Name */}
                <h4 className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 mr-auto min-w-0">
                    {isExpanded ? <ChevronDown size={18} className="text-primary shrink-0" /> : <ChevronRight size={18} className="shrink-0" />}
                    <span className="truncate">{server.server_name}</span>
                </h4>
                
                {/* Right: Badge & Selector */}
                <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0" onClick={(e) => e.stopPropagation()}>
                     <span className="text-[10px] md:text-xs font-normal text-gray-500 normal-case bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        {episodes.length} tập
                    </span>
                     {totalRanges > 1 && isExpanded && (
                         <select 
                            onChange={handleRangeSelect}
                            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-[10px] md:text-xs rounded px-1.5 md:px-2 py-1 outline-none focus:border-primary cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 max-w-[100px] md:max-w-none"
                            defaultValue=""
                         >
                             <option value="" disabled>Chọn dải tập...</option>
                             {ranges.map(range => (
                                 <option key={range.startIdx} value={range.startIdx}>Tập {range.label}</option>
                             ))}
                         </select>
                     )}
                </div>
            </div>
            
            {/* Content - Full Scrollable List */}
            {isExpanded && (
                <div className="p-2 md:p-3 border-t border-gray-200 dark:border-gray-800">
                     <div 
                        ref={scrollContainerRef}
                        className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar scroll-smooth"
                     >
                        <div ref={gridRef} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-2">
                            {episodes.map((ep, idx) => (
                                <Link 
                                    key={ep.slug}
                                    to={`/phim/${movieSlug}/tap/${ep.slug}?sv=${serverIndex}`}
                                    className={`text-center py-2 px-1 rounded text-xs md:text-sm font-medium transition-all hover:scale-105 shadow-sm border truncate
                                    ${historyItem?.episodeSlug === ep.slug 
                                        ? 'bg-yellow-500 text-white border-yellow-600 shadow-md ring-1 ring-yellow-300' 
                                        : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-red-500 hover:text-white hover:border-red-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-red-600 dark:hover:border-red-700'
                                    }`}
                                    title={ep.name}
                                >
                                    {ep.name}
                                </Link>
                            ))}
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
};

export const Detail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [showTrailer, setShowTrailer] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  const [bgError, setBgError] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  
  const { history, settings } = useStore();

  // 1. Fetch Main Movie Detail (Unified)
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['movie', slug],
    queryFn: () => fetchMovieDetailUnified(slug!),
    enabled: !!slug,
    retry: 1
  });

  // 2. Fetch Extra Data (People/Keywords/Images)
  const movie = data?.movie;
  const isXayda = movie?.source === 'xayda';

  const { data: peopleData } = useQuery({
      queryKey: ['people', slug],
      queryFn: () => fetchPeople(slug!),
      enabled: !!slug && isXayda,
      staleTime: 1000 * 60 * 60
  });

  const { data: keywordData } = useQuery({
      queryKey: ['keywords', slug],
      queryFn: () => fetchKeywords(slug!),
      enabled: !!slug && isXayda,
      staleTime: 1000 * 60 * 60
  });

  const { data: imageData } = useQuery({
      queryKey: ['images', slug],
      queryFn: () => fetchMovieImages(slug!),
      enabled: !!slug && isXayda,
      staleTime: 1000 * 60 * 60
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    setBgError(false);
    setPosterError(false);
    setIsContentExpanded(false);
  }, [slug]);

  // 3. Extract Category for Related Movies
  const categorySlug = movie?.category && movie.category.length > 0 ? movie.category[0].slug : null;

  // 4. Fetch Related Movies
  const { data: relatedData } = useQuery({
    queryKey: ['related', categorySlug],
    queryFn: () => fetchCategory(categorySlug!, 1, 12),
    enabled: !!categorySlug,
    staleTime: 1000 * 60 * 30,
    retry: 0 
  });

  if (isLoading) return <div className="flex justify-center p-20 min-h-screen"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
  
  if (error || !data || !data.status || !movie) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[60vh]">
             <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy phim</h3>
             <p className="text-gray-500 mb-6">Có thể phim đã bị xóa hoặc đường dẫn không tồn tại.</p>
             <Button onClick={() => refetch()} disabled={isRefetching} className="gap-2">
                {isRefetching ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Thử lại
            </Button>
            <div className="mt-4">
                <Link to="/" className="text-primary hover:underline">Về Trang Chủ</Link>
            </div>
        </div>
      );
  }

  const episodes = data.episodes || [];
  // Prioritize first server
  const firstEp = episodes?.[0]?.server_data?.[0];
  
  // HISTORY CHECK
  const historyItem = history.find(h => h.movieSlug === slug);
  const progressPercent = historyItem && historyItem.duration 
      ? Math.min(100, Math.max(0, (historyItem.progress || 0) / historyItem.duration * 100)) 
      : 0;
  
  const tmdbScore = movie.tmdb?.vote_average ? movie.tmdb.vote_average.toFixed(1) : null;
  const viewCount = movie.view ? new Intl.NumberFormat('vi-VN').format(movie.view) : 'N/A';
  
  let actorsDisplay: { name: string; char?: string; img?: string }[] = [];
  if (peopleData?.data?.peoples) {
      actorsDisplay = peopleData.data.peoples
        .filter((p: any) => p.known_for_department === 'Acting')
        .map((p: any) => ({ 
            name: p.name, 
            char: p.character, 
            img: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null 
        }));
  } else if (movie.actor && movie.actor.length > 0 && movie.actor[0] !== '') {
      actorsDisplay = movie.actor.map(a => ({ name: a }));
  } else {
      actorsDisplay = [{ name: 'Đang cập nhật' }];
  }

  const directors = movie.director && movie.director.length > 0 && movie.director[0] !== '' ? movie.director : ['Đang cập nhật'];
  const isCompleted = movie.status === 'completed';

  // Images for Bento Grid (Take top 5)
  const galleryImages = imageData?.status ? imageData.images : [];
  const galleryBaseUrl = imageData?.baseUrl || '';
  const topImages = galleryImages.slice(0, 5);

  // @ts-ignore
  let relatedMovies = [];
  // @ts-ignore
  let relatedImageDomain = '';
  try {
     // @ts-ignore
     if (relatedData?.data?.items) {
         // @ts-ignore
         relatedMovies = relatedData.data.items.filter((m: any) => m.slug !== movie.slug).slice(0, 10);
         // @ts-ignore
         relatedImageDomain = relatedData.data.app_domain_cdn_image;
     }
  } catch (e) {}

  const posterSrc = getImageUrl(movie.poster_url);

  // Grid Logic based on Settings
  const getGridClass = () => {
    let mobileClass = 'grid-cols-4'; // Default
    if (settings.mobileCardColumns === 3) mobileClass = 'grid-cols-3';
    if (settings.mobileCardColumns === 2) mobileClass = 'grid-cols-2';

    let desktopClass = 'md:grid-cols-4 lg:grid-cols-5'; // Default Large
    if (settings.desktopCardSize === 'medium') desktopClass = 'md:grid-cols-5 lg:grid-cols-6';
    if (settings.desktopCardSize === 'small') desktopClass = 'md:grid-cols-6 lg:grid-cols-8';

    return `${mobileClass} ${desktopClass}`;
  };

  return (
    <div className="relative"> 
      <Helmet>
        <title>{movie.name} - Xem Phim Online | VinFlix</title>
        <meta name="description" content={`Xem phim ${movie.name} vietsub thuyết minh. ${movie.origin_name} (${movie.year}).`} />
      </Helmet>

      {/* --- HERO SECTION (Always Dark Theme for Cinematic Feel) --- */}
      <div className="relative w-full overflow-hidden bg-[#0b0b0b] text-white">
        
        {/* Backdrop Image */}
        <div className="absolute inset-0 select-none">
            {!bgError && movie.thumb_url && (
                <img 
                    src={getImageUrl(movie.thumb_url)} 
                    alt="Backdrop"
                    className="w-full h-full object-cover blur-[2px] opacity-40 scale-105"
                    onError={() => setBgError(true)}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0b]/90 via-[#0b0b0b]/30 to-transparent" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-8 md:pt-16 pb-8 md:pb-12 flex flex-col md:flex-row gap-6 md:gap-10">
            
            {/* 1. Left: Poster */}
            <div className="w-40 mx-auto md:mx-0 md:w-64 shrink-0 relative group">
                <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10 relative bg-gray-800">
                    {movie.chieurap && (
                        <div className="absolute top-2 left-2 z-20 bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                            Chiếu Rạp
                        </div>
                    )}
                    <img 
                        src={posterSrc} 
                        alt={movie.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                            const target = e.currentTarget;
                            // 1. Try Thumb
                            if (target.src === posterSrc && movie.thumb_url && movie.thumb_url !== movie.poster_url) {
                                target.src = getImageUrl(movie.thumb_url);
                                return;
                            }
                            // 2. Try Fallback Icon
                            if (target.src !== FALLBACK_IMAGE && target.src !== "https://placehold.co/300x450/1f1f1f/e5e5e5?text=No+Image") {
                                target.src = FALLBACK_IMAGE;
                                setPosterError(true); 
                                return;
                            }
                            // 3. Last Resort
                            target.src = "https://placehold.co/300x450/1f1f1f/e5e5e5?text=No+Image";
                        }}
                    />
                </div>
                
                {/* Mobile Actions (Below Poster) */}
                <div className="mt-4 md:hidden flex flex-col gap-2">
                    {historyItem && historyItem.episodeSlug ? (
                        <Link to={`/phim/${movie.slug}/tap/${historyItem.episodeSlug}`} className="block w-full">
                            <Button className="w-full gap-2 shadow-lg py-3 uppercase tracking-wide font-bold bg-yellow-600 hover:bg-yellow-700 text-white border-none" size="md">
                                <FastForward size={20} fill="currentColor" /> Tiếp: {historyItem.episodeName}
                            </Button>
                            {progressPercent > 0 && (
                                <div className="h-1 w-full bg-white/20 mt-1 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                            )}
                        </Link>
                    ) : (
                        firstEp ? (
                            <Link to={`/phim/${movie.slug}/tap/${firstEp.slug}?sv=0`} className="block w-full">
                                <Button className="w-full gap-2 shadow-lg py-3 uppercase tracking-wide font-bold" size="md">
                                    <Play size={20} fill="currentColor" /> Xem Ngay
                                </Button>
                            </Link>
                        ) : (
                             <Button className="w-full gap-2 opacity-70 cursor-not-allowed" size="md" disabled>
                                Sắp Chiếu
                            </Button>
                        )
                    )}
                    
                    {movie.trailer_url && (
                        <button 
                            onClick={() => setShowTrailer(true)}
                            className="w-full py-2 flex items-center justify-center gap-2 text-gray-300 bg-white/5 hover:bg-white/10 rounded-md text-xs font-medium transition-colors border border-white/10"
                        >
                            <Video size={16} /> Trailer
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Right: Movie Header Info */}
            <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold mb-2 leading-tight tracking-tight text-white">
                    {movie.name}
                </h1>
                <h2 className="text-sm md:text-xl text-gray-300 font-medium mb-4 italic">
                    {movie.origin_name} ({movie.year})
                </h2>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6 md:mb-8 text-xs md:text-sm">
                    {tmdbScore && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 font-bold backdrop-blur-sm">
                            <Star size={16} fill="currentColor" /> {tmdbScore} <span className="text-white/50 font-normal">({movie.tmdb?.vote_count})</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/5 rounded-full text-gray-200 backdrop-blur-sm">
                         <Eye size={16} className="text-blue-400" /> {viewCount}
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium backdrop-blur-sm border ${isCompleted ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-orange-500/20 text-orange-400 border-orange-500/20'}`}>
                         {isCompleted ? <CheckCircle size={16} /> : <Hourglass size={16} />}
                         {movie.episode_current}
                    </div>
                    <div className="px-3 py-1.5 bg-red-600 rounded-full font-bold shadow-sm text-white">
                        {movie.quality}
                    </div>
                </div>

                <div className="hidden md:flex flex-wrap gap-4 mt-auto">
                    {historyItem && historyItem.episodeSlug ? (
                        <Link to={`/phim/${movie.slug}/tap/${historyItem.episodeSlug}`}>
                            <div className="flex flex-col gap-1">
                                <Button className="gap-2 px-8 py-4 text-lg shadow-yellow-900/50 shadow-lg hover:scale-105 transition-transform bg-yellow-600 hover:bg-yellow-700 text-white border-none" size="lg">
                                    <FastForward size={24} fill="currentColor" /> Xem Tiếp: {historyItem.episodeName}
                                </Button>
                                {progressPercent > 0 && (
                                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500" style={{ width: `${progressPercent}%` }}></div>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ) : (
                        firstEp ? (
                            <Link to={`/phim/${movie.slug}/tap/${firstEp.slug}?sv=0`}>
                                <Button className="gap-2 px-8 py-4 text-lg shadow-red-900/50 shadow-lg hover:scale-105 transition-transform" size="lg">
                                    <Play size={24} fill="currentColor" /> Xem Phim
                                </Button>
                            </Link>
                        ) : (
                             <Button className="gap-2 px-8 py-4 opacity-70 cursor-not-allowed" size="lg" disabled>
                                Đang Cập Nhật
                            </Button>
                        )
                    )}
                    
                    {movie.trailer_url && (
                        <Button 
                            variant="secondary" 
                            className="gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 border-white/10 text-white backdrop-blur-sm hover:border-white/30"
                            onClick={() => setShowTrailer(true)}
                        >
                            <Video size={24} /> Trailer
                        </Button>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-8 pb-24 md:pb-12">
        
        {/* 1. Main Info & Synopsis (VERTICAL LAYOUT) */}
        <div className="space-y-6">
            {/* A. Information Box */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">
                    <Film size={20} className="text-primary" /> Thông tin phim
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                        <span className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1"><User size={14}/> Đạo diễn:</span>
                        <span className="text-gray-900 dark:text-gray-200 font-medium">{directors.join(', ')}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1"><Globe size={14}/> Quốc gia:</span>
                        <span className="text-gray-900 dark:text-gray-200">{movie.country?.map(c => c.name).join(', ')}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1"><Clock size={14}/> Thời lượng:</span>
                        <span className="text-gray-900 dark:text-gray-200">{movie.time || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1"><Calendar size={14}/> Năm:</span>
                        <span className="text-gray-900 dark:text-gray-200">{movie.year}</span>
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-2">
                        <span className="text-gray-500 dark:text-gray-400 font-semibold">Thể loại:</span>
                        <div className="flex flex-wrap gap-2">
                            {movie.category?.map(cat => (
                                <Link key={cat.id} to={`/the-loai/${cat.slug}`} className="text-primary hover:text-red-700 hover:underline bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-xs">
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                {keywordData?.data?.keywords && (
                    <div className="flex flex-col gap-1 border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                        <span className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1"><Tag size={14}/> Từ khóa:</span>
                        <div className="flex flex-wrap gap-2">
                            {keywordData.data.keywords.map((kw: any) => (
                                <Link key={kw.tmdb_keyword_id} to={`/tim-kiem?keyword=${encodeURIComponent(kw.name)}`} className="text-xs text-gray-500 hover:text-primary bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    #{kw.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* B. Content Box (Below Info) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white uppercase tracking-wider">
                    Nội dung phim
                </h3>
                <div className="relative">
                    <div 
                        className={`text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base overflow-hidden transition-all duration-500 ease-in-out ${isContentExpanded ? 'max-h-[1000px]' : 'max-h-60'}`}
                    >
                        <div dangerouslySetInnerHTML={{ __html: movie.content }} />
                    </div>
                    {!isContentExpanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
                    )}
                </div>
                <button 
                    onClick={() => setIsContentExpanded(!isContentExpanded)}
                    className="mt-3 flex items-center gap-1 text-primary text-sm font-bold hover:underline mx-auto"
                >
                    {isContentExpanded ? (
                        <>Thu gọn <ChevronUp size={16} /></>
                    ) : (
                        <>Xem thêm <ChevronDown size={16} /></>
                    )}
                </button>
            </div>
        </div>

        {/* 2. CAST (Horizontal Scroll - Modern "Chung mâm") */}
        {actorsDisplay.length > 0 && (
             <div className="space-y-4">
                 <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white uppercase tracking-wider border-l-4 border-primary pl-3">
                     <User className="text-primary" size={24} /> Diễn Viên
                 </h3>
                 <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary dark:hover:[&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:transition-colors">
                     {actorsDisplay.map((actor, idx) => (
                         <div key={idx} className="flex flex-col items-center min-w-[100px] md:min-w-[120px] group">
                             <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-md group-hover:border-primary transition-colors bg-gray-200 dark:bg-gray-800">
                                 {actor.img ? (
                                     <img src={actor.img} alt={actor.name} className="w-full h-full object-cover" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-gray-400">
                                         <User size={32} />
                                     </div>
                                 )}
                             </div>
                             <span className="font-bold text-xs md:text-sm mt-2 text-center line-clamp-1 group-hover:text-primary transition-colors text-gray-900 dark:text-white" title={actor.name}>{actor.name}</span>
                             {actor.char && <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 text-center line-clamp-1" title={actor.char}>{actor.char}</span>}
                         </div>
                     ))}
                 </div>
             </div>
        )}

        {/* 3. GALLERY (Bento Grid) */}
        {topImages.length > 0 && (
             <div className="space-y-4">
                 <div className="flex items-center justify-between">
                     <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white uppercase tracking-wider border-l-4 border-primary pl-3">
                         <ImageIcon className="text-primary" size={24} /> Hình Ảnh
                     </h3>
                     {galleryImages.length > 5 && (
                         <button onClick={() => setShowGallery(true)} className="text-sm font-medium text-primary hover:underline">Xem tất cả</button>
                     )}
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 h-[300px] md:h-[400px]">
                     {topImages.map((img, idx) => {
                         const isBig = idx === 0;
                         return (
                             <div 
                                key={idx} 
                                className={`relative group overflow-hidden rounded-xl cursor-zoom-in bg-gray-800 ${isBig ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}`}
                                onClick={() => setLightboxIndex(idx)}
                             >
                                 <img 
                                    src={`${galleryBaseUrl}${img.file_path}`} 
                                    alt={`Backdrop ${idx}`} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                    loading="lazy"
                                 />
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-white/10 transition-colors" />
                             </div>
                         )
                     })}
                 </div>
             </div>
        )}
        
        {/* 4. Episode List (Scrollable with Quick Jump) */}
        <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-xl p-4 md:p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-4 border-l-4 border-primary pl-3 text-gray-900 dark:text-white flex items-center gap-2 uppercase">
                <MonitorPlay size={24} /> Danh Sách Tập
            </h3>
            {episodes.map((server, idx) => (
                <ServerEpisodeList 
                    key={idx} 
                    server={server} 
                    serverIndex={idx} 
                    movieSlug={movie.slug} 
                    historyItem={historyItem} 
                />
            ))}
            {episodes.length === 0 && <p className="text-gray-500 italic text-center py-4">Phim đang cập nhật tập mới...</p>}
        </div>

        {/* 5. Related Movies */}
        {relatedMovies.length > 0 && (
            <div>
                <h3 className="text-xl font-bold mb-6 border-l-4 border-primary pl-3 flex items-center gap-2 text-gray-900 dark:text-white uppercase">
                    <Film className="w-6 h-6" /> Có Thể Bạn Muốn Xem
                </h3>
                <div className={`grid gap-2 md:gap-4 ${getGridClass()}`}>
                    {relatedMovies.map((m: any) => (
                    <MovieCard key={m._id} movie={m} domainImage={relatedImageDomain} />
                    ))}
                </div>
            </div>
        )}
      </div>

      {showTrailer && movie.trailer_url && (
         <TrailerModal url={movie.trailer_url} onClose={() => setShowTrailer(false)} />
      )}
      
      {/* Gallery Modal (Grid View) */}
      {showGallery && imageData?.status && (
          <GalleryModal 
            images={galleryImages} 
            baseUrl={galleryBaseUrl} 
            onClose={() => setShowGallery(false)}
            onImageClick={(idx) => setLightboxIndex(idx)}
          />
      )}

      {/* Lightbox (Full Screen View) */}
      {lightboxIndex !== null && imageData?.status && (
          <Lightbox 
            images={galleryImages}
            initialIndex={lightboxIndex}
            baseUrl={galleryBaseUrl}
            onClose={() => setLightboxIndex(null)}
          />
      )}
    </div>
  );
};
