
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchComicList, fetchComicCategory, searchComics, fetchAllComicCategories } from '../services/comicApi';
import { ComicCard } from '../components/ComicCard';
import { Pagination } from '../components/Pagination';
import { Loader2, Filter, X, RefreshCw, Search, BookOpen } from 'lucide-react';
import { Button } from '../components/Button';
import { Comic } from '../types';
import { useStore } from '../hooks/useStore';

type PageType = 'new' | 'search' | 'list' | 'category';

interface ComicCatalogProps {
  type: PageType;
}

export const ComicCatalog: React.FC<ComicCatalogProps> = ({ type }) => {
  const { slug, page: pageParam } = useParams<{ slug: string; page?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useStore();
  
  const queryKeyword = searchParams.get('keyword') || '';
  const initialPage = pageParam ? parseInt(pageParam) : 1;
  const [page, setPage] = useState(initialPage);

  // Local state for mobile search input
  const [localSearch, setLocalSearch] = useState(queryKeyword);
  useEffect(() => { setLocalSearch(queryKeyword); }, [queryKeyword]);

  useEffect(() => {
    setPage(pageParam ? parseInt(pageParam) : 1);
  }, [pageParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
        navigate(`/truyen-tranh/tim-kiem?keyword=${encodeURIComponent(localSearch)}`);
    }
  };

  // 1. Fetch Categories Dynamically
  const { data: categoryData } = useQuery({
      queryKey: ['comic-categories-list'],
      queryFn: fetchAllComicCategories,
      staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours since categories rarely change
  });

  const categories = categoryData?.data?.items || [];

  // 2. Fetch Comics Content
  const fetcher = async () => {
    try {
        if (type === 'search') {
            if (!queryKeyword) return { status: 'success', data: { items: [], params: { pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 }}, app_domain_cdn_image: '' } };
            return await searchComics(queryKeyword, page);
        }
        if (type === 'category' && slug) {
            return await fetchComicCategory(slug, page);
        }
        if (type === 'list' && slug) {
            return await fetchComicList(slug, page);
        }
        // Default to 'truyen-moi'
        return await fetchComicList('truyen-moi', page);
    } catch (e) {
        console.warn("Fetch error", e);
        return null;
    }
  };

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['comic-catalog', type, slug, queryKeyword, page],
    queryFn: fetcher,
    staleTime: 1000 * 60 * 2,
    retry: 1
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
    
    if (type === 'search') {
         // Search pagination relies on state update
    } else {
        const basePath = type === 'category' ? `/truyen-tranh/the-loai/${slug}` : 
                         type === 'list' ? `/truyen-tranh/danh-sach/${slug}` : 
                         '/truyen-tranh';
        navigate(`${basePath}/${newPage}`);
    }
  };

  const responseData = data?.data;
  const comics: Comic[] = responseData?.items || [];
  const imageDomain = responseData?.app_domain_cdn_image || '';
  const pagination = responseData?.params?.pagination;
  const title = responseData?.titlePage || (type === 'search' ? `Kết quả: ${queryKeyword}` : 'Danh Sách Truyện');

  // Breadcrumbs construction
  const crumbs = [
      { name: 'Truyện Tranh', path: '/truyen-tranh' },
      ...(type === 'category' ? [{ name: title, isCurrent: true }] : []),
      ...(type === 'list' ? [{ name: title, isCurrent: true }] : []),
      ...(type === 'search' ? [{ name: 'Tìm kiếm', isCurrent: true }] : []),
  ];

  // Dynamic Grid Class Construction (Copied from Catalog.tsx)
  const getGridClass = () => {
    let mobileClass = 'grid-cols-4'; // Default 4
    if (settings.mobileCardColumns === 3) mobileClass = 'grid-cols-3';
    if (settings.mobileCardColumns === 2) mobileClass = 'grid-cols-2';

    let desktopClass = 'md:grid-cols-4 lg:grid-cols-5'; // Default Large
    if (settings.desktopCardSize === 'medium') desktopClass = 'md:grid-cols-5 lg:grid-cols-6';
    if (settings.desktopCardSize === 'small') desktopClass = 'md:grid-cols-6 lg:grid-cols-8';

    return `${mobileClass} ${desktopClass}`;
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <div>
        {/* Header & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 md:mb-6 gap-2 md:gap-4">
            <div>
                 <div className="flex items-center text-sm text-gray-500 mb-2 gap-2">
                    <Link to="/" className="hover:text-primary"><BookOpen size={14}/></Link> 
                    {crumbs.map((c, i) => (
                        <React.Fragment key={i}>
                            <span>/</span>
                            {c.path ? <Link to={c.path} className="hover:text-primary">{c.name}</Link> : <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>}
                        </React.Fragment>
                    ))}
                 </div>
                 <h2 className="text-xl md:text-2xl font-bold border-l-4 border-blue-500 pl-3 capitalize text-gray-900 dark:text-white">{title}</h2>
            </div>
            {pagination && (
                <div className="text-xs md:text-sm text-gray-500">
                    Trang {pagination.currentPage} / {Math.ceil(pagination.totalItems / pagination.totalItemsPerPage)}
                </div>
            )}
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-3 md:p-4 rounded-lg mb-6 shadow-sm">
             <div className="flex items-center gap-2 mb-3 text-sm font-bold text-blue-500 uppercase">
                <Filter size={16}/> Bộ lọc nhanh
             </div>

             {/* Mobile Search Input (Inside Filter) */}
             <div className="md:hidden mb-4 relative">
                <form onSubmit={handleSearchSubmit}>
                    <input 
                        type="text" 
                        placeholder="Tìm truyện nhanh..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded py-2 pl-3 pr-10 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={16} />
                    </button>
                </form>
             </div>

             <div className="flex flex-wrap gap-2">
                 <Link to="/truyen-tranh/danh-sach/truyen-moi" className={`px-3 py-1 rounded text-xs border ${slug === 'truyen-moi' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-700 hover:border-blue-500'}`}>Truyện Mới</Link>
                 <Link to="/truyen-tranh/danh-sach/dang-phat-hanh" className={`px-3 py-1 rounded text-xs border ${slug === 'dang-phat-hanh' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-700 hover:border-blue-500'}`}>Đang Phát Hành</Link>
                 <Link to="/truyen-tranh/danh-sach/hoan-thanh" className={`px-3 py-1 rounded text-xs border ${slug === 'hoan-thanh' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-700 hover:border-blue-500'}`}>Hoàn Thành</Link>
             </div>
             
             {/* DYNAMIC CATEGORIES RENDERED HERE */}
             <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                 <span className="text-xs text-gray-500 block mb-2">Tất cả thể loại ({categories.length}):</span>
                 {/* UPDATE: max-h-[72px] for mobile (shows 2 rows full + half of 3rd row), md:max-h-40 for desktop */}
                 {/* Thin scrollbar override added */}
                 <div className="flex flex-wrap gap-2 max-h-[72px] md:max-h-40 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                     {categories.length > 0 ? categories.map((cat: any) => (
                         <Link key={cat._id} to={`/truyen-tranh/the-loai/${cat.slug}`} className={`px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded hover:text-blue-500 ${slug === cat.slug ? 'text-blue-500 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                             {cat.name}
                         </Link>
                     )) : (
                         <span className="text-xs text-gray-400 italic">Đang tải thể loại...</span>
                     )}
                 </div>
             </div>
        </div>

        {/* Content */}
        {comics.length === 0 ? (
            <div className="text-center py-20 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                <p className="text-gray-500 text-lg">Không tìm thấy truyện phù hợp.</p>
            </div>
        ) : (
            <div className={`grid gap-2 md:gap-4 ${getGridClass()}`}>
                {comics.map((c) => (
                    <ComicCard key={c._id} comic={c} domainImage={imageDomain} />
                ))}
            </div>
        )}

        {/* Pagination */}
        {pagination && (
            <Pagination 
                currentPage={page} 
                totalPages={Math.ceil(pagination.totalItems / pagination.totalItemsPerPage)} 
                onPageChange={handlePageChange} 
            />
        )}
    </div>
  );
};
