
import { ComicResponse, ComicDetailResponse, ChapterResponse } from '../types';

const BASE_URL = 'https://otruyenapi.com/v1/api';
const TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const request = async <T>(url: string, retries = MAX_RETRIES): Promise<T> => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) {
      if (response.status >= 500 && retries > 0) {
         await wait(1000); 
         return request<T>(url, retries - 1);
      }
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error: any) {
    if (retries > 0 && (error.name === 'TypeError' || error.name === 'AbortError')) {
        await wait(1000);
        return request<T>(url, retries - 1);
    }
    console.warn(`Comic API Request Failed: ${url}`, error.message);
    throw error;
  }
};

export const getComicImageUrl = (url?: string, domain?: string) => {
    if (!url) return 'https://placehold.co/300x450/1f1f1f/e5e5e5?text=No+Cover';
    if (url.startsWith('http')) return url;
    const cleanDomain = (domain || 'https://otruyenapi.com/uploads/comics').replace(/\/$/, '');
    const cleanPath = url.replace(/^\//, '');
    return `${cleanDomain}/${cleanPath}`;
};

// Home (New!) - Returns list + itemsUpdateInDay
export const fetchComicHome = async (): Promise<ComicResponse> => {
    return request<ComicResponse>(`${BASE_URL}/home`);
};

// Lists
export const fetchComicList = async (type: string, page: number = 1): Promise<ComicResponse> => {
  // Types: truyen-moi, sap-ra-mat, dang-phat-hanh, hoan-thanh
  return request<ComicResponse>(`${BASE_URL}/danh-sach/${type}?page=${page}`);
};

// Fetch ALL Categories
export const fetchAllComicCategories = async (): Promise<any> => {
    return request<any>(`${BASE_URL}/the-loai`);
};

export const fetchComicCategory = async (slug: string, page: number = 1): Promise<ComicResponse> => {
    return request<ComicResponse>(`${BASE_URL}/the-loai/${slug}?page=${page}`);
};

export const searchComics = async (keyword: string, page: number = 1): Promise<ComicResponse> => {
    return request<ComicResponse>(`${BASE_URL}/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`);
};

// Detail
export const fetchComicDetail = async (slug: string): Promise<ComicDetailResponse> => {
    return request<ComicDetailResponse>(`${BASE_URL}/truyen-tranh/${slug}`);
};

// Chapter (The detail response gives a full URL in chapter_api_data)
export const fetchChapterImages = async (apiDataUrl: string): Promise<ChapterResponse> => {
    return request<ChapterResponse>(apiDataUrl);
};
