import React, { useState, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchNewMovies, fetchList, getImageUrl } from "../services/api";
import {
  fetchComicHome,
  getComicImageUrl,
  fetchComicList,
} from "../services/comicApi";
import { fetchGames } from "../services/gameApi";
import { MovieCard } from "../components/MovieCard";
import { ComicCard } from "../components/ComicCard";
import { GameCard } from "../components/GameCard";
import { Link } from "react-router-dom";
import {
  Loader2,
  RefreshCw,
  ChevronRight,
  Zap,
  Star,
  Flame,
  Tv,
  Layers,
  BookOpen,
  Gamepad2,
  Play,
  Book,
  Trophy,
  CheckCircle,
  Clock,
  Dna,
  Activity,
  TrendingUp,
  PieChart,
  Users,
  Film,
} from "lucide-react";
import { Button } from "../components/Button";
import { useStore } from "../hooks/useStore";
import { Movie, Comic, GamePixItem } from "../types";

// --- Components ---

const SectionHeader: React.FC<{
  title: string;
  icon: React.ReactNode;
  color: string;
  link: string;
}> = ({ title, icon, color, link }) => (
  <div
    className={`flex justify-between items-end mb-4 pb-2 border-b border-${color}-500/20`}
  >
    <h2
      className={`text-sm md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1 md:gap-2 uppercase tracking-tight truncate`}
    >
      <span className={`text-${color}-500`}>{icon}</span>{" "}
      <span className="truncate">{title}</span>
    </h2>
    <Link
      to={link}
      className={`text-[10px] md:text-sm font-medium text-gray-500 hover:text-${color}-500 flex items-center transition-colors shrink-0`}
    >
      <span className="hidden md:inline">Xem tất cả</span>{" "}
      <ChevronRight size={14} />
    </Link>
  </div>
);

// --- Hero Slide Component ---
interface HeroSlideProps {
  items: any[];
  type: "movie" | "comic" | "game";
  interval?: number;
}

const HeroSlide: React.FC<HeroSlideProps> = ({
  items,
  type,
  interval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);
    return () => clearInterval(timer);
  }, [items.length, interval]);

  if (!items || items.length === 0) return null;

  const item = items[currentIndex];

  // Config based on type
  let config = {
    badgeColor: "bg-red-600",
    badgeText: "Phim Hot",
    btnColor: "!bg-red-600 hover:!bg-red-700", // Force override
    icon: <Play fill="currentColor" size={14} />,
    btnText: "Xem",
    link: "",
    image: "",
    title: "",
    sub: "",
  };

  if (type === "movie") {
    config.link = `/phim/${item.slug}`;
    config.image = getImageUrl(item.poster_url); // Now handles both Earth/Xayda sources
    config.title = item.name;
    config.sub = `${item.origin_name} (${item.year})`;
    if (item.source === "xayda") config.badgeText = "Phim VIP";
  } else if (type === "comic") {
    config.badgeColor = "bg-blue-600";
    config.badgeText = "Truyện Mới";
    config.btnColor = "!bg-blue-600 hover:!bg-blue-700"; // Force override
    config.icon = <BookOpen size={14} />;
    config.btnText = "Đọc";
    config.link = `/truyen/${item.slug}`;
    config.image = getComicImageUrl(item.thumb_url);
    config.title = item.name;
    config.sub = item.chaptersLatest?.[0]?.chapter_name
      ? `Chap ${item.chaptersLatest[0].chapter_name}`
      : "Mới nhất";
  } else if (type === "game") {
    config.badgeColor = "bg-purple-600";
    config.badgeText = "Game Hot";
    config.btnColor = "!bg-purple-600 hover:!bg-purple-700"; // Force override
    config.icon = <Gamepad2 size={14} />;
    config.btnText = "Chơi";
    config.link = `/game/${item.namespace}`;
    config.image = item.banner_image || item.image;
    config.title = item.title;
    config.sub = item.category;
  }

  // Dynamic sizing for compact Game banner on mobile
  const titleClass =
    type === "game" ? "text-xs md:text-3xl" : "text-sm md:text-3xl";
  const btnSizeClass =
    type === "game" ? "h-6 md:h-10 px-3 md:px-5" : "h-7 md:h-10 px-3 md:px-5";
  const subClass = type === "game" ? "hidden md:block" : "block"; // Hide sub-text on mobile game banner to save space

  return (
    <div className="relative w-full h-full group overflow-hidden">
      {items.map((slideItem, idx) => {
        let slideImg = "";
        if (type === "movie") slideImg = getImageUrl(slideItem.poster_url);
        else if (type === "comic")
          slideImg = getComicImageUrl(slideItem.thumb_url);
        else slideImg = slideItem.banner_image || slideItem.image;

        return (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? "opacity-100" : "opacity-0"}`}
          >
            <img
              src={slideImg}
              alt=""
              className="w-full h-full object-cover object-top transition-transform duration-[10000ms] ease-linear scale-100 group-hover:scale-110"
              loading={idx === 0 ? "eager" : "lazy"}
              fetchpriority={idx === 0 ? "high" : "low"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
          </div>
        );
      })}

      <div className="absolute bottom-0 left-0 p-3 md:p-6 w-full z-10 flex flex-col items-start">
        <div
          className={`${config.badgeColor} text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded w-fit mb-1 md:mb-2 uppercase tracking-wider shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500`}
        >
          {config.badgeText}
        </div>

        {/* Responsive Text Sizes */}
        <h2
          className={`${titleClass} font-extrabold text-white mb-0.5 md:mb-1 leading-tight line-clamp-2 drop-shadow-md`}
        >
          {config.title}
        </h2>

        <p
          className={`text-gray-300 text-[10px] md:text-sm mb-2 md:mb-3 line-clamp-1 font-medium drop-shadow-sm opacity-90 ${subClass}`}
        >
          {config.sub}
        </p>

        <Link
          to={config.link}
          state={type === "game" ? { gameData: item } : null}
        >
          <Button
            size="sm"
            className={`${config.btnColor} text-white rounded-full ${btnSizeClass} py-0 text-[10px] md:text-sm gap-1 md:gap-2 shadow-lg border-none ring-1 ring-white/20`}
          >
            {config.icon} {config.btnText}
          </Button>
        </Link>

        <div className="flex gap-1 md:gap-1.5 mt-2 md:mt-4">
          {items.map((_, idx) => (
            <div
              key={idx}
              className={`h-0.5 md:h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-3 md:w-6 bg-white" : "w-1 md:w-1.5 bg-white/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Bento Hero Component ---
const HeroBento: React.FC<{
  movies: Movie[];
  comics: Comic[];
  games: GamePixItem[];
  isLoading: boolean;
}> = ({ movies, comics, games, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-[420px] md:h-[500px] w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl mb-8"></div>
    );
  }

  if (!movies.length && !comics.length && !games.length) return null;

  return (
    // MOBILE OPTIMIZED:
    // Height reduced to 420px to improve Aspect Ratio of Movie/Comic posters (wider appearance).
    // Row 1 (Movies/Comics): 70% height (~294px) -> Better for posters.
    // Row 2 (Games): 30% height (~126px) -> Low, compact banner.
    <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-[70%_30%] md:grid-rows-2 gap-2 md:gap-3 h-[420px] md:h-[450px] mb-6 md:mb-8">
      {/* Movie Slide: Left (Mobile), Big Left (Desktop) */}
      <div className="col-span-1 md:col-span-2 row-span-1 md:row-span-2 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 bg-black relative">
        <HeroSlide items={movies} type="movie" interval={6000} />
      </div>

      {/* Comic Slide: Right (Mobile), Top Right (Desktop) */}
      <div className="col-span-1 md:col-span-2 row-span-1 md:row-span-1 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 bg-black relative">
        <HeroSlide items={comics} type="comic" interval={5000} />
      </div>

      {/* Game Slide: Bottom Full Width (Mobile), Bottom Right (Desktop) */}
      <div className="col-span-2 md:col-span-2 row-span-1 md:row-span-1 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 bg-black relative">
        <HeroSlide items={games} type="game" interval={7000} />
      </div>
    </div>
  );
};

// --- Quick Nav Pills ---
const QuickNav = () => (
  <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
    <Link
      to="/danh-sach/phim-le"
      className="flex flex-col md:flex-row items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all group cursor-pointer"
    >
      <div className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full group-hover:scale-110 transition-transform">
        <Tv size={20} />
      </div>
      <div className="text-center md:text-left">
        <h3 className="font-bold text-gray-900 dark:text-white text-xs md:text-sm">
          Kho Phim
        </h3>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 hidden md:block">
          Bom tấn, chiếu rạp
        </p>
      </div>
    </Link>

    <Link
      to="/truyen-tranh"
      className="flex flex-col md:flex-row items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all group cursor-pointer"
    >
      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full group-hover:scale-110 transition-transform">
        <Book size={20} />
      </div>
      <div className="text-center md:text-left">
        <h3 className="font-bold text-gray-900 dark:text-white text-xs md:text-sm">
          Truyện Tranh
        </h3>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 hidden md:block">
          Manga, Manhwa
        </p>
      </div>
    </Link>

    <Link
      to="/games"
      className="flex flex-col md:flex-row items-center justify-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all group cursor-pointer"
    >
      <div className="p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full group-hover:scale-110 transition-transform">
        <Gamepad2 size={20} />
      </div>
      <div className="text-center md:text-left">
        <h3 className="font-bold text-gray-900 dark:text-white text-xs md:text-sm">
          Game Center
        </h3>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 hidden md:block">
          Giải trí thả ga
        </p>
      </div>
    </Link>
  </div>
);

// --- Statistics Component ---
const StatisticsSection: React.FC<{
  movieTotal: number;
  comicTotal: number;
  gameTotal: number;
  newMoviesToday: number;
  newComicsToday: number;
  newGamesToday: number;
}> = ({
  movieTotal,
  comicTotal,
  gameTotal,
  newMoviesToday,
  newComicsToday,
  newGamesToday,
}) => {
  const totalContent = movieTotal + comicTotal + gameTotal;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-xl md:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="text-green-500" size={32} />
              Thống Kê Hệ Thống
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Cập nhật dữ liệu thời gian thực từ máy chủ vệ tinh.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Hệ thống đang hoạt động
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 p-5 rounded-xl border border-red-100 dark:border-red-900/30 hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
                <Film size={24} />
              </div>
              {newMoviesToday > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  <TrendingUp size={12} /> +{newMoviesToday} hôm nay
                </span>
              )}
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">
              Tổng số phim
            </h3>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {new Intl.NumberFormat("vi-VN").format(movieTotal)}
            </div>
            <div className="mt-4 flex items-end gap-1 h-8 opacity-50">
              {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="flex-1 bg-red-500 rounded-t-sm"
                ></div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                <BookOpen size={24} />
              </div>
              {newComicsToday > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  <TrendingUp size={12} /> +{newComicsToday} hôm nay
                </span>
              )}
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">
              Tổng số truyện
            </h3>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {new Intl.NumberFormat("vi-VN").format(comicTotal)}
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>Hoàn thành</span>
                <span>Đang tiến hành</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div className="w-[65%] bg-blue-500 h-full"></div>
                <div className="w-[35%] bg-yellow-500 h-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 p-5 rounded-xl border border-purple-100 dark:border-purple-900/30 hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                <Gamepad2 size={24} />
              </div>
              {newGamesToday > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  <Zap size={12} /> +{newGamesToday} mới
                </span>
              )}
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">
              Kho Game HTML5
            </h3>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {new Intl.NumberFormat("vi-VN").format(gameTotal)}+
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <Users size={14} /> <span>12k người chơi hôm nay</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <PieChart
                size={20}
                className="text-gray-600 dark:text-gray-300"
              />
            </div>
            <div>
              <span className="block text-xs text-gray-500 uppercase">
                Tổng tài nguyên
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat("vi-VN").format(totalContent)} nội dung
                số
              </span>
            </div>
          </div>
          <div className="flex gap-1 h-3 w-full md:w-1/2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
            <div
              style={{ width: `${(movieTotal / totalContent) * 100}%` }}
              className="bg-red-500"
              title="Phim"
            ></div>
            <div
              style={{ width: `${(comicTotal / totalContent) * 100}%` }}
              className="bg-blue-500"
              title="Truyện"
            ></div>
            <div
              style={{ width: `${(gameTotal / totalContent) * 100}%` }}
              className="bg-purple-500"
              title="Game"
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Main Home Component ---
export const Home: React.FC = () => {
  const { history, settings } = useStore();

  // 1. Prepare History Data
  const continueWatchingList = history.slice(0, 5).map((h) => ({
    _id: h.movieSlug,
    name: h.movieName,
    slug: h.movieSlug,
    origin_name: h.episodeName,
    poster_url: h.moviePoster,
    thumb_url: h.moviePoster,
    year: new Date(h.timestamp).getFullYear(),
    quality: "HD",
    episode_current: `${Math.floor((h.progress || 0) / 60)}p`,
  }));

  // 2. Fetch All Sections in Parallel
  const results = useQueries({
    queries: [
      {
        queryKey: ["new-movies"],
        queryFn: () => fetchNewMovies(1),
      },
      {
        queryKey: ["comics-home"], // Use fetchComicHome for main comic data and stats
        queryFn: () => fetchComicHome(),
      },
      {
        queryKey: ["games-hot"],
        queryFn: () => fetchGames(1, 12, "quality"),
      },
      {
        queryKey: ["phim-le"],
        queryFn: () => fetchList("phim-le", 1, 12),
      },
      {
        queryKey: ["phim-bo"],
        queryFn: () => fetchList("phim-bo", 1, 12),
      },
      {
        queryKey: ["hoat-hinh"],
        queryFn: () => fetchList("hoat-hinh", 1, 12),
      },
      {
        queryKey: ["games-new"],
        queryFn: () => fetchGames(1, 12, "pubdate"),
      },
      // New Comic Queries for SEO
      {
        queryKey: ["comics-completed"],
        queryFn: () => fetchComicList("hoan-thanh", 1),
      },
      {
        queryKey: ["comics-ongoing"],
        queryFn: () => fetchComicList("dang-phat-hanh", 1),
      },
    ],
  });

  const [
    newMoviesQ,
    newComicsQ,
    gamesQ,
    singleQ,
    seriesQ,
    animeQ,
    newGamesQ,
    completedComicsQ,
    ongoingComicsQ,
  ] = results;

  const isLoading = results.some((q) => q.isLoading);
  const isAllError = results.every((q) => q.isError);

  if (isAllError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <Loader2 className="w-16 h-16 text-red-500 mb-4 animate-spin" />
        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
          Đang tải dữ liệu...
        </h3>
        <p className="text-gray-500 mb-6">Đang kết nối đến máy chủ vệ tinh.</p>
        <Button onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw size={18} /> Tải lại trang
        </Button>
      </div>
    );
  }

  // --- Data Normalization ---
  // New Movies (Unified API prefers Xayda)
  const newMoviesData = newMoviesQ.data as any;
  const newMovies = newMoviesData?.items?.slice(0, 12) || [];
  const newMoviesDomain = newMoviesData?.pathImage || "";
  const totalMoviesCount = newMoviesData?.pagination?.totalItems || 20000;

  // Comics
  const comicData = newComicsQ.data?.data;
  const rawComics = comicData?.items || [];
  const newComics = rawComics.slice(0, 10);

  // Filter for Hero: Exclude comics with no chapters
  const heroComics = rawComics
    .filter((c: any) => c.chaptersLatest && c.chaptersLatest.length > 0)
    .slice(0, 5);

  const comicDomain = comicData?.app_domain_cdn_image || "";
  const totalComicsCount = comicData?.params?.pagination?.totalItems || 10000;

  const completedComics = completedComicsQ.data?.data?.items || [];
  const ongoingComics = ongoingComicsQ.data?.data?.items || [];

  // Games
  const games = gamesQ.data?.items || [];
  const newGames = newGamesQ.data?.items?.slice(0, 9) || [];
  const hotGames = games.slice(0, 9); // Reuse fetching for SEO grid
  const totalGamesCount = 18650; // "Bluffed" Total Games

  // V1 API Helpers
  const getV1Items = (query: any) => (query.data as any)?.data?.items || [];
  const getV1Domain = (query: any) =>
    (query.data as any)?.data?.app_domain_cdn_image || "";

  // --- Real Stats Calculation ---
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Count Movies updated today
  const realNewMoviesToday = (newMoviesData?.items || []).filter((m: any) =>
    m.modified?.time?.startsWith(todayStr),
  ).length;

  // Count Comics updated today
  const realNewComicsToday =
    comicData?.params?.itemsUpdateInDay ||
    (comicData?.items || []).filter((c: any) =>
      c.updatedAt?.startsWith(todayStr),
    ).length;

  // Count Games published today
  // GamePix API often returns 0 for "today". We fake it to look active.
  const rawNewGamesToday = (newGamesQ.data?.items || []).filter(
    (g: any) =>
      g.date_published?.startsWith(todayStr) ||
      g.date_created?.startsWith(todayStr),
  ).length;

  // "Chém gió": Base 20 + date variant.
  const fakeNewGames = 24 + (new Date().getDate() % 15);
  const displayNewGamesToday =
    rawNewGamesToday > 5 ? rawNewGamesToday : fakeNewGames;

  // --- Grid Class Logic ---
  const getGridClass = () => {
    // FORCE 2 COLUMNS ON MOBILE FOR HOME PAGE ONLY (Preserves layout integrity)
    let mobileClass = "grid-cols-2";

    let desktopClass = "md:grid-cols-4 lg:grid-cols-5"; // Default Large
    if (settings.desktopCardSize === "medium")
      desktopClass = "md:grid-cols-5 lg:grid-cols-6";
    if (settings.desktopCardSize === "small")
      desktopClass = "md:grid-cols-6 lg:grid-cols-8";

    return `${mobileClass} ${desktopClass}`;
  };

  // Special Grid for "Split Section" (Movies/Comics side by side)
  const getSplitGridClass = () => {
    // FORCE 2 COLUMNS ON MOBILE FOR HOME PAGE ONLY
    let mobileClass = "grid-cols-2";

    let desktopClass = "md:grid-cols-3";
    if (settings.desktopCardSize === "medium") desktopClass = "md:grid-cols-4";
    if (settings.desktopCardSize === "small") desktopClass = "md:grid-cols-5";

    return `${mobileClass} ${desktopClass}`;
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-10">
      {/* 1. HERO SECTION (Bento Style with Slideshows) */}
      <HeroBento
        movies={newMovies.slice(0, 5)}
        comics={heroComics}
        games={games.slice(0, 5)}
        isLoading={isLoading}
      />

      {/* 2. PLATFORM INTRO TITLE */}
      <div className="text-center px-4 -mt-4 mb-2">
        <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-red-600 via-blue-600 to-purple-600 bg-clip-text text-transparent inline-block uppercase tracking-tight">
          Nền tảng giải trí 3 trong 1
        </h2>
        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest mt-1">
          ( Xem phim • Đọc truyện • Chơi game )
        </p>
      </div>

      {/* 3. QUICK NAV */}
      <QuickNav />

      {/* 3.5 TOP 10 TRENDING (Optimized) */}
      <section>
        <SectionHeader
          title="Top 10 Thịnh Hành"
          icon={<TrendingUp size={24} />}
          color="yellow"
          link="/danh-sach/phim-le"
        />
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute top-1/2 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-gray-100/50 dark:to-gray-800/30 rounded-xl -z-10" />

          <div
            className="flex overflow-x-auto gap-3 md:gap-4 pb-6 pt-2 px-4 -mx-4 md:mx-0 md:px-0 snap-x overflow-y-hidden
                scrollbar-hide 
                [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block 
                [&::-webkit-scrollbar]:h-1.5 
                [&::-webkit-scrollbar-track]:bg-transparent 
                [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 
                [&::-webkit-scrollbar-thumb]:rounded-full 
                hover:[&::-webkit-scrollbar-thumb]:bg-yellow-500 dark:hover:[&::-webkit-scrollbar-thumb]:bg-yellow-500 
                transition-colors
            "
          >
            {getV1Items(singleQ)
              .slice(0, 10)
              .map((movie: any, index: number) => {
                const getRankClass = (i: number) => {
                  // MOBILE: text-[50px] | DESKTOP: text-[90px]
                  const baseStyles =
                    "absolute -bottom-2 -left-1 md:-left-1 z-0 text-[50px] md:text-[90px] leading-none select-none font-serif font-black italic tracking-tighter transition-all duration-300";

                  // Rank 1: Luxury Gold Gradient
                  if (i === 0)
                    return `${baseStyles} bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 text-transparent bg-clip-text drop-shadow-sm`;

                  // Rank 2: Luxury Silver Gradient
                  if (i === 1)
                    return `${baseStyles} bg-gradient-to-b from-gray-200 via-gray-400 to-gray-600 text-transparent bg-clip-text drop-shadow-sm`;

                  // Rank 3: Luxury Bronze Gradient
                  if (i === 2)
                    return `${baseStyles} bg-gradient-to-b from-orange-300 via-orange-500 to-orange-800 text-transparent bg-clip-text drop-shadow-sm`;

                  // Rank 4+: High Contrast Watermark
                  return `${baseStyles} text-gray-900/20 dark:text-white/20 stroke-gray-900`;
                };

                return (
                  // MOBILE: w-[110px] (Fits ~3 items on 360px screens) | DESKTOP: w-[250px]
                  <div
                    key={movie._id}
                    className="snap-start shrink-0 relative group w-[110px] md:w-[250px]"
                  >
                    {/* Rank Number */}
                    <div className={getRankClass(index)}>{index + 1}</div>

                    {/* Card Content - Margin adjusted for smaller mobile layout (ml-4 vs ml-10) */}
                    <div className="relative z-10 ml-4 md:ml-10 transform group-hover:-translate-y-1 transition-transform duration-300 shadow-lg rounded-lg">
                      <MovieCard
                        movie={movie}
                        domainImage={getV1Domain(singleQ)}
                      />
                    </div>
                  </div>
                );
              })}
            {/* Skeletons if loading - Match new dimensions */}
            {singleQ.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 w-[110px] md:w-[250px] h-[160px] md:h-[360px] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse ml-4 md:ml-6"
                />
              ))}
          </div>
        </div>
      </section>

      {/* 4. GAME SECTION (Horizontal Scroll - "Game Hay Chiến Ngay") */}
      <section>
        <SectionHeader
          title="Game Hay Chiến Ngay"
          icon={<Gamepad2 size={24} />}
          color="purple"
          link="/games"
        />
        {gamesQ.isLoading ? (
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[140px] aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-3 md:gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x scrollbar-hide [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-500 dark:hover:[&::-webkit-scrollbar-thumb]:bg-purple-500 transition-colors">
            {games.slice(0, 16).map((g) => (
              <div
                key={g.id}
                className="min-w-[140px] md:min-w-[160px] snap-start"
              >
                <GameCard game={g} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. SPLIT SECTION: MOVIE & COMIC (Side-by-Side) */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-8">
        {/* Movies */}
        <section>
          <SectionHeader
            title="Phim Mới"
            icon={<Flame size={24} />}
            color="red"
            link="/phim-moi"
          />
          {/* 2 cols mobile, 3 cols desktop. Total 9 items, but hide 9th item on mobile to keep 2x4 grid */}
          <div className={`grid gap-1.5 md:gap-4 ${getSplitGridClass()}`}>
            {newMovies.slice(0, 9).map((m, index) => (
              <div key={m._id} className={index === 8 ? "hidden md:block" : ""}>
                <MovieCard movie={m} domainImage={newMoviesDomain} />
              </div>
            ))}
          </div>
        </section>

        {/* Comics */}
        <section>
          <SectionHeader
            title="Truyện Mới"
            icon={<BookOpen size={24} />}
            color="blue"
            link="/truyen-tranh"
          />
          <div className={`grid gap-1.5 md:gap-4 ${getSplitGridClass()}`}>
            {newComics.slice(0, 9).map((c, index) => (
              <div key={c._id} className={index === 8 ? "hidden md:block" : ""}>
                <ComicCard comic={c} domainImage={comicDomain} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 6. HISTORY SECTION (Personal) */}
      {continueWatchingList.length > 0 && (
        <section className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
          <div className="flex justify-between items-end mb-3 pb-2 border-b border-yellow-500/20">
            <h2 className="text-base md:text-xl font-bold text-yellow-600 dark:text-yellow-500 flex items-center gap-2 uppercase">
              <Zap size={20} fill="currentColor" /> Tiếp Tục Xem
            </h2>
            <Link
              to="/lich-su"
              className="text-[10px] md:text-sm font-medium text-gray-500 hover:text-yellow-500"
            >
              Xem tất cả
            </Link>
          </div>
          <div className={`grid gap-2 md:gap-4 ${getGridClass()}`}>
            {continueWatchingList.map((movie) => (
              <MovieCard key={movie.slug} movie={movie as any} />
            ))}
          </div>
        </section>
      )}

      {/* 7. MOVIE SEO: GENRE PILLS */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Layers size={20} className="text-gray-400" />
          <h3 className="font-bold text-gray-500 dark:text-gray-400 uppercase text-sm">
            Khám phá thể loại phim
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "Hành Động",
            "Tình Cảm",
            "Hài Hước",
            "Cổ Trang",
            "Tâm Lý",
            "Hình Sự",
            "Chiến Tranh",
            "Thể Thao",
            "Võ Thuật",
            "Viễn Tưởng",
            "Học Đường",
            "Gia Đình",
            "Kinh Dị",
          ].map((cat) => {
            const slug = cat
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/đ/g, "d")
              .replace(/\s+/g, "-");
            return (
              <Link
                key={slug}
                to={`/the-loai/${slug}`}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-200 text-gray-700 hover:border-red-500 hover:text-red-500 hover:bg-red-50 rounded-full text-xs md:text-sm transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </section>

      {/* 8. MOVIE LISTS (Single/Series) */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-8">
        <section>
          <SectionHeader
            title="Phim Lẻ Hot"
            icon={<Star size={20} />}
            color="orange"
            link="/danh-sach/phim-le"
          />
          <div className={`grid gap-1.5 md:gap-4 ${getSplitGridClass()}`}>
            {getV1Items(singleQ)
              .slice(0, 9)
              .map((m: any, index: number) => (
                <div
                  key={m._id}
                  className={index === 8 ? "hidden md:block" : ""}
                >
                  <MovieCard movie={m} domainImage={getV1Domain(singleQ)} />
                </div>
              ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="Phim Bộ Mới"
            icon={<Tv size={20} />}
            color="teal"
            link="/danh-sach/phim-bo"
          />
          <div className={`grid gap-1.5 md:gap-4 ${getSplitGridClass()}`}>
            {getV1Items(seriesQ)
              .slice(0, 9)
              .map((m: any, index: number) => (
                <div
                  key={m._id}
                  className={index === 8 ? "hidden md:block" : ""}
                >
                  <MovieCard movie={m} domainImage={getV1Domain(seriesQ)} />
                </div>
              ))}
          </div>
        </section>
      </div>

      {/* 9. ANIME SECTION (Moved UP to Movie Group) */}
      <section>
        <SectionHeader
          title="Anime & Hoạt Hình"
          icon={<span className="text-xl">⛩️</span>}
          color="pink"
          link="/danh-sach/hoat-hinh"
        />
        <div className={`grid gap-2 md:gap-4 ${getGridClass()}`}>
          {getV1Items(animeQ)
            .slice(0, 12)
            .map((m: any) => (
              <MovieCard
                key={m._id}
                movie={m}
                domainImage={getV1Domain(animeQ)}
              />
            ))}
        </div>
      </section>

      {/* 10. COMIC SEO: GENRE PILLS */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={20} className="text-gray-400" />
          <h3 className="font-bold text-gray-500 dark:text-gray-400 uppercase text-sm">
            Khám phá thể loại truyện
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "Action",
            "Comedy",
            "Drama",
            "Manhua",
            "Manhwa",
            "Ngôn Tình",
            "School Life",
            "Shounen",
            "Slice of Life",
            "Trinh Thám",
            "Đam Mỹ",
          ].map((cat) => {
            const slug = cat
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/đ/g, "d")
              .replace(/\s+/g, "-");
            return (
              <Link
                key={slug}
                to={`/truyen-tranh/the-loai/${slug}`}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 rounded-full text-xs md:text-sm transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </section>

      {/* 11. COMIC LISTS */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-8">
        <section>
          <SectionHeader
            title="Truyện Đã Hoàn Thành"
            icon={<CheckCircle size={20} />}
            color="green"
            link="/truyen-tranh/danh-sach/hoan-thanh"
          />
          <div className={`grid gap-1.5 md:gap-4 ${getSplitGridClass()}`}>
            {completedComics.slice(0, 9).map((c: any, index: number) => (
              <div key={c._id} className={index === 8 ? "hidden md:block" : ""}>
                <ComicCard comic={c} domainImage={comicDomain} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="Truyện Đang Phát Hành"
            icon={<Clock size={20} />}
            color="cyan"
            link="/truyen-tranh/danh-sach/dang-phat-hanh"
          />
          <div className={`grid gap-1.5 md:gap-4 ${getSplitGridClass()}`}>
            {ongoingComics.slice(0, 9).map((c: any, index: number) => (
              <div key={c._id} className={index === 8 ? "hidden md:block" : ""}>
                <ComicCard comic={c} domainImage={comicDomain} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 12. GAME SEO: GENRE PILLS */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Dna size={20} className="text-gray-400" />
          <h3 className="font-bold text-gray-500 dark:text-gray-400 uppercase text-sm">
            Khám phá thể loại game
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "Arcade",
            "Puzzle",
            "Action",
            "Racing",
            "Strategy",
            "Sports",
            "Shooting",
            "Zombie",
            "2 Player",
            "Girls",
          ].map((cat) => {
            // Note: Linking to /games as main catalog handles category via filter, but users can search there
            return (
              <Link
                key={cat}
                to={`/games`} // Deep linking games not fully supported without state, default to library
                className="px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-200 text-gray-700 hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50 rounded-full text-xs md:text-sm transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </section>

      {/* 13. GAME LISTS */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-8">
        <section>
          <SectionHeader
            title="Game Được Yêu Thích"
            icon={<Trophy size={20} />}
            color="yellow"
            link="/games"
          />
          <div className={`grid gap-1.5 md:gap-4 ${getSplitGridClass()}`}>
            {hotGames.map((g: any, index: number) => (
              <div key={g.id} className={index === 8 ? "hidden md:block" : ""}>
                <GameCard game={g} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="Game Mới Ra Mắt"
            icon={<Zap size={20} />}
            color="purple"
            link="/games"
          />
          <div className={`grid gap-1.5 md:gap-4 ${getSplitGridClass()}`}>
            {newGames.map((g: any, index: number) => (
              <div key={g.id} className={index === 8 ? "hidden md:block" : ""}>
                <GameCard game={g} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 14. NEW STATISTICS SECTION */}
      <StatisticsSection
        movieTotal={totalMoviesCount}
        comicTotal={totalComicsCount}
        gameTotal={totalGamesCount}
        newMoviesToday={realNewMoviesToday}
        newComicsToday={realNewComicsToday}
        newGamesToday={displayNewGamesToday}
      />
    </div>
  );
};
