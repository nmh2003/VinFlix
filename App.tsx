
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Detail } from './pages/Detail';
import { Watch } from './pages/Watch';
import { Catalog } from './pages/Catalog';
import { Library } from './pages/Library';
import { Auth } from './pages/Auth';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { ComicCatalog } from './pages/ComicCatalog';
import { ComicDetail } from './pages/ComicDetail';
import { ComicReader } from './pages/ComicReader';
import { GameCatalog } from './pages/GameCatalog';
import { GamePlay } from './pages/GamePlay';

// PRODUCTION OPTIMIZATION:
// 1. staleTime: Data remains "fresh" longer to prevent rapid refetching.
// 2. gcTime: Keep unused data in memory longer for instant back-navigation.
// 3. retry: Retry failed requests 2 times before showing error.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch on tab switch (save bandwidth)
      refetchOnReconnect: true, // Refetch if internet comes back
      staleTime: 1000 * 60 * 10, // 10 minutes (Ma Tốc Độ: Cache aggressively)
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
      retry: (failureCount, error: any) => {
        // Don't retry 404s (waste of time), retry others (network blips)
        if (error?.message?.includes('404')) return false;
        return failureCount < 2;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            
            {/* Auth Routes */}
            <Route path="/dang-nhap" element={<Auth />} />
            <Route path="/dang-ky" element={<Auth isRegister />} />

            {/* Settings */}
            <Route path="/cai-dat" element={<Settings />} />

            {/* Movie Lists - Phim Mới */}
            <Route path="/phim-moi" element={<Catalog type="new" />} />
            <Route path="/phim-moi/:page" element={<Catalog type="new" />} />
            
            {/* Catalogs - Search */}
            <Route path="/tim-kiem" element={<Catalog type="search" />} />
            
            {/* Catalogs - Dynamic Categories with Pagination Support */}
            <Route path="/the-loai/:slug" element={<Catalog type="category" />} />
            <Route path="/the-loai/:slug/:page" element={<Catalog type="category" />} />

            <Route path="/quoc-gia/:slug" element={<Catalog type="country" />} />
            <Route path="/quoc-gia/:slug/:page" element={<Catalog type="country" />} />
            
            <Route path="/danh-sach/:slug" element={<Catalog type="list" />} />
            <Route path="/danh-sach/:slug/:page" element={<Catalog type="list" />} />
            
            <Route path="/nam/:slug" element={<Catalog type="year" />} />
            <Route path="/nam/:slug/:page" element={<Catalog type="year" />} />
            
            {/* Detail & Watch */}
            <Route path="/phim/:slug" element={<Detail />} />
            <Route path="/phim/:slug/tap/:episodeSlug" element={<Watch />} />
            
            {/* COMIC ROUTES */}
            <Route path="/truyen-tranh" element={<ComicCatalog type="new" />} />
            <Route path="/truyen-tranh/:page" element={<ComicCatalog type="new" />} />
            <Route path="/truyen-tranh/tim-kiem" element={<ComicCatalog type="search" />} />
            <Route path="/truyen-tranh/danh-sach/:slug" element={<ComicCatalog type="list" />} />
            <Route path="/truyen-tranh/danh-sach/:slug/:page" element={<ComicCatalog type="list" />} />
            <Route path="/truyen-tranh/the-loai/:slug" element={<ComicCatalog type="category" />} />
            <Route path="/truyen-tranh/the-loai/:slug/:page" element={<ComicCatalog type="category" />} />
            
            <Route path="/truyen/:slug" element={<ComicDetail />} />
            <Route path="/truyen/:slug/chap/:id" element={<ComicReader />} />

            {/* GAME ROUTES */}
            <Route path="/games" element={<GameCatalog />} />
            <Route path="/game/:namespace" element={<GamePlay />} />

            {/* User History */}
            <Route path="/lich-su" element={<Library />} />
            <Route path="/thu-vien" element={<Library />} />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;
