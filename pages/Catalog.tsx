
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  searchMovies, fetchCategory, fetchCountry, fetchList, fetchYear, fetchNewMovies,
  fetchAllGenres, fetchAllCountries, fetchAllYears
} from '../services/api';
import { searchComics } from '../services/comicApi';
import { MovieCard } from '../components/MovieCard';
import { ComicCard } from '../components/ComicCard';
import { Breadcrumb } from '../components/Breadcrumb';
import { Pagination } from '../components/Pagination';
import { Loader2, Filter, X, RefreshCw, AlertTriangle, Search, BookOpen, Film, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/Button';
import { Movie, Comic, BreadCrumbItem, FilterParams } from '../types';
import { useStore } from '../hooks/useStore';

type PageType = 'search' | 'category' | 'country' | 'list' | 'year' | 'new';

interface CatalogProps {
  type: PageType;
}

// Static Filter Data (Fallbacks & Non-fetchable types)
const FILTERS = {
  // Fallback Categories
  categories: [
    { name: 'Hành Động', slug: 'hanh-dong' },
    { name: 'Tình Cảm', slug: 'tinh-cam' },
    { name: 'Hài Hước', slug: 'hai-huoc' },
    { name: 'Cổ Trang', slug: 'co-trang' },
    { name: 'Tâm Lý', slug: 'tam-ly' },
    { name: 'Hình Sự', slug: 'hinh-su' },
    { name: 'Chiến Tranh', slug: 'chien-tranh' },
    { name: 'Thể Thao', slug: 'the-thao' },
    { name: 'Võ Thuật', slug: 'vo-thuat' },
    { name: 'Viễn Tưởng', slug: 'vien-tuong' },
    { name: 'Kinh Dị', slug: 'kinh-di' },
    { name: 'Gia Đình', slug: 'gia-dinh' },
    { name: 'Chính Kịch', slug: 'chinh-kich' },
    { name: 'Bí Ẩn', slug: 'bi-an' },
    { name: 'Học Đường', slug: 'hoc-duong' },
    { name: 'Khoa Học', slug: 'khoa-hoc' },
  ],
  // Fallback Countries
  countries: [
    { name: 'Trung Quốc', slug: 'trung-quoc' },
    { name: 'Hàn Quốc', slug: 'han-quoc' },
    { name: 'Nhật Bản', slug: 'nhat-ban' },
    { name: 'Thái Lan', slug: 'thai-lan' },
    { name: 'Âu Mỹ', slug: 'au-my' },
    { name: 'Đài Loan', slug: 'dai-loan' },
    { name: 'Việt Nam', slug: 'viet-nam' },
    { name: 'Hồng Kông', slug: 'hong-kong' },
    { name: 'Ấn Độ', slug: 'an-do' },
  ],
  // FULL LIST types as per API V1 + New Requested Slugs
  types: [
    { name: 'Phim Bộ', slug: 'phim-bo' },
    { name: 'Phim Lẻ', slug: 'phim-le' },
    { name: 'Chiếu Rạp', slug: 'phim-chieu-rap' },
    { name: 'Sắp Chiếu', slug: 'phim-sap-chieu' },
    { name: 'TV Shows', slug: 'tv-shows' },
    { name: 'Hoạt Hình', slug: 'hoat-hinh' },
    { name: 'Phim Bộ Đang Chiếu', slug: 'phim-bo-dang-chieu' },
    { name: 'Phim Bộ Hoàn Thành', slug: 'phim-bo-hoan-thanh' },
    { name: 'Phim Vietsub', slug: 'phim-vietsub' },
    { name: 'Phim Thuyết Minh', slug: 'phim-thuyet-minh' },
    { name: 'Phim Lồng Tiếng', slug: 'phim-long-tieng' },
  ],
  // Fallback years if API fails (back to 2000)
  years: Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => (new Date().getFullYear() - i).toString()),
  sorts: [
    { name: 'Thời gian cập nhật', field: 'modified.time' },
    { name: 'Năm sản xuất', field: 'year' },
    { name: 'Tên phim (A-Z)', field: '_id' },
  ],
  sort_langs: [
    { name: 'Vietsub', slug: 'vietsub' },
    { name: 'Thuyết Minh', slug: 'thuyet-minh' },
    { name: 'Lồng Tiếng', slug: 'long-tieng' },
  ]
};

export const Catalog: React.FC<CatalogProps> = ({ type }) => {
  const { slug, page: pageParam } = useParams<{ slug: string; page?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useStore();
  
  // Extract Filters from URL Query Params
  const queryKeyword = searchParams.get('keyword') || '';
  const queryCategory = searchParams.get('category') || '';
  const queryCountry = searchParams.get('country') || '';
  const queryYear = searchParams.get('year') || '';
  const querySortField = searchParams.get('sort_field') || 'modified.time';
  const querySortLang = searchParams.get('sort_lang') || '';
  const queryScope = searchParams.get('scope'); // 'movie' or null (unified)
  
  // Local Search State for the input field
  const [localSearch, setLocalSearch] = useState(queryKeyword);
  useEffect(() => { setLocalSearch(queryKeyword); }, [queryKeyword]);

  // Section Visibility States (For Unified Search)
  const [isComicsExpanded, setIsComicsExpanded] = useState(true);
  const [isMoviesExpanded, setIsMoviesExpanded] = useState(true);

  // Reset expansion when keyword changes
  useEffect(() => {
    setIsComicsExpanded(true);
    setIsMoviesExpanded(true);
  }, [queryKeyword, type]);

  // Internal Page State
  const initialPage = pageParam ? parseInt(pageParam) : 1;
  const [page, setPage] = useState(initialPage);

  // Determine Active Filters based on Route + Query Params
  const activeCategory = type === 'category' ? slug : queryCategory;
  const activeCountry = type === 'country' ? slug : queryCountry;
  const activeYear = type === 'year' ? slug : queryYear;
  const activeType = type === 'list' ? slug : '';

  // --- DYNAMIC DATA FETCHING ---
  const { data: dynamicGenres } = useQuery({
    queryKey: ['all-genres'],
    queryFn: fetchAllGenres,
    staleTime: 1000 * 60 * 60 * 24 // Cache for 24h
  });

  const { data: dynamicCountries } = useQuery({
    queryKey: ['all-countries'],
    queryFn: fetchAllCountries,
    staleTime: 1000 * 60 * 60 * 24 // Cache for 24h
  });

  const { data: dynamicYears } = useQuery({
    queryKey: ['all-years'],
    queryFn: fetchAllYears,
    staleTime: 1000 * 60 * 60 * 24 // Cache for 24h
  });

  // Merge Dynamic Data with Fallback
  const availableCategories = useMemo(() => {
      const apiData = dynamicGenres as any;
      const apiItems = apiData?.data?.items || apiData?.items || [];
      if (Array.isArray(apiItems) && apiItems.length > 0) {
          // Exclude 'hoat-hinh' from category dropdown to prevent conflict with List Type 'hoat-hinh'
          return apiItems.filter((c: any) => c.slug !== 'hoat-hinh');
      }
      return FILTERS.categories;
  }, [dynamicGenres]);

  const availableCountries = useMemo(() => {
      const apiData = dynamicCountries as any;
      const apiItems = apiData?.data?.items || apiData?.items || [];
      if (Array.isArray(apiItems) && apiItems.length > 0) {
          return apiItems;
      }
      return FILTERS.countries;
  }, [dynamicCountries]);

  const availableYears = useMemo(() => {
      const apiData = dynamicYears as any;
      const apiItems = apiData?.data?.items || apiData?.items || [];
      if (Array.isArray(apiItems) && apiItems.length > 0) {
          // Flatten { year: 2024 } to "2024"
          return apiItems.map((y: any) => y.year.toString());
      }
      return FILTERS.years;
  }, [dynamicYears]);


  useEffect(() => {
    if (pageParam) {
      setPage(parseInt(pageParam));
    } else {
      setPage(1);
    }
  }, [pageParam, slug, type, searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
        let targetScope = '';
        if (type === 'search') {
            if (queryScope === 'movie') targetScope = '&scope=movie';
            else targetScope = ''; 
        } else {
            targetScope = '&scope=movie';
        }
        navigate(`/tim-kiem?keyword=${encodeURIComponent(localSearch)}${targetScope}`);
    }
  };

  const fetcher = async () => {
    try {
      const params: FilterParams = {};
      const sanitize = (s: string) => s ? s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, '-') : '';

      if (activeCategory && type !== 'category') params.category = sanitize(activeCategory);
      if (activeCountry && type !== 'country') params.country = sanitize(activeCountry);
      if (activeYear && type !== 'year') params.year = activeYear;
      
      // Strict V1 API Sort Params
      params.sort_field = querySortField;
      params.sort_type = 'desc'; 
      if (querySortLang) params.sort_lang = querySortLang;

      if (type === 'new') {
        return await fetchNewMovies(page);
      }

      const limit = 36;
      const safeSlug = slug ? sanitize(slug) : '';

      if (type === 'search') {
        if (!queryKeyword.trim()) {
            return { 
                status: 'success', 
                data: { 
                    items: [], 
                    titlePage: 'Tìm kiếm', 
                    breadCrumb: [], 
                    params: { pagination: { totalItems: 0, totalItemsPerPage: limit, currentPage: 1, totalPages: 1 } } 
                } 
            };
        }
        
        // Use the new Unified Search
        if (queryScope === 'movie') {
             return await searchMovies(queryKeyword, limit, params);
        } else {
            const [movieRes, comicRes] = await Promise.all([
                searchMovies(queryKeyword, limit, params),
                searchComics(queryKeyword, 1) 
            ]);
            return {
                ...movieRes,
                extraComics: comicRes?.data?.items || [],
                extraComicDomain: comicRes?.data?.app_domain_cdn_image || ''
            };
        }
      }
      
      if (type === 'category') return await fetchCategory(safeSlug, page, limit, params);
      if (type === 'country') return await fetchCountry(safeSlug, page, limit, params);
      if (type === 'list') return await fetchList(safeSlug, page, limit, params);
      if (type === 'year') return await fetchYear(safeSlug, page, limit, params);
    } catch (err) {
      console.warn("Fetch Error in Catalog (Safely Handled):", err);
      return { 
          status: true, 
          msg: 'Error handled',
          items: [], 
          data: { 
              items: [], 
              titlePage: 'Không tìm thấy',
              breadCrumb: [], 
              params: {
                  pagination: {
                      totalItems: 0,
                      totalItemsPerPage: 20,
                      currentPage: page,
                      totalPages: 1
                  }
              }
          }, 
          pagination: { 
              totalItems: 0,
              totalItemsPerPage: 20,
              currentPage: page,
              totalPages: 1
          }
      };
    }
    return null;
  };

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: [type, slug, queryKeyword, page, activeCategory, activeCountry, activeYear, activeType, querySortField, querySortLang, queryScope],
    queryFn: fetcher,
    staleTime: 1000 * 60 * 2,
    retry: 1
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
    
    if (type === 'new') {
      navigate(`/phim-moi/${newPage}`);
    } else if (type !== 'search') {
      let basePath = '';
      if (type === 'list') basePath = `/danh-sach/${slug}`;
      if (type === 'category') basePath = `/the-loai/${slug}`;
      if (type === 'country') basePath = `/quoc-gia/${slug}`;
      if (type === 'year') basePath = `/nam/${slug}`;
      navigate(`${basePath}/${newPage}?${searchParams.toString()}`);
    } 
  };

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    
    if (key === 'category' && type === 'category' && value) { navigate(`/the-loai/${value}?${newParams.toString()}`); return; }
    if (key === 'country' && type === 'country' && value) { navigate(`/quoc-gia/${value}?${newParams.toString()}`); return; }
    if (key === 'year' && type === 'year' && value) { navigate(`/nam/${value}?${newParams.toString()}`); return; }
    if (key === 'type' && value) { navigate(`/danh-sach/${value}`); return; }

    if (type !== 'search') {
        let basePath = '';
        if (type === 'list') basePath = `/danh-sach/${slug}`;
        else if (type === 'category') basePath = `/the-loai/${slug}`;
        else if (type === 'country') basePath = `/quoc-gia/${slug}`;
        else if (type === 'year') basePath = `/nam/${slug}`;
        else if (type === 'new') basePath = `/phim-moi`;
        
        if (basePath) {
             navigate(`${basePath}/1?${newParams.toString()}`);
             return;
        }
    }
    setPage(1);
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    if (type !== 'search') {
         let basePath = '';
         if (type === 'list') basePath = `/danh-sach/${slug}`;
         else if (type === 'category') basePath = `/the-loai/${slug}`;
         else if (type === 'country') basePath = `/quoc-gia/${slug}`;
         else if (type === 'year') basePath = `/nam/${slug}`;
         else if (type === 'new') basePath = `/phim-moi`;
         if(basePath) {
             navigate(`${basePath}/1`);
             return;
         }
    }
    setSearchParams({});
    setPage(1);
    setLocalSearch('');
  };

  const normalizedData = useMemo(() => {
    let movies: Movie[] = [];
    let comics: Comic[] = []; 
    let title = '';
    let imageDomain = '';
    let comicImageDomain = '';
    let pagination = null;
    let breadCrumb: BreadCrumbItem[] = [];

    if (!data) return { movies, comics, title, imageDomain, comicImageDomain, pagination, breadCrumb };

    try {
        if (type === 'new') {
            const legacyData = data as any;
            const items = legacyData.items || legacyData.data?.items;
            if (Array.isArray(items)) {
                movies = items;
                title = 'Phim Mới Cập Nhật';
                imageDomain = legacyData.pathImage || legacyData.data?.app_domain_cdn_image || (legacyData.data as any)?.APP_DOMAIN_CDN_IMAGE || '';
                pagination = legacyData.pagination || legacyData.data?.params?.pagination;
            }
        } 
        else {
            const v1Response = data as any;
            if (v1Response.extraComics) {
                comics = v1Response.extraComics;
                comicImageDomain = v1Response.extraComicDomain || '';
            }

            if (v1Response.data) {
                const v1Data = v1Response.data;
                if (Array.isArray(v1Data.items)) {
                    movies = v1Data.items;
                }
                
                if (v1Data.titlePage) {
                    title = v1Data.titlePage;
                } else if (type === 'search') {
                    if (queryScope === 'movie') {
                        title = queryKeyword ? `Tìm phim: "${queryKeyword}"` : 'Tìm Kiếm Phim';
                    } else {
                        title = queryKeyword ? `Kết quả tổng hợp: "${queryKeyword}"` : 'Tìm Kiếm Tổng';
                    }
                } else {
                    title = slug || 'Danh sách';
                }

                imageDomain = v1Data.app_domain_cdn_image || (v1Data as any)?.APP_DOMAIN_CDN_IMAGE || '';
                if (v1Data.params && v1Data.params.pagination) {
                    pagination = v1Data.params.pagination;
                }
                
                if (Array.isArray(v1Data.breadCrumb)) {
                    breadCrumb = v1Data.breadCrumb.map((item: any) => {
                         const newItem = { ...item };
                         if (newItem.slug && !newItem.isCurrent) {
                             const s = newItem.slug.startsWith('/') ? newItem.slug : newItem.slug;
                             if (s.startsWith('/')) {
                                 newItem.path = s;
                             } else {
                                 if (type === 'category') newItem.path = `/the-loai/${s}`;
                                 else if (type === 'country') newItem.path = `/quoc-gia/${s}`;
                                 else if (type === 'year') newItem.path = `/nam/${s}`;
                                 else if (type === 'list') newItem.path = `/danh-sach/${s}`;
                                 else newItem.path = `/danh-sach/${s}`; 
                             }
                         }
                         return newItem;
                    });
                }
            }
        }
    } catch (e) {
        console.error("Error normalizing catalog data:", e);
    }
    return { movies, comics, title, imageDomain, comicImageDomain, pagination, breadCrumb };
  }, [data, type, slug, queryKeyword, queryScope]);

  const { movies, comics, title, imageDomain, comicImageDomain, pagination, breadCrumb } = normalizedData;

  const selectClass = "bg-gray-50 border border-gray-300 text-gray-900 text-[10px] md:text-sm rounded focus:ring-primary focus:border-primary block w-full p-1.5 md:p-2.5 dark:bg-black dark:border-gray-700 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-primary dark:focus:border-primary truncate pr-4";
  const labelClass = "text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium truncate";
  
  const searchPlaceholder = (type === 'search' && queryScope !== 'movie') ? "Tìm phim, truyện..." : "Tìm phim nhanh...";

  // Dynamic Grid Class Construction
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

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
             <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Đã xảy ra lỗi</h3>
             <p className="text-gray-500 mb-6">Không thể tải dữ liệu. Vui lòng thử lại.</p>
             <Button onClick={() => refetch()} disabled={isRefetching} className="gap-2">
                {isRefetching ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Thử lại
            </Button>
        </div>
    )
  }

  const calculatedTotalPages = pagination 
      ? (pagination.totalPages || Math.ceil((pagination.totalItems || 0) / (pagination.totalItemsPerPage || 24)))
      : 1;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 md:mb-6 gap-2 md:gap-4">
        <div>
           {breadCrumb && breadCrumb.length > 0 && <Breadcrumb crumbs={breadCrumb} />}
           <h2 className="text-xl md:text-2xl font-bold border-l-4 border-primary pl-3 capitalize text-gray-900 dark:text-white">{title || 'Kết Quả Tìm Kiếm'}</h2>
        </div>
        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            {pagination && <span>Trang {pagination.currentPage} / {calculatedTotalPages}</span>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-3 md:p-4 rounded-lg mb-6 md:mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs md:text-sm">
                <Filter size={16} /> Bộ Lọc Phim
            </div>
            {(queryCategory || queryCountry || queryYear || querySortLang || (querySortField && querySortField !== 'modified.time')) && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1">
                    <X size={12} /> Xóa lọc
                </button>
            )}
        </div>
        
        <div className="md:hidden mb-4 relative">
             <form onSubmit={handleSearchSubmit}>
                <input 
                    type="text" 
                    placeholder={searchPlaceholder}
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded py-2 pl-3 pr-10 text-sm focus:outline-none focus:border-primary text-gray-900 dark:text-white"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={16} />
                </button>
             </form>
        </div>
        
        {/* COMPACT GRID: 3 Columns on Mobile (grid-cols-3) */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 md:gap-3">
          <div className="col-span-1">
             <label className={labelClass}>Hình thức</label>
             <select className={selectClass} onChange={(e) => updateFilter('type', e.target.value)} value={activeType || ''}>
                <option value="">Tất cả</option>
                {FILTERS.types.map(f => <option key={f.slug} value={f.slug}>{f.name}</option>)}
              </select>
          </div>
          <div className="col-span-1">
             <label className={labelClass}>Thể loại</label>
             <select className={selectClass} onChange={(e) => updateFilter('category', e.target.value)} value={activeCategory || ''}>
                <option value="">Tất cả</option>
                {availableCategories.map((f: any) => <option key={f.slug} value={f.slug}>{f.name}</option>)}
              </select>
          </div>
          <div className="col-span-1">
             <label className={labelClass}>Quốc gia</label>
             <select className={selectClass} onChange={(e) => updateFilter('country', e.target.value)} value={activeCountry || ''}>
                <option value="">Tất cả</option>
                {availableCountries.map((f: any) => <option key={f.slug} value={f.slug}>{f.name}</option>)}
              </select>
          </div>
          <div className="col-span-1">
             <label className={labelClass}>Năm</label>
             <select className={selectClass} onChange={(e) => updateFilter('year', e.target.value)} value={activeYear || ''}>
                <option value="">Tất cả</option>
                {availableYears.map((y: string) => <option key={y} value={y}>{y}</option>)}
              </select>
          </div>
          <div className="col-span-1">
             <label className={labelClass}>Ngôn ngữ</label>
             <select className={selectClass} onChange={(e) => updateFilter('sort_lang', e.target.value)} value={querySortLang || ''}>
                <option value="">Tất cả</option>
                {FILTERS.sort_langs.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
          </div>
           <div className="col-span-1">
             <label className={labelClass}>Sắp xếp</label>
             <select className={selectClass} onChange={(e) => updateFilter('sort_field', e.target.value)} value={querySortField || ''}>
                {FILTERS.sorts.map(s => <option key={s.field} value={s.field}>{s.name}</option>)}
              </select>
          </div>
        </div>
      </div>

      {type === 'search' && comics.length > 0 && (
          <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white uppercase tracking-tight">
                    <BookOpen className="text-blue-500" size={24} /> Kết Quả Truyện Tranh
                </h3>
                <button 
                  onClick={() => setIsComicsExpanded(!isComicsExpanded)}
                  className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
                >
                   {isComicsExpanded ? 'Thu gọn' : 'Xem thêm'} 
                   {isComicsExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
              </div>
              
              {isComicsExpanded && (
                <div className={`grid gap-2 md:gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ${getGridClass()}`}>
                    {comics.map((c) => (
                        <ComicCard key={c._id} comic={c} domainImage={comicImageDomain} />
                    ))}
                </div>
              )}
              <div className="mt-4 border-b border-gray-200 dark:border-gray-800"></div>
          </div>
      )}

      <div>
         {type === 'search' && movies.length > 0 && (
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white uppercase tracking-tight">
                    <Film className="text-primary" size={24} /> Kết Quả Phim
                </h3>
                {comics.length > 0 && (
                    <button 
                        onClick={() => setIsMoviesExpanded(!isMoviesExpanded)}
                        className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
                    >
                        {isMoviesExpanded ? 'Thu gọn' : 'Xem thêm'} 
                        {isMoviesExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                )}
            </div>
         )}

         {(!movies || movies.length === 0) ? (
            <div className="text-center py-20 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
               {type === 'search' && !queryKeyword ? (
                  <div className="flex flex-col items-center text-gray-500">
                     <Search className="w-16 h-16 mb-4 opacity-50" />
                     <p className="text-lg">Nhập từ khóa để bắt đầu tìm kiếm phim & truyện</p>
                  </div>
               ) : (
                  <>
                     <p className="text-gray-500 text-lg">Không tìm thấy phim phù hợp.</p>
                     <Button variant="ghost" onClick={clearFilters} className="mt-2 text-primary hover:text-red-500">Xóa bộ lọc</Button>
                  </>
               )}
            </div>
         ) : (
            isMoviesExpanded && (
                <div className={`grid gap-2 md:gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ${getGridClass()}`}>
                {movies.map((movie: any) => (
                    <MovieCard key={movie._id} movie={movie} domainImage={imageDomain} />
                ))}
                </div>
            )
         )}
      </div>

      {pagination && isMoviesExpanded && (
        <Pagination 
          currentPage={page} 
          totalPages={calculatedTotalPages} 
          onPageChange={handlePageChange} 
        />
      )}
    </div>
  );
};
