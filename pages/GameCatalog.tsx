
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchGames } from '../services/gameApi';
import { GameCard } from '../components/GameCard';
import { Loader2, Search, Filter, RefreshCw, Gamepad2 } from 'lucide-react';
import { Button } from '../components/Button';

// Full Category List (152 items) - Mapped to Vietnamese for display
const GAME_CATEGORIES = [
  { slug: "All", name: "Tất cả" },
  { slug: "2048", name: "2048" },
  { slug: "action", name: "Hành động" },
  { slug: "addictive", name: "Gây nghiện" },
  { slug: "adventure", name: "Phiêu lưu" },
  { slug: "airplane", name: "Máy bay" },
  { slug: "animal", name: "Động vật" },
  { slug: "anime", name: "Anime" },
  { slug: "arcade", name: "Arcade" },
  { slug: "archery", name: "Bắn cung" },
  { slug: "baby", name: "Em bé" },
  { slug: "ball", name: "Bóng" },
  { slug: "barbie", name: "Barbie" },
  { slug: "baseball", name: "Bóng chày" },
  { slug: "basketball", name: "Bóng rổ" },
  { slug: "battle", name: "Chiến đấu" },
  { slug: "battle-royale", name: "Sinh tồn" },
  { slug: "bejeweled", name: "Kim cương" },
  { slug: "bike", name: "Xe đạp" },
  { slug: "block", name: "Khối" },
  { slug: "board", name: "Cờ bàn" },
  { slug: "bowling", name: "Bowling" },
  { slug: "boxing", name: "Quyền anh" },
  { slug: "brain", name: "Trí tuệ" },
  { slug: "bubble-shooter", name: "Bắn bóng" },
  { slug: "building", name: "Xây dựng" },
  { slug: "car", name: "Ô tô" },
  { slug: "card", name: "Bài" },
  { slug: "casual", name: "Phổ thông" },
  { slug: "cats", name: "Mèo" },
  { slug: "checkers", name: "Cờ đam" },
  { slug: "chess", name: "Cờ vua" },
  { slug: "christmas", name: "Giáng sinh" },
  { slug: "city-building", name: "Xây thành phố" },
  { slug: "classics", name: "Cổ điển" },
  { slug: "clicker", name: "Bấm chuột" },
  { slug: "coding", name: "Lập trình" },
  { slug: "coloring", name: "Tô màu" },
  { slug: "cooking", name: "Nấu ăn" },
  { slug: "cool", name: "Hay" },
  { slug: "crazy", name: "Vui nhộn" },
  { slug: "cricket", name: "Cricket" },
  { slug: "dinosaur", name: "Khủng long" },
  { slug: "dirt-bike", name: "Xe địa hình" },
  { slug: "dragons", name: "Rồng" },
  { slug: "drawing", name: "Vẽ" },
  { slug: "dress-up", name: "Thời trang" },
  { slug: "drifting", name: "Drift Xe" },
  { slug: "driving", name: "Lái xe" },
  { slug: "educational", name: "Giáo dục" },
  { slug: "escape", name: "Trốn thoát" },
  { slug: "family", name: "Gia đình" },
  { slug: "farming", name: "Nông trại" },
  { slug: "fashion", name: "Thời trang" },
  { slug: "fighting", name: "Đối kháng" },
  { slug: "fire-and-water", name: "Lửa & Nước" },
  { slug: "first-person-shooter", name: "Bắn súng FPS" },
  { slug: "fishing", name: "Câu cá" },
  { slug: "flash", name: "Flash" },
  { slug: "flight", name: "Bay" },
  { slug: "fun", name: "Vui vẻ" },
  { slug: "games-for-girls", name: "Con gái" },
  { slug: "gangster", name: "Gangster" },
  { slug: "gdevelop", name: "GDevelop" },
  { slug: "golf", name: "Golf" },
  { slug: "granny", name: "Granny" },
  { slug: "gun", name: "Súng" },
  { slug: "hair-salon", name: "Làm tóc" },
  { slug: "halloween", name: "Halloween" },
  { slug: "helicopter", name: "Trực thăng" },
  { slug: "hidden-object", name: "Tìm đồ vật" },
  { slug: "hockey", name: "Khúc côn cầu" },
  { slug: "horror", name: "Kinh dị" },
  { slug: "horse", name: "Ngựa" },
  { slug: "hunting", name: "Săn bắn" },
  { slug: "hyper-casual", name: "Hyper Casual" },
  { slug: "idle", name: "Nhàn rỗi" },
  { slug: "io", name: ".IO" },
  { slug: "jewel", name: "Đá quý" },
  { slug: "jigsaw-puzzles", name: "Ghép hình" },
  { slug: "jumping", name: "Nhảy" },
  { slug: "junior", name: "Trẻ em (Jr)" },
  { slug: "kids", name: "Trẻ em" },
  { slug: "knight", name: "Hiệp sĩ" },
  { slug: "mahjong", name: "Mạt chược" },
  { slug: "makeup", name: "Trang điểm" },
  { slug: "management", name: "Quản lý" },
  { slug: "mario", name: "Mario" },
  { slug: "match-3", name: "Nối 3" },
  { slug: "math", name: "Toán học" },
  { slug: "memory", name: "Trí nhớ" },
  { slug: "mermaid", name: "Tiên cá" },
  { slug: "minecraft", name: "Minecraft" },
  { slug: "mining", name: "Đào mỏ" },
  { slug: "mmorpg", name: "MMORPG" },
  { slug: "mobile", name: "Mobile" },
  { slug: "money", name: "Tiền" },
  { slug: "monster", name: "Quái vật" },
  { slug: "multiplayer", name: "Nhiều người chơi" },
  { slug: "music", name: "Âm nhạc" },
  { slug: "naval", name: "Hải chiến" },
  { slug: "ninja", name: "Ninja" },
  { slug: "ninja-turtle", name: "Ninja Rùa" },
  { slug: "offroad", name: "Địa hình" },
  { slug: "open-world", name: "Thế giới mở" },
  { slug: "parking", name: "Đậu xe" },
  { slug: "parkour", name: "Parkour" },
  { slug: "piano", name: "Piano" },
  { slug: "pirates", name: "Cướp biển" },
  { slug: "pixel", name: "Pixel" },
  { slug: "platformer", name: "Đi cảnh" },
  { slug: "police", name: "Cảnh sát" },
  { slug: "pool", name: "Bida" },
  { slug: "princess", name: "Công chúa" },
  { slug: "puzzle", name: "Giải đố" },
  { slug: "racing", name: "Đua xe" },
  { slug: "restaurant", name: "Nhà hàng" },
  { slug: "retro", name: "Cổ điển" },
  { slug: "robots", name: "Robot" },
  { slug: "rpg", name: "Nhập vai RPG" },
  { slug: "runner", name: "Chạy" },
  { slug: "scary", name: "Đáng sợ" },
  { slug: "scrabble", name: "Ghép chữ" },
  { slug: "sharks", name: "Cá mập" },
  { slug: "shooter", name: "Bắn súng" },
  { slug: "simulation", name: "Mô phỏng" },
  { slug: "skateboard", name: "Trượt ván" },
  { slug: "skibidi-toilet", name: "Skibidi Toilet" },
  { slug: "skill", name: "Kỹ năng" },
  { slug: "snake", name: "Rắn săn mồi" },
  { slug: "sniper", name: "Bắn tỉa" },
  { slug: "soccer", name: "Bóng đá" },
  { slug: "solitaire", name: "Xếp bài" },
  { slug: "spinner", name: "Con quay" },
  { slug: "sports", name: "Thể thao" },
  { slug: "stickman", name: "Người que" },
  { slug: "strategy", name: "Chiến thuật" },
  { slug: "surgery", name: "Phẫu thuật" },
  { slug: "survival", name: "Sinh tồn" },
  { slug: "sword", name: "Kiếm" },
  { slug: "tanks", name: "Xe tăng" },
  { slug: "tap", name: "Chạm" },
  { slug: "tetris", name: "Xếp gạch" },
  { slug: "trivia", name: "Đố vui" },
  { slug: "truck", name: "Xe tải" },
  { slug: "two-player", name: "2 Người chơi" },
  { slug: "tycoon", name: "Ông trùm" },
  { slug: "war", name: "Chiến tranh" },
  { slug: "word", name: "Từ vựng" },
  { slug: "world-cup", name: "World Cup" },
  { slug: "worm", name: "Sâu" },
  { slug: "wrestling", name: "Đấu vật" },
  { slug: "zombie", name: "Zombie" }
];

export const GameCatalog: React.FC = () => {
  // Strategy: Fetch 96 items.
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'quality' | 'pubdate'>('quality'); 
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    // Include selectedCategory in queryKey to trigger refetch on change
    queryKey: ['games-catalog', page, sortOrder, selectedCategory], 
    queryFn: () => fetchGames(page, 96, sortOrder, selectedCategory === 'All' ? '' : selectedCategory),
    staleTime: 1000 * 60 * 10, // 10 mins
    placeholderData: keepPreviousData
  });

  const allGames = data?.items || [];

  // Client-side search filtering (only filters within the fetched batch)
  // This is purely for searching by NAME within the category results returned by API.
  const filteredGames = useMemo(() => {
      return allGames.filter(game => {
          if (!searchQuery) return true;
          return game.title.toLowerCase().includes(searchQuery.toLowerCase());
      });
  }, [allGames, searchQuery]);

  const handlePageChange = (newPage: number) => {
      setPage(newPage);
      window.scrollTo(0,0);
  };

  const handleCategoryChange = (catSlug: string) => {
      setSelectedCategory(catSlug);
      setPage(1); 
      setSearchQuery('');
  };

  // Helper to determine Bento Size
  const getBentoProps = (index: number) => {
      // Pattern repeats every 18 items
      const patternIndex = index % 18; 
      
      // Index 0 is always featured (Big)
      if (index === 0) return { className: "col-span-2 row-span-2", variant: "bento" as const };
      if (patternIndex === 7) return { className: "col-span-2 row-span-1", variant: "bento" as const }; // Wide
      if (patternIndex === 12) return { className: "col-span-2 row-span-2", variant: "bento" as const }; // Big

      // Default
      return { className: "col-span-1 row-span-1", variant: "default" as const };
  };

  // Helper to find category display name
  const currentCategoryName = GAME_CATEGORIES.find(c => c.slug === selectedCategory)?.name || selectedCategory;

  if (isLoading && page === 1) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  return (
    <div>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                 <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Gamepad2 className="text-primary" /> Game Center
                 </h1>
                 <p className="text-sm text-gray-500 mt-1">Kho game HTML5 miễn phí chất lượng cao, chơi ngay không cần cài đặt.</p>
            </div>
            
            <div className="flex items-center gap-2">
                 <select 
                    value={sortOrder}
                    onChange={(e) => { setSortOrder(e.target.value as any); setPage(1); }}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm rounded px-3 py-2 outline-none focus:border-primary text-gray-900 dark:text-white"
                 >
                     <option value="quality">Hay nhất (Quality)</option>
                     <option value="pubdate">Mới nhất (New)</option>
                 </select>
            </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-4 rounded-lg mb-6 shadow-sm flex flex-col md:flex-row gap-4">
             <div className="relative flex-1">
                 <input 
                    type="text" 
                    placeholder={`Tìm kiếm trong ${currentCategoryName.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:border-primary text-gray-900 dark:text-white"
                 />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             </div>

             <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar max-w-full md:max-w-3xl">
                 <Filter size={18} className="text-blue-500 shrink-0" />
                 {GAME_CATEGORIES.map(cat => (
                     <button
                        key={cat.slug}
                        onClick={() => handleCategoryChange(cat.slug)}
                        className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors capitalize ${
                            selectedCategory === cat.slug 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                     >
                        {cat.name}
                     </button>
                 ))}
             </div>
        </div>

        {/* Error State */}
        {error ? (
            <div className="text-center py-20">
                <p className="text-red-500 mb-4">Không thể tải danh sách game.</p>
                <Button onClick={() => refetch()}><RefreshCw size={16} className="mr-2"/> Thử lại</Button>
            </div>
        ) : filteredGames.length === 0 ? (
            <div className="text-center py-20 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                    {searchQuery ? `Không tìm thấy game tên "${searchQuery}"` : 'Không tìm thấy game phù hợp.'}
                </p>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="text-primary hover:underline mt-2">Xóa bộ lọc</button>
            </div>
        ) : (
            // Bento Grid Container
            // CHANGED: Decreased from 200px to 175px. Balanced for mobile vertical view (enough space, not too much)
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 auto-rows-[175px] gap-3 md:gap-4 grid-flow-dense">
                {filteredGames.map((game, index) => {
                    const { className, variant } = getBentoProps(index);
                    return <GameCard key={game.id} game={game} className={className} variant={variant} />;
                })}
            </div>
        )}

        {/* Simple Pagination Control */}
        <div className="mt-8 flex justify-center gap-4">
            <Button variant="secondary" disabled={page === 1 || isRefetching} onClick={() => handlePageChange(page - 1)}>Trang trước</Button>
            <span className="flex items-center font-bold px-4 bg-white dark:bg-gray-800 rounded">{page}</span>
            <Button variant="primary" disabled={isRefetching || allGames.length < 96} onClick={() => handlePageChange(page + 1)}>Trang sau</Button>
        </div>
    </div>
  );
};
