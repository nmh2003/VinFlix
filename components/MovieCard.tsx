import React from "react";
import { Link } from "react-router-dom";
import { Movie } from "../types";
import { getImageUrl } from "../services/api";
import { Play } from "lucide-react";

interface MovieCardProps {
  movie: Movie;
  domainImage?: string; // Sometimes provided by parent
}

const FALLBACK_IMAGE =
  "https://yt3.googleusercontent.com/n--_Eh0Xsi4GX-AYU5n6jyIjx_KqEPnmvJFjoLr68b-5CVOCpFgvBVEVH3IM_uLTCoQ8DDjE=s900-c-k-c0x00ffffff-no-rj";

// OPTIMIZATION: Memoize component to prevent re-renders when parent state changes (e.g. filter changes)
export const MovieCard: React.FC<MovieCardProps> = React.memo(
  ({ movie, domainImage }) => {
    // Ưu tiên dùng domain riêng từ item (cho trường hợp merge 2 API)
    const effectiveDomain = (movie as any)._imageDomain || domainImage;

    // Fallback: poster_url -> thumb_url -> empty (will use fallback image)
    const imageUrl = movie.poster_url || movie.thumb_url || "";
    const posterSrc = getImageUrl(imageUrl, effectiveDomain);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const target = e.currentTarget;

      // First fallback: try thumb_url if we were using poster_url
      if (
        target.src === posterSrc &&
        movie.thumb_url &&
        movie.poster_url &&
        imageUrl === movie.poster_url
      ) {
        const thumbSrc = getImageUrl(movie.thumb_url, effectiveDomain);
        target.src = thumbSrc;
        return;
      }

      // Second fallback: Netflix fallback image
      if (target.src !== FALLBACK_IMAGE) {
        target.src = FALLBACK_IMAGE;
      } else {
        // Final fallback: placeholder
        target.src = "https://placehold.co/300x450/1f1f1f/e5e5e5?text=No+Image";
      }
    };

    return (
      <Link
        to={`/phim/${movie.slug}`}
        className="group relative block rounded-md md:rounded-lg overflow-hidden bg-white shadow-sm dark:bg-gray-800 dark:shadow-none transition-colors duration-300"
      >
        <div className="aspect-[2/3] overflow-hidden relative">
          <img
            src={posterSrc}
            alt={movie.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={handleError}
          />
          {/* Hover Overlay - Desktop Only */}
          <div className="hidden md:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>

          {/* Quality Badge - Tiny on Mobile */}
          <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-red-600 text-white text-[9px] md:text-xs px-1 md:px-1.5 py-0.5 rounded shadow-sm">
            {movie.quality || "HD"}
          </div>

          {/* Episode Badge - Tiny on Mobile */}
          {movie.episode_current && (
            <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-yellow-600 text-white text-[9px] md:text-xs px-1 md:px-1.5 py-0.5 rounded shadow-sm max-w-[60%] truncate">
              {movie.episode_current}
            </div>
          )}
        </div>

        {/* Content - Super compact for 4-col mobile */}
        <div className="p-1 md:p-2">
          {/* UPDATED: line-clamp-3 for mobile, md:line-clamp-2 for desktop. Removed h-[2.5em] to fit content exactly. */}
          <h3
            className="text-gray-900 dark:text-white font-medium text-[10px] md:text-sm line-clamp-3 md:line-clamp-2 leading-tight"
            title={movie.name}
          >
            {movie.name}
          </h3>
          <p
            className="text-gray-500 dark:text-gray-400 text-[9px] md:text-xs truncate mt-0.5"
            title={movie.origin_name}
          >
            {movie.origin_name} ({movie.year})
          </p>
        </div>
      </Link>
    );
  },
);
