
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMovieDetail } from "../services/api";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Server,
  Film,
  Settings,
  Info,
  Lightbulb,
  LightbulbOff,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  FastForward,
  AlertTriangle,
  Play,
  X,
} from "lucide-react";
import { useStore } from "../hooks/useStore";
import { Button } from "../components/Button";
import { VideoPlayer, PlayerType } from "../components/VideoPlayer";
import { ErrorBoundary } from "../components/ErrorBoundary";

export const Watch: React.FC = () => {
  const { slug, episodeSlug } = useParams<{
    slug: string;
    episodeSlug: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToHistory, updateProgress, history, settings } = useStore();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["movie", slug],
    queryFn: () => fetchMovieDetail(slug!),
    enabled: !!slug,
    retry: 2, // Aggressive retry
    staleTime: 1000 * 60 * 5,
  });

  const movie = data?.movie;
  const episodes = data?.episodes || [];

  // State for selected server and player
  // Initial state derived from URL ?sv=x or default 0
  const [selectedServerIdx, setSelectedServerIdx] = useState(() => {
    const svParam = searchParams.get("sv");
    return svParam ? parseInt(svParam) : 0;
  });

  // Calculate current server safely
  const currentServer = episodes[selectedServerIdx] || episodes[0];
  
  // --- LOGIC CẢI TIẾN: PHÁT HIỆN SERVER NAMEC ---
  // Thay vì check movie.source, ta check tên Server hiện tại.
  // API đã chuẩn hóa tên server có chữ "Namec" (trong services/api.ts)
  const isNamecServer = currentServer?.server_name?.toLowerCase().includes("namec") || (movie?.source === "namec" && episodes.length === 1);

  // Initial initialization may happen before settings are hydrated from LocalStorage.
  // We use useEffect to sync settings later.
  const [playerType, setPlayerType] = useState<PlayerType>(settings.defaultPlayer); 
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  // UI States
  const [isLightOff, setIsLightOff] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%
  const [isAutoNext, setIsAutoNext] = useState(settings.autoNextEpisode); 

  // PLAYBACK STATE
  const [savedProgress, setSavedProgress] = useState(0);
  const [resumeAvailable, setResumeAvailable] = useState<number | null>(null);

  // SELF-HEALING: Key to force unmount/remount of player on fatal error
  const [playerKey, setPlayerKey] = useState(0);

  const playerRef = useRef<HTMLDivElement>(null);

  // --- SETTINGS SYNC LOGIC ---
  // Sync state with settings when settings change (e.g. after hydration from localStorage)
  // or when switching to a new movie/server type
  useEffect(() => {
    if (isNamecServer) {
        setPlayerType("embed");
    } else {
        // Only reset to default settings if we just mounted or changed movie, 
        // to avoid overriding manual changes during playback? 
        // Actually, for simplicity and to ensure "Settings" page works, we sync here.
        setPlayerType(settings.defaultPlayer);
    }
    setIsAutoNext(settings.autoNextEpisode);
  }, [settings.defaultPlayer, settings.autoNextEpisode, isNamecServer, slug]); 

  // Handle URL param changes (e.g. back button navigation)
  useEffect(() => {
    const svParam = searchParams.get("sv");
    if (svParam) {
      const idx = parseInt(svParam);
      if (!isNaN(idx) && idx !== selectedServerIdx) {
        setSelectedServerIdx(idx);
      }
    }
  }, [searchParams]);

  // --- EPISODE CHANGE & HISTORY CHECK LOGIC ---
  useEffect(() => {
    window.scrollTo(0, 0);
    setFallbackMessage(null);
    setSavedProgress(0);

    // Check History for Resume Point
    const historyItem = history.find((h) => h.episodeSlug === episodeSlug);

    if (historyItem && historyItem.progress && historyItem.progress > 60) {
      const duration = historyItem.duration || 0;
      if (duration === 0 || historyItem.progress < duration - 60) {
        setResumeAvailable(historyItem.progress);
      } else {
        setResumeAvailable(null);
      }
    } else {
      setResumeAvailable(null);
    }

    // Reset Player Key to ensure clean start at 0
    setPlayerKey((prev) => prev + 1);
  }, [slug, episodeSlug]); 

  // Check if current server actually has this episode.
  // If not, try to find a server that DOES have it (auto-correction).
  useEffect(() => {
    if (episodes.length > 0 && episodeSlug) {
      const currentServerData = episodes[selectedServerIdx]?.server_data;
      const serverHasEpisode = currentServerData?.some(
        (e) => e.slug === episodeSlug,
      );

      if (!serverHasEpisode) {
        // Current server doesn't have it. Find one that does.
        const validServerIdx = episodes.findIndex((s) =>
          s.server_data.some((e) => e.slug === episodeSlug),
        );
        if (validServerIdx !== -1) {
          setSelectedServerIdx(validServerIdx);
          // Update URL to reflect auto-fix, but replace history to not break back button
          setSearchParams({ sv: validServerIdx.toString() }, { replace: true });
        }
      }
    }
  }, [episodes, episodeSlug, selectedServerIdx, setSearchParams]);

  useEffect(() => {
    if (movie && episodeSlug && episodes.length > 0) {
      let currentEpName = "";
      for (const server of episodes) {
        const found = server.server_data.find((e) => e.slug === episodeSlug);
        if (found) {
          currentEpName = found.name;
          break;
        }
      }

      if (currentEpName) {
        const existingHistory = history.find(
          (h) => h.episodeSlug === episodeSlug,
        );
        addToHistory({
          movieSlug: movie.slug,
          movieName: movie.name,
          moviePoster: movie.poster_url,
          episodeSlug: episodeSlug!,
          episodeName: currentEpName,
          timestamp: Date.now(),
          progress: existingHistory?.progress || 0,
          duration: existingHistory?.duration || 0,
        });
      }
    }
  }, [movie, episodeSlug, episodes]);

  useEffect(() => {
    if (isLightOff) {
      document.body.style.overflow = "hidden";
      if (playerRef.current) {
        playerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLightOff]);

  const handleZoom = (increment: boolean) => {
    setZoomLevel((prev) => {
      const newZoom = increment ? prev + 0.1 : prev - 0.1;
      return Math.max(0.5, Math.min(newZoom, 1.5));
    });
  };

  const handleToggleAutoNext = () => {
    setIsAutoNext(!isAutoNext);
  };

  const handleResumeClick = () => {
    if (resumeAvailable) {
      setSavedProgress(resumeAvailable);
      setResumeAvailable(null);
      setPlayerKey((prev) => prev + 1);
    }
  };

  const handleCloseResume = () => {
    setResumeAvailable(null);
  };

  const handleServerChange = (idx: number) => {
    if (!movie || !episodes[idx]) return;

    const newServer = episodes[idx];
    const newServerData = newServer.server_data || [];

    // Tìm tập hiện tại trong server mới
    const episodeExistsInNewServer = newServerData.some(
      (e) => e.slug === episodeSlug,
    );

    if (episodeExistsInNewServer) {
      // Tập có cùng slug → giữ nguyên
      setSelectedServerIdx(idx);
      setSearchParams({ sv: idx.toString() }, { replace: true });
    } else {
      // Tập không tồn tại → tìm tập tương đương
      // Lấy index của tập hiện tại trong server cũ
      const currentServer = episodes[selectedServerIdx];
      const currentServerData = currentServer?.server_data || [];
      const currentEpIndex = currentServerData.findIndex(
        (e) => e.slug === episodeSlug,
      );

      // Tìm tập ở cùng vị trí trong server mới (hoặc tập đầu nếu không có)
      let targetEpisode = null;
      if (currentEpIndex !== -1 && newServerData[currentEpIndex]) {
        targetEpisode = newServerData[currentEpIndex];
      } else if (newServerData.length > 0) {
        targetEpisode = newServerData[0]; // Fallback: tập đầu tiên
      }

      if (targetEpisode) {
        // Navigate đến tập tương đương trong server mới
        navigate(`/phim/${movie.slug}/tap/${targetEpisode.slug}?sv=${idx}`);
      } else {
        // Server mới không có tập nào
        setSelectedServerIdx(idx);
        setSearchParams({ sv: idx.toString() }, { replace: true });
      }
    }
  };

  const handleProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (currentTime > 0) setSavedProgress(currentTime);

      if (episodeSlug) {
        updateProgress(episodeSlug, currentTime, duration);
      }
    },
    [episodeSlug, updateProgress],
  );

  const handleVideoEnded = useCallback(() => {
    const movieData = data?.movie;
    const episodesData = data?.episodes || [];
    const currentServer = episodesData[selectedServerIdx];
    const serverData = currentServer?.server_data || [];
    const currentEpIndex = serverData.findIndex((e) => e.slug === episodeSlug);
    const nextEp =
      currentEpIndex !== -1 && currentEpIndex < serverData.length - 1
        ? serverData[currentEpIndex + 1]
        : null;

    if (isAutoNext && nextEp && movieData) {
      // Keep the current server preference when auto-nexting
      navigate(
        `/phim/${movieData.slug}/tap/${nextEp.slug}?sv=${selectedServerIdx}`,
      );
    }
  }, [isAutoNext, data, selectedServerIdx, episodeSlug, navigate]);

  // SELF-HEALING: SMART SWITCH + HARD RESET
  // Priority: XGPlayer -> Shaka -> Video.js -> Embed
  const handleFatalError = () => {
    // If it's Namec, we are already on Embed, so we can't switch to anything else.
    if (isNamecServer) {
        setFallbackMessage("Server Namec đang gặp sự cố kết nối. Vui lòng thử lại sau.");
        return;
    }

    console.warn(
      `Watch: Fatal error on ${playerType}. Initiating Smart Switch.`,
    );
    setPlayerKey((prev) => prev + 1); // HARD RESET DOM

    if (playerType === "xgplayer") {
      setPlayerType("shaka");
      setFallbackMessage(
        "Đã chuyển sang dự phòng 1 (Shaka Player) do lỗi kết nối.",
      );
    } else if (playerType === "shaka") {
      setPlayerType("videojs");
      setFallbackMessage(
        "Đã chuyển sang dự phòng 2 (Video.js) do lỗi định dạng.",
      );
    } else if (playerType === "videojs") {
      setPlayerType("embed");
      setFallbackMessage("Đã chuyển sang dự phòng 3 (Embed) do lỗi định dạng.");
    } else if (playerType === "oplayer" || playerType === "reactplayer") {
      // Fallback to default chain if manual selection fails
      setPlayerType("xgplayer");
      setFallbackMessage("Trình phát gặp lỗi. Đang thử lại với XGPlayer.");
    } else {
      setFallbackMessage("Không thể phát video này. Vui lòng thử Server khác.");
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );

  if (error || !data || !data.status || !movie) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Lỗi tải dữ liệu
        </h3>
        <p className="text-gray-500 mb-6">
          Không tìm thấy thông tin phim hoặc máy chủ quá tải.
        </p>
        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-2"
        >
          {isRefetching ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
          Thử lại
        </Button>
      </div>
    );
  }

  const serverData = currentServer?.server_data || [];

  const currentEpIndex = serverData.findIndex((e) => e.slug === episodeSlug);
  const currentEp = currentEpIndex !== -1 ? serverData[currentEpIndex] : null;
  const prevEp = currentEpIndex > 0 ? serverData[currentEpIndex - 1] : null;
  const nextEp =
    currentEpIndex < serverData.length - 1
      ? serverData[currentEpIndex + 1]
      : null;

  const playerOptions: { id: PlayerType; name: string }[] = [
    { id: "xgplayer", name: "XGPlayer" },
    { id: "shaka", name: "Shaka Player" },
    { id: "videojs", name: "Video.js" },
    { id: "embed", name: "Embed (Dự phòng)" },
    { id: "oplayer", name: "OPlayer" },
    { id: "reactplayer", name: "ReactPlayer" },
  ];

  const toolbarContainerClass = isLightOff
    ? "bg-gray-900 border-gray-800 text-gray-300"
    : "bg-gray-100 border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300";

  const toolbarButtonClass = isLightOff
    ? "hover:bg-gray-800 text-gray-300"
    : "hover:bg-gray-200 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300";

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 relative" style={{ zoom: zoomLevel }}>
      <div
        className={`fixed inset-0 bg-black/95 z-50 transition-opacity duration-500 cursor-pointer ${isLightOff ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsLightOff(false)}
        style={{ zoom: "normal" }}
      >
        <div className="absolute top-8 right-8 text-white flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-primary transition-colors">
          <Lightbulb /> Bật đèn
        </div>
      </div>

      {fallbackMessage && (
        <div className="fixed top-20 right-4 z-[70] bg-orange-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right duration-300 max-w-sm">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{fallbackMessage}</p>
        </div>
      )}

      {/* MOBILE BACK BUTTON - User Requested Top Left */}
      <div className="md:hidden flex justify-start mb-2">
        <Link
          to={`/phim/${slug}`}
          className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform hover:text-primary dark:hover:text-primary"
        >
          <ArrowLeft size={14} /> Quay lại Danh sách tập
        </Link>
      </div>

      <div
        ref={playerRef}
        className={`w-full transition-all duration-300 ease-in-out ${isLightOff ? "z-[60] relative" : "z-0"}`}
      >
        <div
          className={`bg-black w-full shadow-2xl border border-gray-800 relative flex flex-col rounded-lg overflow-hidden mx-auto lg:max-w-5xl xl:max-w-6xl transition-all duration-300`}
        >
          <div className="w-full aspect-video">
            {currentEp && (currentEp.link_m3u8 || currentEp.link_embed) ? (
              <ErrorBoundary>
                <VideoPlayer
                  key={`${currentEp.slug}-${selectedServerIdx}-${playerType}-${playerKey}`}
                  srcM3u8={currentEp.link_m3u8}
                  srcEmbed={currentEp.link_embed}
                  poster={movie.poster_url}
                  autoPlay={true}
                  playerType={playerType}
                  onEnded={handleVideoEnded}
                  onProgress={handleProgress}
                  initialTime={savedProgress}
                  onFatalError={handleFatalError}
                />
              </ErrorBoundary>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900">
                <AlertCircle size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Không tìm thấy nguồn phát</p>
                <p className="text-sm mt-2 opacity-70">
                  Tập phim này chưa có sẵn hoặc bị lỗi server
                </p>
              </div>
            )}
          </div>

          <div
            className={`border-t p-2 md:p-3 flex flex-wrap justify-between items-center text-xs md:text-sm gap-2 z-10 relative transition-colors duration-300 ${toolbarContainerClass}`}
          >
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <button
                onClick={() => setIsLightOff(!isLightOff)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${isLightOff ? "bg-primary text-white" : toolbarButtonClass}`}
              >
                {isLightOff ? (
                  <Lightbulb size={16} />
                ) : (
                  <LightbulbOff size={16} />
                )}
                <span className="hidden sm:inline">
                  {isLightOff ? "Bật đèn" : "Tắt đèn"}
                </span>
              </button>

              <button
                onClick={handleToggleAutoNext}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                  playerType === "embed"
                    ? "opacity-50 cursor-not-allowed text-gray-500"
                    : isAutoNext
                      ? "text-primary"
                      : toolbarButtonClass
                }`}
                disabled={playerType === "embed"}
                title={
                  playerType === "embed"
                    ? "Không hỗ trợ trên Embed"
                    : "Tự động chuyển tập"
                }
              >
                {isAutoNext ? (
                  <ToggleRight size={20} />
                ) : (
                  <ToggleLeft size={20} />
                )}
                <span className="text-[10px] sm:text-sm font-medium">
                  Tự chuyển tập
                </span>
              </button>

              <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 opacity-50"></div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleZoom(false)}
                  className={`p-1.5 ${toolbarButtonClass}`}
                >
                  <ZoomOut size={16} />
                </button>
                <span className="px-1 text-xs font-mono w-8 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => handleZoom(true)}
                  className={`p-1.5 ${toolbarButtonClass}`}
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`${isLightOff ? "text-gray-400" : "text-gray-600 dark:text-gray-500"} hidden sm:inline`}
              >
                Server:{" "}
                <span className="font-medium text-primary">
                  {currentServer?.server_name}
                </span>
              </span>
            </div>
          </div>

          {resumeAvailable && resumeAvailable > 0 && (
            <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300 border-t border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full text-primary">
                  <FastForward size={16} fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm font-medium">Bạn đang xem dở tập này</p>
                  <p className="text-xs text-gray-400">
                    Tiếp tục xem từ{" "}
                    <span className="text-primary font-bold">
                      {formatTime(resumeAvailable)}
                    </span>
                    ?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCloseResume}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors text-xs"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={handleResumeClick}
                  className="px-4 py-2 bg-primary hover:bg-red-700 text-white rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1 transition-colors"
                >
                  <Play size={12} fill="currentColor" /> Xem tiếp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-200 px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
        <Info className="shrink-0 mt-0.5 w-5 h-5 text-blue-500 dark:text-blue-400" />
        <div>
          <p className="font-bold mb-1 text-blue-700 dark:text-blue-300">
            Trạng thái phát:
          </p>
          <p className="opacity-90">
            Đang sử dụng trình phát:{" "}
            <strong>
              {playerOptions.find((p) => p.id === playerType)?.name}
            </strong>
            .
            {playerType === "embed"
              ? " Một số tính năng (Lưu tiến độ, Tự chuyển tập) bị hạn chế ở chế độ này."
              : " Hỗ trợ đầy đủ tính năng."}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
            <Film size={24} /> {movie.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {currentEp ? `Đang phát: ${currentEp.name}` : "Chưa chọn tập"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            disabled={!prevEp}
            onClick={() => {
              if (prevEp) {
                navigate(
                  `/phim/${movie.slug}/tap/${prevEp.slug}?sv=${selectedServerIdx}`,
                );
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          >
            <ArrowLeft size={16} /> Tập trước
          </button>
          <button
            disabled={!nextEp}
            onClick={() => {
              if (nextEp) {
                navigate(
                  `/phim/${movie.slug}/tap/${nextEp.slug}?sv=${selectedServerIdx}`,
                );
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          >
            {isAutoNext && playerType !== "embed" ? (
              <FastForward size={16} className="animate-pulse" />
            ) : null}
            Tập tiếp <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="font-bold flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
            <Server size={14} /> Chọn Server
          </h3>
          <div className="flex flex-wrap gap-2">
            {episodes.map((server, idx) => (
              <button
                key={idx}
                onClick={() => handleServerChange(idx)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors border ${
                  selectedServerIdx === idx
                    ? "bg-primary border-primary text-white"
                    : "bg-transparent border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-white"
                }`}
              >
                {server.server_name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
            <Settings size={14} /> Đổi Trình Phát (Nếu lag)
          </h3>
          {isNamecServer ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic px-2 py-1 border border-dashed border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800/50">
              Nguồn Namec chỉ hỗ trợ phát Embed (không hỗ trợ Player khác).
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {playerOptions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPlayerType(p.id);
                    setFallbackMessage(null);
                    setPlayerKey((k) => k + 1); // Reset on manual switch too
                  }}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors border ${
                    playerType === p.id
                      ? "bg-primary border-primary text-white"
                      : "bg-transparent border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-white"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="font-bold mb-4 text-gray-900 dark:text-white">
          Danh sách tập ({serverData.length})
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          {serverData.length > 0 ? (
            serverData.map((ep) => (
              <button
                key={ep.slug}
                onClick={() =>
                  navigate(
                    `/phim/${movie.slug}/tap/${ep.slug}?sv=${selectedServerIdx}`,
                  )
                }
                className={`py-2 px-1 text-sm rounded font-medium truncate transition-all ${
                  ep.slug === episodeSlug
                    ? "bg-primary text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                }`}
                title={ep.name}
              >
                {ep.name}
              </button>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 italic py-4">
              Đang cập nhật...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
