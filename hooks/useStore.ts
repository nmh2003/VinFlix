
import { useState, useEffect } from 'react';
import { UserHistory, AppState, User, ComicHistory, GameHistory, GameFavorite, AppSettings } from '../types';

const STORAGE_KEY = 'vinflix_local_data_v2';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  desktopCardSize: 'large',
  mobileCardColumns: 4,
  comicInfiniteScroll: true,
  autoNextEpisode: true,
  defaultPlayer: 'xgplayer'
};

const DEFAULT_STATE: AppState = {
  currentUser: null,
  favorites: [],
  history: [],
  comicHistory: [],
  gameHistory: [],
  gameFavorites: [],
  settings: DEFAULT_SETTINGS
};

const getInitialState = (): AppState => {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STATE;

    const parsed = JSON.parse(stored);

    // Merge stored settings with default settings to ensure new keys exist
    const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };

    return {
      currentUser: parsed.currentUser || null,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      comicHistory: Array.isArray(parsed.comicHistory) ? parsed.comicHistory : [],
      gameHistory: Array.isArray(parsed.gameHistory) ? parsed.gameHistory : [],
      gameFavorites: Array.isArray(parsed.gameFavorites) ? parsed.gameFavorites : [],
      settings: settings
    };
  } catch (error) {
    console.error("CRITICAL: LocalStorage data corrupted.", error);
    return DEFAULT_STATE;
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn("LocalStorage Quota Exceeded. Trimming...");
      try {
        const currentData = JSON.parse(value);
        if (currentData.history) currentData.history = currentData.history.slice(0, 15);
        if (currentData.comicHistory) currentData.comicHistory = currentData.comicHistory.slice(0, 15);
        if (currentData.gameHistory) currentData.gameHistory = currentData.gameHistory.slice(0, 15);
        localStorage.setItem(key, JSON.stringify(currentData));
      } catch (retryError) {}
    }
  }
};

export const useStore = () => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadedState = getInitialState();
    setState(loadedState);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      const serialized = JSON.stringify(state);
      safeSetItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error("Failed to serialize state:", error);
    }
  }, [state, isInitialized]);

  // --- MOVIE ACTIONS ---
  const addToHistory = (item: UserHistory) => {
    setState(prev => {
      const filtered = prev.history.filter(h => h.movieSlug !== item.movieSlug);
      return { ...prev, history: [item, ...filtered].slice(0, 50) }; 
    });
  };

  const updateProgress = (episodeSlug: string, progress: number, duration?: number) => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const newHistory = prev.history.map(item => {
        if (item.episodeSlug === episodeSlug) {
          return { ...item, progress, duration: duration || item.duration };
        }
        return item;
      });
      return { ...prev, history: newHistory };
    });
  };

  const clearHistory = () => {
    setState(prev => ({ ...prev, history: [], comicHistory: [], gameHistory: [] }));
  };

  // --- COMIC ACTIONS ---
  const addComicToHistory = (item: ComicHistory) => {
    setState(prev => {
        const filtered = prev.comicHistory.filter(h => h.comicSlug !== item.comicSlug);
        return { ...prev, comicHistory: [item, ...filtered].slice(0, 50) };
    });
  };

  // --- GAME ACTIONS ---
  const addGameToHistory = (item: GameHistory) => {
      setState(prev => {
          const filtered = prev.gameHistory.filter(h => h.namespace !== item.namespace);
          return { ...prev, gameHistory: [item, ...filtered].slice(0, 50) };
      });
  };

  const toggleGameFavorite = (item: GameFavorite) => {
      setState(prev => {
          const exists = prev.gameFavorites.some(f => f.namespace === item.namespace);
          if (exists) {
              return { ...prev, gameFavorites: prev.gameFavorites.filter(f => f.namespace !== item.namespace) };
          } else {
              return { ...prev, gameFavorites: [item, ...prev.gameFavorites] };
          }
      });
  };

  // --- SETTINGS ACTIONS ---
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  // --- AUTH ACTIONS ---
  const login = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  return {
    currentUser: state.currentUser,
    history: state.history,
    comicHistory: state.comicHistory,
    favorites: state.favorites,
    gameHistory: state.gameHistory,
    gameFavorites: state.gameFavorites,
    settings: state.settings,
    addToHistory,
    updateProgress,
    addComicToHistory,
    addGameToHistory,
    toggleGameFavorite,
    updateSettings,
    clearHistory,
    login,
    logout
  };
};
