import {
  MovieListResponse,
  MovieDetailResponse,
  V1Response,
  FilterParams,
  Movie,
  MovieDetail,
  ServerData,
  MovieImageResponse,
} from "../types";

const BASE_URL_EARTH = "https://phimapi.com";
const BASE_URL_XAYDA = "https://ophim1.com";
const BASE_URL_NAMEC = "https://phim.nguonc.com";
const CDN_IMAGE_XAYDA = "https://img.ophim.live/uploads/movies/";

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const simpleSlugify = (str: string) => {
  try {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  } catch (e) {
    return "";
  }
};

const request = async <T>(url: string, retries = MAX_RETRIES): Promise<T> => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(id);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("404 Not Found");
      }
      if (response.status >= 500 && retries > 0) {
        const backoff =
          1000 * (MAX_RETRIES - retries + 1) + Math.random() * 500;
        await wait(backoff);
        return request<T>(url, retries - 1);
      }
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (!json) throw new Error("API returned empty response");
    // Note: Some Xayda endpoints return status: false for not found, which we handle in logic layers
    return json;
  } catch (error: any) {
    if (
      retries > 0 &&
      (error.name === "TypeError" || error.name === "AbortError")
    ) {
      const backoff = 1500 + Math.random() * 500;
      await wait(backoff);
      return request<T>(url, retries - 1);
    }
    throw error;
  }
};

const FALLBACK_IMAGE =
  "https://yt3.googleusercontent.com/n--_Eh0Xsi4GX-AYU5n6jyIjx_KqEPnmvJFjoLr68b-5CVOCpFgvBVEVH3IM_uLTCoQ8DDjE=s900-c-k-c0x00ffffff-no-rj";

// Trusted CDN domains that can be loaded directly (faster, no proxy)
const TRUSTED_DOMAINS = [
  "img.ophim.live",
  "phimimg.com",
  "cdn.ophim.cc",
  "img.phim.net",
  "yt3.googleusercontent.com",
  "phim.nguonc.com",
];

const isTrustedDomain = (url: string) => {
  try {
    const urlObj = new URL(url);
    return TRUSTED_DOMAINS.some((domain) => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

export const getImageUrl = (url?: string, domain?: string) => {
  try {
    if (!url) return FALLBACK_IMAGE;

    // Check if it's already a full URL (Handles Namec/NguonC absolute URLs)
    if (url.startsWith("http")) {
      // OPTIMIZATION: Load directly from trusted CDN domains
      if (isTrustedDomain(url)) return url;
      // For untrusted domains, use proxy for CORS protection
      return `https://phimapi.com/image.php?url=${encodeURIComponent(url)}`;
    }

    // FIX: Robust handling for Xayda relative paths
    // If no domain provided, OR if domain is the generic Ophim host without upload path
    if (
      (!domain && !url.includes("/")) ||
      (domain && domain.includes("ophim") && !domain.includes("uploads"))
    ) {
      // Force correct path for Ophim CDN (trusted, load directly)
      return `https://img.ophim.live/uploads/movies/${url}`;
    }

    let fullUrl = url;
    if (!url.startsWith("http")) {
      const cleanDomain = (domain || "https://phimimg.com").replace(/\/$/, "");
      const cleanPath = url.replace(/^\//, "");
      fullUrl = `${cleanDomain}/${cleanPath}`;
    }

    // Auto-fix Ophim path if missing
    if (
      fullUrl.includes("img.ophim.live") &&
      !fullUrl.includes("/uploads/movies/")
    ) {
      fullUrl = fullUrl.replace(
        "img.ophim.live/",
        "img.ophim.live/uploads/movies/",
      );
    }

    // OPTIMIZATION: Return trusted CDN URLs directly (faster)
    if (isTrustedDomain(fullUrl)) return fullUrl;

    // For untrusted domains, use proxy for safety
    return `https://phimapi.com/image.php?url=${encodeURIComponent(fullUrl)}`;
  } catch (e) {
    return FALLBACK_IMAGE;
  }
};

const buildQuery = (params?: FilterParams) => {
  try {
    if (!params) return "";
    const query = new URLSearchParams();

    if (params.category) query.append("category", params.category);
    if (params.country) query.append("country", params.country);
    if (params.year) query.append("year", params.year);
    if (params.sort_lang) query.append("sort_lang", params.sort_lang);
    if (params.sort_field) query.append("sort_field", params.sort_field);
    if (params.sort_type) query.append("sort_type", params.sort_type);

    const queryString = query.toString();
    return queryString ? `&${queryString}` : "";
  } catch (e) {
    return "";
  }
};

// Helper: Normalize NguonC response to V1Response structure
const normalizeNamecToV1 = (
  namecRes: any,
  title: string = "Danh sách",
): V1Response => {
  return {
    status: namecRes.status === "success",
    data: {
      items: namecRes.items || [],
      titlePage: title,
      params: {
        pagination: {
          totalItems: namecRes.paginate?.total_items || 0,
          totalItemsPerPage: namecRes.paginate?.items_per_page || 24,
          currentPage: namecRes.paginate?.current_page || 1,
          totalPages: namecRes.paginate?.total_page || 1,
        },
      },
      type_list: "list",
      app_domain_cdn_image: "", // Namec returns full URLs
    },
  };
};

// Helper: Normalize a single Namec movie item to standard Movie structure
const normalizeNamecMovieItem = (item: any): any => {
  const normalized = { ...item };

  // Map field names to match expected structure
  if (item.original_name && !normalized.origin_name) {
    normalized.origin_name = item.original_name;
  }
  if (item.current_episode && !normalized.episode_current) {
    normalized.episode_current = item.current_episode;
  }
  if (item.language && !normalized.lang) {
    normalized.lang = item.language;
  }

  // Extract year from category if not present
  if (!normalized.year && item.category) {
    if (typeof item.category === "object" && !Array.isArray(item.category)) {
      Object.values(item.category).forEach((group: any) => {
        const groupName = group?.group?.name || "";
        if (groupName === "Năm" || groupName === "Year") {
          const list = group?.list || [];
          if (list[0]?.name) {
            normalized.year =
              parseInt(list[0].name) || new Date().getFullYear();
          }
        }
      });
    }
  }

  // Ensure year exists (fallback to current year)
  if (!normalized.year) {
    normalized.year = new Date().getFullYear();
  }

  return normalized;
};

// --- UNIFIED API FUNCTIONS ---

// 1. Unified Search: Calls Xayda, Earth, and Namec. Merges results.
export const searchMovies = async (
  keyword: string,
  limit: number = 24,
  params?: FilterParams,
): Promise<V1Response> => {
  if (!keyword) throw new Error("Keyword is required");

  // Call 3 APIs
  const [xaydaRes, earthRes, namecRes] = await Promise.allSettled([
    request<V1Response>(
      `${BASE_URL_XAYDA}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=${limit}${buildQuery(params)}`,
    ),
    request<V1Response>(
      `${BASE_URL_EARTH}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=${limit}${buildQuery(params)}`,
    ),
    request<any>(
      `${BASE_URL_NAMEC}/api/films/search?keyword=${encodeURIComponent(keyword)}`,
    ),
  ]);

  let mergedItems: Movie[] = [];
  let appDomainImage = "";

  // 1. Process Xayda (Priority 1)
  if (xaydaRes.status === "fulfilled" && xaydaRes.value.status === "success") {
    const items = xaydaRes.value.data?.items || [];
    const xaydaDomain =
      xaydaRes.value.data?.app_domain_cdn_image ||
      (xaydaRes.value.data as any)?.APP_DOMAIN_CDN_IMAGE ||
      CDN_IMAGE_XAYDA;
    appDomainImage = xaydaDomain;
    mergedItems = items.map(
      (i) =>
        ({ ...i, source: "xayda" as const, _imageDomain: xaydaDomain }) as any,
    );
  }

  // 2. Process Namec (Priority 2)
  if (namecRes.status === "fulfilled" && namecRes.value.status === "success") {
    const items = namecRes.value.items || [];
    // Deduplicate against Xayda
    const existingSlugs = new Set(mergedItems.map((i) => i.slug));
    const newItems = items
      .filter((i: any) => !existingSlugs.has(i.slug))
      .map(
        (i: any) =>
          ({ ...normalizeNamecMovieItem(i), source: "namec" as const }) as any,
      );

    mergedItems = [...mergedItems, ...newItems];
  }

  // 3. Process Earth (Priority 3)
  if (
    earthRes.status === "fulfilled" &&
    (earthRes.value.status === "success" || earthRes.value.status === true)
  ) {
    const items = earthRes.value.data?.items || [];
    const earthDomain =
      earthRes.value.data?.app_domain_cdn_image ||
      (earthRes.value.data as any)?.APP_DOMAIN_CDN_IMAGE ||
      "https://phimimg.com";

    // Deduplicate against Xayda + Namec
    const existingSlugs = new Set(mergedItems.map((i) => i.slug));
    const newItems = items
      .filter((i) => !existingSlugs.has(i.slug))
      .map(
        (i) =>
          ({
            ...i,
            source: "earth" as const,
            _imageDomain: earthDomain,
          }) as any,
      );

    mergedItems = [...mergedItems, ...newItems];
    if (!appDomainImage) appDomainImage = earthDomain;
  }

  // Fallback structure
  return {
    status: "success",
    data: {
      items: mergedItems,
      titlePage: `Tìm kiếm: ${keyword}`,
      params: {
        pagination: {
          totalItems: mergedItems.length,
          totalItemsPerPage: limit,
          currentPage: 1,
          totalPages: 1,
        },
      },
      type_list: "search",
      app_domain_cdn_image: appDomainImage,
    },
  };
};

// 2. Unified Detail: Tries Xayda -> Namec -> Earth. Merges Episodes from all.
export const fetchMovieDetailUnified = async (
  slug: string,
): Promise<MovieDetailResponse> => {
  if (!slug) throw new Error("Invalid movie slug");

  let xaydaData: any = null;
  let namecData: any = null;
  let earthData: any = null;
  let earthEpisodes: any[] = [];

  const [xaydaRes, earthRes, namecRes] = await Promise.allSettled([
    request<any>(`${BASE_URL_XAYDA}/v1/api/phim/${slug}`),
    request<any>(`${BASE_URL_EARTH}/phim/${slug}`),
    request<any>(`${BASE_URL_NAMEC}/api/film/${slug}`),
  ]);

  // Parse Xayda
  if (
    xaydaRes.status === "fulfilled" &&
    (xaydaRes.value.status === "success" || xaydaRes.value.status === true)
  ) {
    xaydaData = xaydaRes.value.data?.item; // V1 structure
  }

  // Parse Namec
  if (namecRes.status === "fulfilled" && namecRes.value.status === "success") {
    namecData = namecRes.value.movie; // Namec structure

    // NORMALIZE NAMEC DATA STRUCTURE TO MATCH MOVIE DETAIL
    if (namecData) {
      // 1. Normalize Episodes location
      if (!namecRes.value.episodes && namecData.episodes) {
        // Already in place
      } else if (namecRes.value.episodes) {
        namecData.episodes = namecRes.value.episodes;
      } else {
        namecData.episodes = [];
      }

      // 2. Normalize Directors (String -> Array)
      if (typeof namecData.director === "string") {
        namecData.director = [namecData.director];
      } else if (!namecData.director) {
        namecData.director = [];
      }

      // 3. Normalize Casts (String -> Array, map to actor)
      // Namec often uses 'casts' string instead of 'actor' array
      if (typeof namecData.casts === "string") {
        namecData.actor = namecData.casts
          .split(",")
          .map((c: string) => c.trim());
      } else if (!namecData.actor) {
        namecData.actor = [];
      }

      // 4. Normalize Category & Country (Complex Object -> Flat Array)
      if (
        namecData.category &&
        typeof namecData.category === "object" &&
        !Array.isArray(namecData.category)
      ) {
        const rawCats = namecData.category;
        let newCats: any[] = [];
        let newCountries: any[] = [];

        Object.values(rawCats).forEach((group: any) => {
          const groupName = group?.group?.name || "";
          const list = Array.isArray(group?.list) ? group.list : [];

          if (groupName === "Thể loại" || groupName === "Category") {
            newCats = list.map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug || simpleSlugify(c.name),
            }));
          }
          if (groupName === "Quốc gia" || groupName === "Country") {
            newCountries = list.map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug || simpleSlugify(c.name),
            }));
          }
          // Extract Year from Category (Namec specific)
          if (groupName === "Năm" || groupName === "Year") {
            const yearItem = list[0];
            if (yearItem && yearItem.name && !namecData.year) {
              namecData.year =
                parseInt(yearItem.name) || new Date().getFullYear();
            }
          }
        });

        namecData.category = newCats;
        namecData.country = newCountries;
      }

      // 5. Normalize Field Names to Match Expected Structure
      // Map Namec field names to standard field names used by the app
      if (namecData.original_name && !namecData.origin_name) {
        namecData.origin_name = namecData.original_name;
      }
      if (namecData.description && !namecData.content) {
        namecData.content = namecData.description;
      }
      if (namecData.current_episode && !namecData.episode_current) {
        namecData.episode_current = namecData.current_episode;
      }
      if (namecData.total_episodes && !namecData.episode_total) {
        namecData.episode_total = namecData.total_episodes;
      }
      if (namecData.language && !namecData.lang) {
        namecData.lang = namecData.language;
      }

      // 6. Ensure status field exists (check if episodes completed)
      if (
        !namecData.status &&
        namecData.episode_current &&
        namecData.episode_total
      ) {
        // Try to detect if completed (e.g. "Hoàn tất (10/10)")
        const currentStr = String(namecData.episode_current).toLowerCase();
        if (
          currentStr.includes("hoàn tất") ||
          currentStr.includes("full") ||
          currentStr.includes("completed")
        ) {
          namecData.status = "completed";
        } else {
          namecData.status = "ongoing";
        }
      }

      // 7. Ensure type field exists (single/series)
      if (!namecData.type) {
        const totalEp = namecData.episode_total || namecData.total_episodes;
        if (
          totalEp &&
          (parseInt(String(totalEp)) > 1 ||
            String(totalEp).toLowerCase().includes("tập"))
        ) {
          namecData.type = "series";
        } else {
          namecData.type = "single";
        }
      }
    }
  }

  // Parse Earth
  if (
    earthRes.status === "fulfilled" &&
    (earthRes.value.status === "success" || earthRes.value.status === true)
  ) {
    earthData = earthRes.value.movie;
    earthEpisodes = earthRes.value.episodes || [];
  }

  // DECISION LOGIC
  if (!xaydaData && !earthData && !namecData) {
    throw new Error("Movie not found on any server");
  }

  let finalMovie: MovieDetail;
  let mergedEpisodes: ServerData[] = [];

  // METADATA PRIORITY: Xayda -> Namec -> Earth
  if (xaydaData) {
    finalMovie = { ...xaydaData, source: "xayda" };
  } else if (namecData) {
    finalMovie = { ...namecData, source: "namec" };
  } else {
    finalMovie = { ...earthData, source: "earth" };
  }

  // MERGE EPISODES
  // 1. Xayda
  if (xaydaData && xaydaData.episodes) {
    xaydaData.episodes.forEach((server: any) => {
      const normalizedItems = (server.server_data || []).map((ep: any) => ({
        name: ep.name,
        slug: ep.slug,
        link_embed: ep.link_embed || ep.embed,
        link_m3u8: ep.link_m3u8 || ep.m3u8,
      }));

      mergedEpisodes.push({
        server_name: `🪐 Server Xayda: ${server.server_name}`,
        server_data: normalizedItems,
      });
    });
  }

  // 2. Namec (NguonC)
  if (namecData && namecData.episodes) {
    namecData.episodes.forEach((server: any) => {
      // Normalizing Namec Episode Structure
      const normalizedItems = (server.items || server.server_data || []).map(
        (ep: any) => ({
          name: ep.name,
          slug: ep.slug,
          // Namec dùng "embed" và "m3u8" thay vì "link_embed" và "link_m3u8" - cần normalize
          link_embed: ep.link_embed || ep.embed,
          link_m3u8: ep.link_m3u8 || ep.m3u8,
        }),
      );

      mergedEpisodes.push({
        server_name: `🌿 Server Namec: ${server.server_name}`,
        server_data: normalizedItems,
      });
    });
  }

  // 3. Earth
  if (earthEpisodes.length > 0) {
    earthEpisodes.forEach((server: any) => {
      const normalizedItems = (server.server_data || server.items || []).map(
        (ep: any) => ({
          name: ep.name,
          slug: ep.slug,
          link_embed: ep.link_embed || ep.embed,
          link_m3u8: ep.link_m3u8 || ep.m3u8,
        }),
      );

      mergedEpisodes.push({
        server_name: `🌍 Server Trái Đất: ${server.server_name}`,
        server_data: normalizedItems,
      });
    });
  }

  return {
    status: true,
    msg: "success",
    movie: finalMovie,
    episodes: mergedEpisodes,
  };
};

export const fetchMovieDetail = fetchMovieDetailUnified;

// 3. New Movies (Home) -> Chain: Xayda -> Namec -> Earth
export const fetchNewMovies = async (
  page: number = 1,
): Promise<MovieListResponse> => {
  // 1. Try Xayda
  try {
    const res = await request<V1Response>(
      `${BASE_URL_XAYDA}/v1/api/danh-sach/phim-moi?page=${page}`,
    );
    return {
      status: true,
      items: res.data.items.map((i) => ({ ...i, source: "xayda" })),
      pathImage:
        res.data.app_domain_cdn_image ||
        (res.data as any)?.APP_DOMAIN_CDN_IMAGE,
      pagination: {
        currentPage: res.data.params.pagination.currentPage,
        totalItems: res.data.params.pagination.totalItems,
        totalItemsPerPage: res.data.params.pagination.totalItemsPerPage,
        totalPages: Math.ceil(
          res.data.params.pagination.totalItems /
            res.data.params.pagination.totalItemsPerPage,
        ),
      },
    };
  } catch (e) {
    // 2. Try Namec (Fallback 1)
    try {
      console.warn("Xayda Home failed, switching to Namec");
      const res = await request<any>(
        `${BASE_URL_NAMEC}/api/films/phim-moi-cap-nhat?page=${page}`,
      );
      return {
        status: true,
        items: (res.items || []).map((i: any) => ({
          ...normalizeNamecMovieItem(i),
          source: "namec",
        })),
        pathImage: "", // Full URLs
        pagination: {
          currentPage: res.paginate?.current_page || 1,
          totalItems: res.paginate?.total_items || 0,
          totalItemsPerPage: res.paginate?.items_per_page || 10,
          totalPages: res.paginate?.total_page || 1,
        },
      };
    } catch (e2) {
      // 3. Try Earth (Fallback 2)
      console.warn("Namec Home failed, switching to Earth");
      const res = await request<MovieListResponse>(
        `${BASE_URL_EARTH}/danh-sach/phim-moi-cap-nhat?page=${page}`,
      );
      res.items = res.items.map((i) => ({ ...i, source: "earth" }));
      return res;
    }
  }
};

// 4. Other Lists (Category, Country, Year, List) -> Chain: Xayda -> Namec -> Earth
const fetchGenericV1 = async (
  endpointPath: string,
  page: number,
  limit: number,
  params?: FilterParams,
): Promise<V1Response> => {
  // 1. Try Xayda
  try {
    const res = await request<V1Response>(
      `${BASE_URL_XAYDA}${endpointPath}?page=${page}&limit=${limit}${buildQuery(params)}`,
    );
    if (res.data?.items) {
      res.data.items = res.data.items.map((i) => ({ ...i, source: "xayda" }));
    }
    return res;
  } catch (e) {
    // 2. Try Namec (NguonC)
    // Need to map endpointPath to Namec's structure if possible
    // Xayda: /v1/api/the-loai/slug
    // Namec: /api/films/the-loai/slug
    try {
      let namecPath = endpointPath.replace("/v1/api/", "/api/films/");
      // Handle specific overrides if path structure differs
      if (endpointPath.includes("nam-phat-hanh")) {
        // Xayda: /v1/api/nam-phat-hanh/2024
        // Namec: /api/films/nam-phat-hanh/2024 (Matches)
      }

      const res = await request<any>(
        `${BASE_URL_NAMEC}${namecPath}?page=${page}`,
      );
      const v1Res = normalizeNamecToV1(res);
      if (v1Res.data.items) {
        v1Res.data.items = v1Res.data.items.map((i) => ({
          ...normalizeNamecMovieItem(i),
          source: "namec",
        }));
      }
      return v1Res;
    } catch (e2) {
      // 3. Try Earth (Legacy fallback)
      const res = await request<V1Response>(
        `${BASE_URL_EARTH}${endpointPath}?page=${page}&limit=${limit}${buildQuery(params)}`,
      );
      if (res.data?.items) {
        res.data.items = res.data.items.map((i) => ({ ...i, source: "earth" }));
      }
      return res;
    }
  }
};

export const fetchCategory = (
  slug: string,
  page: number = 1,
  limit: number = 24,
  params?: FilterParams,
) => fetchGenericV1(`/v1/api/the-loai/${slug}`, page, limit, params);

export const fetchCountry = (
  slug: string,
  page: number = 1,
  limit: number = 24,
  params?: FilterParams,
) => fetchGenericV1(`/v1/api/quoc-gia/${slug}`, page, limit, params);

export const fetchList = (
  slug: string,
  page: number = 1,
  limit: number = 24,
  params?: FilterParams,
) => fetchGenericV1(`/v1/api/danh-sach/${slug}`, page, limit, params);

export const fetchYear = (
  year: string,
  page: number = 1,
  limit: number = 24,
  params?: FilterParams,
) => fetchGenericV1(`/v1/api/nam-phat-hanh/${year}`, page, limit, params);

// V1 API: Fetch All Genres (Prefer Xayda for more options)
export const fetchAllGenres = async (): Promise<V1Response> => {
  try {
    return await request<V1Response>(`${BASE_URL_XAYDA}/v1/api/the-loai`);
  } catch {
    try {
      // Fallback to Earth
      return await request<V1Response>(`${BASE_URL_EARTH}/v1/api/the-loai`);
    } catch {
      return {
        status: false,
        data: {
          items: [],
          params: {
            pagination: {
              totalItems: 0,
              totalItemsPerPage: 0,
              currentPage: 0,
              totalPages: 0,
            },
          },
          titlePage: "",
          type_list: "",
          app_domain_cdn_image: "",
        },
      };
    }
  }
};

// V1 API: Fetch All Countries
export const fetchAllCountries = async (): Promise<V1Response> => {
  try {
    return await request<V1Response>(`${BASE_URL_XAYDA}/v1/api/quoc-gia`);
  } catch {
    try {
      return await request<V1Response>(`${BASE_URL_EARTH}/v1/api/quoc-gia`);
    } catch {
      return {
        status: false,
        data: {
          items: [],
          params: {
            pagination: {
              totalItems: 0,
              totalItemsPerPage: 0,
              currentPage: 0,
              totalPages: 0,
            },
          },
          titlePage: "",
          type_list: "",
          app_domain_cdn_image: "",
        },
      };
    }
  }
};

// V1 API: Fetch All Years (New)
export const fetchAllYears = async (): Promise<V1Response> => {
  try {
    return await request<V1Response>(`${BASE_URL_XAYDA}/v1/api/nam-phat-hanh`);
  } catch {
    // Basic fallback if API fails
    return {
      status: false,
      data: {
        items: [],
        params: {
          pagination: {
            totalItems: 0,
            totalItemsPerPage: 0,
            currentPage: 0,
            totalPages: 0,
          },
        },
        titlePage: "",
        type_list: "",
        app_domain_cdn_image: "",
      },
    };
  }
};

// EXTRAS (Xayda Only)
export const fetchPeople = async (slug: string) => {
  try {
    return await request<any>(`${BASE_URL_XAYDA}/v1/api/phim/${slug}/peoples`);
  } catch {
    return null;
  }
};

export const fetchKeywords = async (slug: string) => {
  try {
    return await request<any>(`${BASE_URL_XAYDA}/v1/api/phim/${slug}/keywords`);
  } catch {
    return null;
  }
};

export const fetchMovieImages = async (
  slug: string,
): Promise<MovieImageResponse> => {
  try {
    const res = await request<any>(
      `${BASE_URL_XAYDA}/v1/api/phim/${slug}/images`,
    );
    if (res.success || res.status === "success") {
      const rawImages = res.data?.images || [];
      // Base URL is usually hardcoded for TMDB in Xayda response, or can be constructed
      // Looking at logs: images have file_path starting with /
      return {
        status: true,
        images: rawImages,
        baseUrl: "https://image.tmdb.org/t/p/original",
      };
    }
    return { status: false, images: [] };
  } catch (e) {
    return { status: false, images: [] };
  }
};
