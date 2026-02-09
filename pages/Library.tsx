import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { getImageUrl } from '../services/api';
import { getComicImageUrl } from '../services/comicApi';
import { PlayCircle, Clock, Trash2, BookOpen, Gamepad2, Film, Layers } from 'lucide-react';
import { Button } from '../components/Button';

const FALLBACK_IMAGE = 'https://yt3.googleusercontent.com/n--_Eh0Xsi4GX-AYU5n6jyIjx_KqEPnmvJFjoLr68b-5CVOCpFgvBVEVH3IM_uLTCoQ8DDjE=s900-c-k-c0x00ffffff-no-rj';

type HistoryTab = 'all' | 'movie' | 'comic' | 'game';

export const Library: React.FC = () => {
  const { history, comicHistory, gameHistory, clearHistory } = useStore();
  const [activeTab, setActiveTab] = useState<HistoryTab>('all');

  // Unified Data Structure for Rendering
  const allHistoryItems = useMemo(() => {
    const movies = history.map(item => ({ ...item, type: 'movie' as const, sortTime: item.timestamp }));
    const comics = comicHistory.map(item => ({ ...item, type: 'comic' as const, sortTime: item.timestamp }));
    const games = gameHistory.map(item => ({ ...item, type: 'game' as const, sortTime: item.timestamp }));

    return [...movies, ...comics, ...games].sort((a, b) => b.sortTime - a.sortTime);
  }, [history, comicHistory, gameHistory]);

  const displayedItems = useMemo(() => {
    if (activeTab === 'movie') return allHistoryItems.filter(i => i.type === 'movie');
    if (activeTab === 'comic') return allHistoryItems.filter(i => i.type === 'comic');
    if (activeTab === 'game') return allHistoryItems.filter(i => i.type === 'game');
    return allHistoryItems;
  }, [activeTab, allHistoryItems]);

  const hasItems = displayedItems.length > 0;

  const tabs: { id: HistoryTab; label: string; icon: React.ReactNode }[] = [
      { id: 'all', label: 'Tất cả', icon: <Layers size={16} /> },
      { id: 'movie', label: 'Phim', icon: <Film size={16} /> },
      { id: 'comic', label: 'Truyện', icon: <BookOpen size={16} /> },
      { id: 'game', label: 'Game', icon: <Gamepad2 size={16} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto min-h-[60vh]">
      {/* Header */}
      <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Clock className="text-primary" /> Lịch Sử Xem
            </h1>
            {allHistoryItems.length > 0 && (
                <button 
                    onClick={clearHistory}
                    className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 font-medium bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-full transition-colors"
                >
                    <Trash2 size={16} /> Xóa tất cả
                </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                        activeTab === tab.id 
                        ? 'bg-primary border-primary text-white' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/50'
                    }`}
                  >
                      {tab.icon} {tab.label}
                  </button>
              ))}
          </div>
      </div>

      {/* List Content */}
      <div className="space-y-3">
        {!hasItems && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
                <Clock size={48} className="mb-4 opacity-20" />
                <p>Chưa có lịch sử {activeTab !== 'all' ? (tabs.find(t=>t.id===activeTab)?.label.toLowerCase()) : ''} nào.</p>
                <div className="flex gap-4 mt-4">
                    <Link to="/" className="text-primary hover:underline text-sm font-medium">Khám phá ngay</Link>
                </div>
            </div>
        )}
        
        {displayedItems.map((item, idx) => {
            // RENDER MOVIE ITEM
            if (item.type === 'movie') {
                return (
                    <div key={`${item.type}-${item.movieSlug}`} className="flex gap-3 md:gap-4 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                        <Link to={`/phim/${item.movieSlug}`} className="w-16 h-24 md:w-20 md:h-28 shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                            <img 
                                src={getImageUrl(item.moviePoster)} 
                                alt={item.movieName} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                            />
                        </Link>
                        <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Phim</span>
                                <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} /> {new Date(item.timestamp).toLocaleDateString()}</span>
                            </div>
                            <Link to={`/phim/${item.movieSlug}`} className="font-bold text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary line-clamp-2 text-sm md:text-base leading-tight">
                                {item.movieName}
                            </Link>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Đang xem: <span className="text-red-500 font-medium">{item.episodeName}</span>
                            </p>
                            {item.progress && item.duration && (
                                <div className="mt-2 w-full max-w-[120px] h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500" style={{ width: `${(item.progress / item.duration) * 100}%` }}></div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center px-2 md:px-4">
                            <Link 
                                to={`/phim/${item.movieSlug}/tap/${item.episodeSlug}`}
                                className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white rounded-full transition-all"
                                title="Xem tiếp"
                            >
                                <PlayCircle size={24} fill="currentColor" className="opacity-100" />
                            </Link>
                        </div>
                    </div>
                );
            }

            // RENDER COMIC ITEM
            if (item.type === 'comic') {
                return (
                    <div key={`${item.type}-${item.comicSlug}`} className="flex gap-3 md:gap-4 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <Link to={`/truyen/${item.comicSlug}`} className="w-16 h-24 md:w-20 md:h-28 shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                            <img 
                                src={getComicImageUrl(item.comicThumb)} 
                                alt={item.comicName} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x450/1f1f1f/e5e5e5?text=No+Cover'; }}
                            />
                        </Link>
                        <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Truyện</span>
                                <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} /> {new Date(item.timestamp).toLocaleDateString()}</span>
                            </div>
                            <Link to={`/truyen/${item.comicSlug}`} className="font-bold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 line-clamp-2 text-sm md:text-base leading-tight">
                                {item.comicName}
                            </Link>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Đọc đến: <span className="text-blue-500 font-medium">Chapter {item.chapterName}</span>
                            </p>
                        </div>
                        <div className="flex items-center px-2 md:px-4">
                            <Link 
                                to={`/truyen/${item.comicSlug}/chap/${item.chapterApiData.split('/').pop()}`}
                                className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white rounded-full transition-all"
                                title="Đọc tiếp"
                            >
                                <BookOpen size={20} />
                            </Link>
                        </div>
                    </div>
                );
            }

            // RENDER GAME ITEM
            if (item.type === 'game') {
                // Game images usually horizontal or square, adapt styles
                return (
                    <div key={`${item.type}-${item.namespace}`} className="flex gap-3 md:gap-4 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                        <Link to={`/game/${item.namespace}`} className="w-24 h-20 md:w-32 md:h-24 shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                            <img 
                                src={item.image} 
                                alt={item.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/320x240/1f1f1f/e5e5e5?text=Game'; }}
                            />
                        </Link>
                        <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Game</span>
                                <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} /> {new Date(item.timestamp).toLocaleDateString()}</span>
                            </div>
                            <Link to={`/game/${item.namespace}`} className="font-bold text-gray-900 dark:text-white hover:text-purple-500 dark:hover:text-purple-400 line-clamp-2 text-sm md:text-base leading-tight">
                                {item.title}
                            </Link>
                            <p className="text-xs text-gray-500 mt-1">Chơi gần đây</p>
                        </div>
                        <div className="flex items-center px-2 md:px-4">
                            <Link 
                                to={`/game/${item.namespace}`}
                                className="w-10 h-10 flex items-center justify-center bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-500 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white rounded-full transition-all"
                                title="Chơi ngay"
                            >
                                <Gamepad2 size={20} />
                            </Link>
                        </div>
                    </div>
                );
            }
            return null;
        })}
      </div>
    </div>
  );
};