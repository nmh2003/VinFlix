
import { GamePixResponse } from '../types';

const BASE_URL = 'https://feeds.gamepix.com/v2/json';
const SID = '968XL';
const TIMEOUT_MS = 10000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const request = async <T>(url: string, retries = 2): Promise<T> => {
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
    console.warn(`Game API Request Failed: ${url}`, error.message);
    throw error;
  }
};

/**
 * Fetch games from GamePix with robust filtering
 * @param page Page number
 * @param pagination Items per page
 * @param order 'quality' (Hay nhất) | 'pubdate' (Mới nhất)
 * @param category Category slug (e.g., '2048', 'action')
 */
export const fetchGames = async (
    page: number = 1, 
    pagination: number = 96, 
    order: 'quality' | 'pubdate' = 'quality',
    category: string = ''
): Promise<GamePixResponse> => {
    // Construct Base URL
    let url = `${BASE_URL}?sid=${SID}&pagination=${pagination}&page=${page}&order=${order}`;
    
    // Append Category if strictly valid
    if (category && category !== 'All') {
        url += `&category=${encodeURIComponent(category)}`;
    }
    
    return request<GamePixResponse>(url);
};

export const fetchGameDetailsFallback = async (namespace: string): Promise<any> => {
    // Try fetching top 100 quality games to find the item
    const data = await fetchGames(1, 100, 'quality');
    const found = data.items.find(g => g.namespace === namespace);
    if (found) return found;

    // Try fetching top 100 new games
    const dataNew = await fetchGames(1, 100, 'pubdate');
    return dataNew.items.find(g => g.namespace === namespace);
};

export const getGameEmbedUrl = (namespace: string) => {
    return `https://play.gamepix.com/${namespace}/embed?sid=${SID}`;
};
