
import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchComicDetail, getComicImageUrl } from '../services/comicApi';
import { Loader2, BookOpen, User, List, Clock, CheckCircle, AlertCircle, RefreshCw, History } from 'lucide-react';
import { Button } from '../components/Button';
import { Helmet } from 'react-helmet';
import { useStore } from '../hooks/useStore';

export const ComicDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { comicHistory } = useStore();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['comic-detail', slug],
    queryFn: () => fetchComicDetail(slug!),
    enabled: !!slug
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;

  if (error || !data || !data.data || !data.data.item) {
     return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
             <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lỗi tải dữ liệu</h3>
             <Button onClick={() => refetch()} disabled={isRefetching} className="gap-2">
                {isRefetching ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Thử lại
            </Button>
        </div>
     );
  }

  const comic = data.data.item;
  const imageDomain = data.data.app_domain_cdn_image;
  const thumbSrc = getComicImageUrl(comic.thumb_url, imageDomain);
  const chapters = comic.chapters?.[0]?.server_data || []; // Usually only one server for comics

  // Sort chapters to find the actual First Chapter (Chapter 1)
  // Some APIs return Newest first, some Oldest first. We sort ASC to be sure.
  const firstChapter = chapters.length > 0 
    ? [...chapters].sort((a, b) => parseFloat(a.chapter_name) - parseFloat(b.chapter_name))[0]
    : null;

  // HISTORY CHECK
  const historyItem = comicHistory.find(h => h.comicSlug === slug);
  const historyChapterId = historyItem?.chapterApiData?.split('/').pop();

  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-8">
        <Helmet>
            <title>{comic.name} - Đọc Truyện Tranh | VinFlix</title>
        </Helmet>
        
        {/* Hero Info */}
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                {/* Left: Cover */}
                <div className="w-48 mx-auto md:mx-0 shrink-0">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
                        <img src={thumbSrc} alt={comic.name} className="w-full h-full object-cover" />
                    </div>
                </div>
                
                {/* Right: Info */}
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{comic.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                        <span className={`px-2 py-1 rounded text-white text-xs font-bold ${comic.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'}`}>
                            {comic.status === 'completed' ? 'Đã hoàn thành' : 'Đang tiến hành'}
                        </span>
                        <span className="flex items-center gap-1"><User size={14}/> {comic.author && comic.author.length ? comic.author.join(', ') : 'Đang cập nhật'}</span>
                        <span className="flex items-center gap-1"><Clock size={14}/> {new Date(comic.updatedAt).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Categories */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                        {comic.category.map(cat => (
                            <Link key={cat.id} to={`/truyen-tranh/the-loai/${cat.slug}`} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-200 rounded text-sm transition-colors text-gray-600 dark:text-gray-300">
                                {cat.name}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row justify-center md:justify-start gap-4">
                        {/* CONTINUE READING BUTTON */}
                        {historyItem && historyChapterId ? (
                            <Link to={`/truyen/${comic.slug}/chap/${historyChapterId}`}>
                                <Button className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white border-none w-full md:w-auto">
                                    <History size={20} /> Đọc tiếp: Chap {historyItem.chapterName}
                                </Button>
                            </Link>
                        ) : null}

                        {firstChapter ? (
                            <Link to={`/truyen/${comic.slug}/chap/${firstChapter.chapter_api_data.split('/').pop()}`}>
                                <Button className={`gap-2 ${historyItem ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'} w-full md:w-auto`}>
                                    <BookOpen size={20} /> {historyItem ? 'Đọc lại từ đầu' : 'Đọc ngay'}
                                </Button>
                            </Link>
                        ) : (
                            <Button disabled className="opacity-50">Chưa có chương</Button>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Description */}
            <div className="px-6 md:px-8 pb-8 border-t border-gray-100 dark:border-gray-800 pt-6">
                <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Nội dung</h3>
                <div 
                    className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base"
                    dangerouslySetInnerHTML={{ __html: comic.content }}
                />
            </div>
        </div>

        {/* Chapter List */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2 border-b pb-2 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white">
                <List className="text-blue-500" /> Danh sách chương ({chapters.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {chapters.map((chap, idx) => {
                    // chapter_api_data contains the full URL e.g. https://otruyenapi.com/v1/api/chapter/ID
                    // We extract the ID to use in our route
                    const chapId = chap.chapter_api_data.split('/').pop();
                    const isRead = historyChapterId === chapId;

                    return (
                        <Link 
                            key={idx}
                            to={`/truyen/${comic.slug}/chap/${chapId}`}
                            className={`block p-3 rounded transition-colors border ${
                                isRead 
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500/30' 
                                : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800'
                            }`}
                        >
                            <div className={`font-bold text-sm truncate ${isRead ? 'text-yellow-700 dark:text-yellow-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                Chapter {chap.chapter_name} {isRead && <span className="text-[10px] ml-1">(Đang đọc)</span>}
                            </div>
                            {chap.chapter_title && <div className="text-xs text-gray-500 truncate">{chap.chapter_title}</div>}
                        </Link>
                    )
                })}
            </div>
        </div>
    </div>
  );
};
