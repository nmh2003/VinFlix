import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChapterImages, fetchComicDetail } from "../services/comicApi";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Moon,
  Sun,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  List,
  X,
  ChevronDown,
  CheckCircle,
  RefreshCw,
  Play,
  Pause,
  ChevronsDown,
  Settings,
  Sparkles,
  BookOpen,
  Zap,
} from "lucide-react";
import { useStore } from "../hooks/useStore";
import { Button } from "../components/Button";
// @ts-ignore
import Lottie from "lottie-react";
import { pikachuData } from "../assets/pikachuData";

// Construct URL properly: domain + path + file
const getPageUrl = (domain: string, path: string, file: string) => {
  return `${domain}/${path}/${file}`;
};

// --- COMPONENT: Anime Style Loader for Images ---
const LazyComicImage: React.FC<{
  src: string;
  alt: string;
  onManualReload: () => void;
  refreshKey: number;
}> = ({ src, alt, onManualReload, refreshKey }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src, refreshKey]);

  return (
    <div className="relative w-full min-h-[300px] md:min-h-[600px] bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Anime Loading Effect - UPDATED: z-0 to sit BEHIND the image */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
          <div className="absolute inset-0 bg-[url('https://media.istockphoto.com/id/1198263593/vector/manga-action-speed-lines-background-vector-illustration.jpg?s=612x612&w=0&k=20&c=N7PZ09F2r9lXvV5L3k4m5m7j1r2s3t4u5v6w7x8y9z')] bg-cover opacity-10 dark:opacity-5 animate-pulse"></div>
          <div className="relative flex flex-col items-center">
            {/* Use Lottie Animation for Pikachu/Lightning */}
            <div className="w-24 h-24 mb-2">
              <Lottie animationData={pikachuData} loop={true} />
            </div>
            <span className="text-xs md:text-sm font-bold text-blue-500 uppercase tracking-widest animate-pulse">
              Đang tải ảnh...
            </span>
          </div>
        </div>
      )}

      {/* Error State - z-20 to stay on top if error */}
      {error && (
        <div
          onClick={onManualReload}
          className="absolute inset-0 flex flex-col items-center justify-center z-20 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <RefreshCw className="w-10 h-10 text-red-500 mb-2" />
          <p className="text-red-500 font-bold text-sm">
            Lỗi ảnh. Chạm để tải lại.
          </p>
        </div>
      )}

      {/* Image - UPDATED: No opacity-0, always visible, z-10 to cover loader */}
      <img
        src={src}
        alt={alt}
        className="relative z-10 w-full h-auto block"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
};

// Data structure for rendering multiple chapters
interface RenderedChapter {
  id: string; // The ID from the URL/API path
  name: string;
  images: { image_file: string; image_page: number }[];
  path: string;
  domain: string;
}

export const ComicReader: React.FC = () => {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addComicToHistory, settings } = useStore();

  // View States
  const [lightsOff, setLightsOff] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Auto Scroll States
  const [isAutoScroll, setIsAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1); // 1 = Slow, 5 = Fast
  const [showScrollSettings, setShowScrollSettings] = useState(false);

  // Infinite Scroll States
  const [renderedChapters, setRenderedChapters] = useState<RenderedChapter[]>(
    [],
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Active Chapter State (For UI Sync)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    id || null,
  );

  // SELF-HEALING
  const [refreshKey, setRefreshKey] = useState(0);

  const lastScrollY = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Comic Detail (To get chapter list)
  const {
    data: comicData,
    isLoading: isComicLoading,
    error: comicError,
  } = useQuery({
    queryKey: ["comic-detail", slug],
    queryFn: () => fetchComicDetail(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  });

  // 2. Fetch Initial Chapter (Standard method)
  // We use this to trigger the initial load of content.
  const allChapters = comicData?.data?.item?.chapters?.[0]?.server_data || [];

  // Find current active chapter info from the list based on URL ID
  const currentChapterInfo = allChapters.find((c) =>
    c.chapter_api_data.endsWith(`/${id}`),
  );
  const initialApiUrl = currentChapterInfo?.chapter_api_data;

  const {
    data: initialChapData,
    isLoading: isInitialLoading,
    error: initialError,
  } = useQuery({
    queryKey: ["chapter", initialApiUrl, refreshKey],
    queryFn: () => fetchChapterImages(initialApiUrl!),
    enabled: !!initialApiUrl,
    retry: 2,
  });

  // Derived Chapter Logic
  const isDescending =
    allChapters.length > 1 &&
    parseFloat(allChapters[0].chapter_name) >
      parseFloat(allChapters[allChapters.length - 1].chapter_name);

  const getPrevChapter = (currentId: string) => {
    const idx = allChapters.findIndex((c) =>
      c.chapter_api_data.endsWith(`/${currentId}`),
    );
    if (idx === -1) return null;
    return isDescending
      ? idx < allChapters.length - 1
        ? allChapters[idx + 1]
        : null
      : idx > 0
        ? allChapters[idx - 1]
        : null;
  };

  const getNextChapter = (currentId: string) => {
    const idx = allChapters.findIndex((c) =>
      c.chapter_api_data.endsWith(`/${currentId}`),
    );
    if (idx === -1) return null;
    return isDescending
      ? idx > 0
        ? allChapters[idx - 1]
        : null
      : idx < allChapters.length - 1
        ? allChapters[idx + 1]
        : null;
  };

  // --- LOGIC: Initialize Rendered Chapters ---
  useEffect(() => {
    // When ID changes (route change), we reset and load the first chapter
    if (initialChapData?.data?.item) {
      const item = initialChapData.data.item;
      setRenderedChapters([
        {
          id: id!,
          name: item.chapter_name,
          images: item.chapter_image,
          path: item.chapter_path,
          domain: initialChapData.data.domain_cdn,
        },
      ]);
      setActiveChapterId(id!);
      window.scrollTo(0, 0);
      setIsAutoScroll(false);
    }
  }, [id, initialChapData]);

  // --- LOGIC: Load More (Infinite Scroll) ---
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || renderedChapters.length === 0 || isComicLoading)
      return;

    const lastRendered = renderedChapters[renderedChapters.length - 1];
    const nextChapInfo = getNextChapter(lastRendered.id);

    if (nextChapInfo) {
      setIsLoadingMore(true);
      try {
        const res = await fetchChapterImages(nextChapInfo.chapter_api_data);
        if (res.data?.item) {
          const item = res.data.item;
          const nextId = nextChapInfo.chapter_api_data.split("/").pop()!;

          setRenderedChapters((prev) => [
            ...prev,
            {
              id: nextId,
              name: item.chapter_name,
              images: item.chapter_image,
              path: item.chapter_path,
              domain: res.data.domain_cdn,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to auto-load next chapter", err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [isLoadingMore, renderedChapters, allChapters, isDescending]);

  // --- LOGIC: Intersection Observer for Infinite Scroll Loading ---
  useEffect(() => {
    // IF INFINITE SCROLL DISABLED: Do not observe.
    if (!settings.comicInfiniteScroll) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: "400px" },
    );

    if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current);
    return () => observer.disconnect();
  }, [handleLoadMore, settings.comicInfiniteScroll]);

  // --- LOGIC: Active Chapter Tracker (Sync Header/Footer) ---
  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const visibleId = entry.target.getAttribute("data-id");
          if (visibleId && visibleId !== activeChapterId) {
            setActiveChapterId(visibleId);
            // Silent URL Update (Better UX without full reload)
            const newPath = `/truyen/${slug}/chap/${visibleId}`;
            window.history.replaceState(null, "", "#" + newPath);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "-45% 0px -45% 0px", // Trigger when chapter hits the middle 10% of screen
      threshold: 0,
    });

    const sections = document.querySelectorAll(".chapter-section");
    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, [renderedChapters, activeChapterId, slug]);

  // --- LOGIC: Auto Scroll ---
  useEffect(() => {
    if (isAutoScroll) {
      const speedFactor = scrollSpeed * 0.5;
      const scrollStep = () => {
        window.scrollBy(0, 1 + Math.floor(speedFactor));
        scrollIntervalRef.current = requestAnimationFrame(scrollStep);
      };
      scrollIntervalRef.current = requestAnimationFrame(scrollStep);
    } else {
      if (scrollIntervalRef.current)
        cancelAnimationFrame(scrollIntervalRef.current);
    }
    return () => {
      if (scrollIntervalRef.current)
        cancelAnimationFrame(scrollIntervalRef.current);
    };
  }, [isAutoScroll, scrollSpeed]);

  // --- LOGIC: Scroll Listener (Hide Controls & Stop AutoScroll) ---
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 100) {
        setShowControls(false);
        setShowScrollSettings(false);
      } else if (currentY < lastScrollY.current) {
        setShowControls(true);
        if (isAutoScroll) setIsAutoScroll(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAutoScroll]);

  // --- LOGIC: Save History (Based on Active Chapter) ---
  useEffect(() => {
    const activeObj = allChapters.find((c) =>
      c.chapter_api_data.endsWith(`/${activeChapterId}`),
    );
    if (activeObj && comicData?.data?.item && activeChapterId) {
      addComicToHistory({
        comicSlug: slug!,
        comicName: comicData.data.item.name,
        comicThumb: comicData.data.item.thumb_url,
        chapterName: activeObj.chapter_name,
        chapterApiData: activeObj.chapter_api_data,
        timestamp: Date.now(),
      });
    }
  }, [activeChapterId, comicData, allChapters]);

  useEffect(() => {
    if (showChapterList && listRef.current) {
      const activeEl = listRef.current.querySelector(".active-chapter");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "center" });
      }
    }
  }, [showChapterList]);

  const handleZoom = (increment: boolean) => {
    setZoomLevel((prev) =>
      Math.min(Math.max(increment ? prev + 0.1 : prev - 0.1, 0.5), 2.0),
    );
  };

  const handleManualReload = () => {
    queryClient.removeQueries({ queryKey: ["chapter", initialApiUrl] });
    setRefreshKey((k) => k + 1);
  };

  const navigateToChap = (chapUrl: string) => {
    const newId = chapUrl.split("/").pop();
    navigate(`/truyen/${slug}/chap/${newId}`);
  };

  // Determine container width style
  const containerWidth = Math.min(
    768 * zoomLevel,
    window.innerWidth * zoomLevel,
  );

  if (
    isComicLoading ||
    (initialApiUrl && isInitialLoading && renderedChapters.length === 0)
  ) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-black">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Use Lottie for Main Loading */}
            <div className="w-24 h-24 mb-2">
              <Lottie animationData={pikachuData} loop={true} />
            </div>
          </div>
        </div>
        <p className="text-blue-400 mt-4 font-bold tracking-widest animate-pulse">
          LOADING DATA...
        </p>
      </div>
    );
  }

  // Error Handling
  if (comicError || !comicData?.data?.item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-gray-900 text-white">
        <AlertCircle size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Không tìm thấy truyện</h2>
        <Link to="/truyen-tranh">
          <Button>Về danh sách</Button>
        </Link>
      </div>
    );
  }

  const comicName = comicData?.data?.item?.name || "";

  // DYNAMIC HEADER/FOOTER DATA based on Active Scroll Position
  const activeChapterObj = allChapters.find((c) =>
    c.chapter_api_data.endsWith(`/${activeChapterId}`),
  );
  const currentRenderedName =
    activeChapterObj?.chapter_name || renderedChapters[0]?.name || "";
  const prevChapter = activeChapterId ? getPrevChapter(activeChapterId) : null;
  const nextChapter = activeChapterId ? getNextChapter(activeChapterId) : null;

  return (
    <div
      className={`min-h-screen ${lightsOff ? "bg-[#111]" : "bg-gray-100 dark:bg-black"}`}
    >
      {/* --- TOP NAV BAR --- */}
      <div
        className={`fixed top-0 left-0 right-0 h-14 bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-sm z-50 flex items-center justify-between px-3 md:px-4 transition-transform duration-300 ${showControls ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Link
            to={`/truyen/${slug}`}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
          </Link>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[100px] md:max-w-xs">
              {comicName}
            </span>
            <span className="text-xs text-blue-600 font-medium truncate">
              Chap {currentRenderedName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* AUTO SCROLL CONTROLS */}
          <div className="relative">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setIsAutoScroll(!isAutoScroll)}
                className={`p-1.5 rounded-md transition-all ${isAutoScroll ? "bg-blue-500 text-white shadow-sm" : "text-gray-600 dark:text-gray-300 hover:text-blue-500"}`}
                title={isAutoScroll ? "Dừng cuộn" : "Tự động cuộn"}
              >
                {isAutoScroll ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
              </button>
              <button
                onClick={() => setShowScrollSettings(!showScrollSettings)}
                className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <Settings size={14} />
              </button>
            </div>

            {/* Speed Settings Dropdown */}
            {showScrollSettings && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-3 border border-gray-200 dark:border-gray-700 min-w-[150px]">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">
                  Tốc độ cuộn: {scrollSpeed}x
                </p>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                  className="w-full accent-blue-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* ZOOM CONTROLS */}
          <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => handleZoom(false)}
              className="p-1.5 hover:text-blue-500 text-gray-600 dark:text-gray-300"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono w-9 text-center text-gray-900 dark:text-gray-200">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => handleZoom(true)}
              className="p-1.5 hover:text-blue-500 text-gray-600 dark:text-gray-300"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <button
            onClick={handleManualReload}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"
            title="Tải lại ảnh"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={() => setLightsOff(!lightsOff)}
            className={`p-2 rounded-full transition-colors ${lightsOff ? "text-yellow-400 bg-gray-800" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          >
            {lightsOff ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* --- MAIN READER AREA (INFINITE LIST) --- */}
      <div
        className="flex justify-center w-full bg-inherit select-none"
        onDoubleClick={() => setIsAutoScroll(!isAutoScroll)}
      >
        <div
          className={`pt-14 pb-20 min-h-screen transition-all duration-200 ${lightsOff ? "bg-[#111]" : "bg-white dark:bg-black shadow-2xl"}`}
          style={{
            width: zoomLevel === 1 ? "100%" : `${containerWidth}px`,
            maxWidth: zoomLevel === 1 ? "48rem" : "none",
          }}
        >
          {renderedChapters.map((chap, chapIndex) => (
            <div key={chap.id} className="chapter-section" data-id={chap.id}>
              {/* Chapter Separator (Except first) */}
              {chapIndex > 0 && (
                <div className="py-6 flex items-center justify-center gap-4 text-gray-400 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
                  <div className="h-px w-10 bg-current"></div>
                  <span className="font-bold uppercase text-sm tracking-widest flex items-center gap-2">
                    <BookOpen size={16} /> Chapter {chap.name}
                  </span>
                  <div className="h-px w-10 bg-current"></div>
                </div>
              )}

              {/* Images */}
              {chap.images.map((img, imgIndex) => (
                <LazyComicImage
                  key={`${chap.id}-${imgIndex}-${refreshKey}`}
                  src={getPageUrl(chap.domain, chap.path, img.image_file)}
                  alt={`Chapter ${chap.name} - Page ${imgIndex + 1}`}
                  refreshKey={refreshKey}
                  onManualReload={handleManualReload}
                />
              ))}
            </div>
          ))}

          {/* --- INFINITE SCROLL TRIGGER / MANUAL NEXT --- */}
          <div
            ref={bottomSentinelRef}
            className="py-8 px-4 flex justify-center w-full"
          >
            {/* CASE 1: Loading More */}
            {isLoadingMore && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold animate-pulse">
                  Đang tải chương tiếp theo...
                </p>
              </div>
            )}

            {/* CASE 2: Infinite Scroll OFF but Next Chapter Exists */}
            {!isLoadingMore &&
              !settings.comicInfiniteScroll &&
              getNextChapter(
                renderedChapters[renderedChapters.length - 1]?.id,
              ) && (
                <div className="flex flex-col items-center gap-4 py-10 w-full max-w-md text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full">
                    <CheckCircle className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Đã hết chương{" "}
                      {renderedChapters[renderedChapters.length - 1]?.name}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Chuyển sang chương kế tiếp?
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const next = getNextChapter(
                        renderedChapters[renderedChapters.length - 1]?.id,
                      );
                      if (next) navigateToChap(next.chapter_api_data);
                    }}
                    className="w-full gap-2 py-3"
                  >
                    Chương tiếp theo <ArrowRight size={18} />
                  </Button>
                </div>
              )}

            {/* CASE 3: End of Comic (No Next Chapter) */}
            {!isLoadingMore &&
              !getNextChapter(
                renderedChapters[renderedChapters.length - 1]?.id,
              ) && (
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border border-green-100 dark:border-green-900/30">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Đã đọc đến chương mới nhất!
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Hãy quay lại sau nhé.
                  </p>
                  <Link
                    to={`/truyen/${slug}`}
                    className="inline-block mt-4 text-blue-500 font-bold hover:underline"
                  >
                    Quay lại trang truyện
                  </Link>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* --- BOTTOM NAVIGATION (Synced with Scroll) --- */}
      <div
        className={`fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 z-50 flex items-center justify-between px-4 md:justify-center md:gap-8 transition-transform duration-300 ${showControls ? "translate-y-0" : "translate-y-full"}`}
      >
        <Button
          variant="secondary"
          disabled={!prevChapter}
          onClick={() =>
            prevChapter && navigateToChap(prevChapter.chapter_api_data)
          }
          className="w-10 h-10 p-0 rounded-full flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </Button>

        <button
          onClick={() => setShowChapterList(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-6 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
        >
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
            Chapter
          </span>
          <div className="flex items-center gap-2 text-sm md:text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-500">
            <List size={16} />
            <span>{currentRenderedName}</span>
            <ChevronDown size={14} />
          </div>
        </button>

        {/* Next button jumps to Active+1. Useful for manually skipping a boring chapter. */}
        <Button
          variant="primary"
          disabled={!nextChapter}
          onClick={() =>
            nextChapter && navigateToChap(nextChapter.chapter_api_data)
          }
          className="w-10 h-10 p-0 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700"
        >
          <ArrowRight size={20} />
        </Button>
      </div>

      {/* --- CHAPTER LIST DRAWER --- */}
      {showChapterList && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowChapterList(false)}
          />
          <div className="relative w-full max-w-xs h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <List size={20} className="text-blue-500" /> Danh sách chương
              </h3>
              <button
                onClick={() => setShowChapterList(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto custom-scrollbar p-2"
              ref={listRef}
            >
              {allChapters.map((chap) => {
                const cId = chap.chapter_api_data.split("/").pop();
                const isActive = cId === activeChapterId; // Use active ID for highlighting
                return (
                  <button
                    key={cId}
                    onClick={() => navigateToChap(chap.chapter_api_data)}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-colors flex items-center justify-between group ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md active-chapter"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div>
                      <div
                        className={`font-bold text-sm ${isActive ? "text-white" : "text-gray-900 dark:text-white"}`}
                      >
                        Chapter {chap.chapter_name}
                      </div>
                    </div>
                    {isActive && <CheckCircle className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
