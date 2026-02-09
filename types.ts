
export interface Movie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  time?: string;
  episode_current?: string;
  quality?: string;
  lang?: string;
  source?: 'earth' | 'xayda' | 'namec'; // 'earth' = phimapi, 'xayda' = ophim, 'namec' = nguonc
}

export interface Pagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

// Response for /danh-sach/phim-moi-cap-nhat (Legacy/Simple)
export interface MovieListResponse {
  status: boolean;
  items: Movie[];
  pathImage: string;
  pagination: Pagination;
}

export interface BreadCrumbItem {
  name: string;
  slug?: string;
  isCurrent?: boolean;
  position?: number;
  path?: string; // Enhanced for custom routing
}

// Response for /v1/api/... endpoints
export interface V1ResponseData {
  seoOnPage?: any;
  breadCrumb?: BreadCrumbItem[];
  titlePage: string;
  items: Movie[];
  params: {
    pagination: Pagination;
  };
  type_list: string;
  app_domain_cdn_image: string;
}

// Status can be boolean or string 'success'/'error'
export interface V1Response {
  status: string | boolean;
  msg?: string;
  data: V1ResponseData;
}

export interface EpisodeData {
  slug: string; 
  name: string; 
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

export interface ServerData {
  server_name: string;
  server_data: EpisodeData[];
}

export interface MovieDetail extends Movie {
  content: string;
  type: string;
  status: string;
  is_copyright: boolean;
  sub_docquyen: boolean;
  chieurap: boolean;
  trailer_url: string;
  episode_total: string;
  country: { id: string; name: string; slug: string }[];
  category: { id: string; name: string; slug: string }[];
  episodes: ServerData[];
  // Enhanced fields
  tmdb?: {
    type: string | null;
    id: string | null;
    season?: number | null;
    vote_average: number;
    vote_count: number;
  };
  view?: number;
  actor?: string[];
  director?: string[];
}

export interface MovieDetailResponse {
  status: boolean | string;
  msg: string;
  movie: MovieDetail;
  episodes: ServerData[];
}

// --- IMAGES ---
export interface MovieImageItem {
  file_path: string;
  width: number;
  height: number;
  aspect_ratio: number;
  type?: 'backdrop' | 'poster';
}

export interface MovieImageResponse {
  status: boolean; // Computed wrapper
  images: MovieImageItem[];
  baseUrl?: string;
}


export interface UserHistory {
  movieSlug: string;
  movieName: string;
  moviePoster: string;
  episodeSlug: string;
  episodeName: string;
  timestamp: number; 
  progress?: number; 
  duration?: number;
}

export interface UserFavorite {
  slug: string;
  name: string;
  poster_url: string;
}

export interface User {
  username: string;
  password: string; 
}

// --- COMIC TYPES ---

export interface Comic {
  _id: string;
  name: string;
  slug: string;
  thumb_url: string;
  status: string;
  category: { id: string; name: string; slug: string }[];
  updatedAt: string;
  chaptersLatest?: { filename: string; chapter_name: string; chapter_api_data: string }[];
}

export interface ComicDetail extends Comic {
  content: string;
  author: string[];
  chapters: {
    server_name: string;
    server_data: {
      filename: string;
      chapter_name: string;
      chapter_title: string;
      chapter_api_data: string;
    }[];
  }[];
}

export interface ComicResponse {
  status: string;
  data: {
    items: Comic[];
    params: { 
        pagination: Pagination;
        itemsUpdateInDay?: number;
    };
    seoOnPage?: any;
    breadCrumb?: BreadCrumbItem[];
    titlePage?: string;
    type_list?: string;
    app_domain_cdn_image: string;
  };
}

export interface ComicDetailResponse {
  status: string;
  data: {
    item: ComicDetail;
    seoOnPage?: any;
    breadCrumb?: BreadCrumbItem[];
    app_domain_cdn_image: string;
  };
}

export interface ComicChapterImage {
  image_page: number;
  image_file: string;
}

export interface ChapterResponse {
  status: string;
  data: {
    domain_cdn: string;
    item: {
      chapter_name: string;
      chapter_title: string;
      comic_name: string;
      chapter_image: ComicChapterImage[];
      chapter_path: string;
    };
  };
}

export interface ComicHistory {
  comicSlug: string;
  comicName: string;
  comicThumb: string;
  chapterName: string;
  chapterApiData: string; // Used to identify/fetch the chapter
  timestamp: number;
}

// --- GAME TYPES (GamePix) ---

export interface GamePixItem {
  id: string;
  title: string;
  description: string;
  namespace: string; // Used for URL / slugs
  category: string;
  orientation: 'portrait' | 'landscape';
  quality_score: number; // 0 to 1
  width: number;
  height: number;
  date_created: string;
  date_published: string;
  banner_image: string;
  image: string; // Icon
  url: string; // Play URL / Embed
  thumbnailUrl?: string; // Derived
}

export interface GamePixResponse {
  items: GamePixItem[];
  next_url?: string;
  version?: string;
  title?: string;
}

export interface GameHistory {
  namespace: string;
  title: string;
  image: string;
  timestamp: number;
}

export interface GameFavorite {
  namespace: string;
  title: string;
  image: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  desktopCardSize: 'large' | 'medium' | 'small';
  mobileCardColumns: 4 | 3 | 2;
  comicInfiniteScroll: boolean;
  autoNextEpisode: boolean;
  defaultPlayer: 'xgplayer' | 'shaka' | 'videojs' | 'oplayer' | 'reactplayer';
}

export interface AppState {
  currentUser: User | null;
  favorites: UserFavorite[];
  history: UserHistory[];
  comicHistory: ComicHistory[];
  // Game State
  gameHistory: GameHistory[];
  gameFavorites: GameFavorite[];
  // Settings
  settings: AppSettings;
}

export interface FilterParams {
  category?: string;
  country?: string;
  year?: string;
  sort_lang?: string; // vietsub | thuyet-minh | long-tieng
  sort_field?: string; // modified.time | _id | year
  sort_type?: 'asc' | 'desc';
}
