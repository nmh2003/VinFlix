
import React from 'react';
import { useStore } from '../hooks/useStore';
import { Settings as SettingsIcon, Monitor, Smartphone, BookOpen, PlayCircle, Film, Moon, Sun, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChineseOCR } from '../components/ChineseOCR';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { ScientificCalculator } from '../components/ScientificCalculator';
import { TextToSpeech } from '../components/TextToSpeech';
import { WorldClock } from '../components/WorldClock';
import { TextTranslator } from '../components/TextTranslator';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useStore();

  const handleThemeChange = (theme: 'dark' | 'light') => {
    updateSettings({ theme });
    // Apply immediately to DOM for better UX (Layout syncs later)
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft />
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <SettingsIcon className="text-primary" /> Cài Đặt
        </h1>
      </div>

      <div className="space-y-6">
        
        {/* --- SECTION 1: INTERFACE --- */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-800 font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Monitor size={18} /> Giao Diện
            </div>
            
            <div className="p-4 space-y-6">
                {/* Theme Mode */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Chế độ hiển thị</h3>
                        <p className="text-xs text-gray-500">Chọn giao diện Sáng hoặc Tối</p>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-black p-1 rounded-lg w-full md:w-auto">
                        <button 
                            onClick={() => handleThemeChange('light')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${settings.theme === 'light' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <Sun size={16} /> Sáng
                        </button>
                        <button 
                            onClick={() => handleThemeChange('dark')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${settings.theme === 'dark' ? 'bg-gray-800 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Moon size={16} /> Tối
                        </button>
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

                {/* Desktop Card Size */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Kích thước thẻ phim (Desktop)</h3>
                        <p className="text-xs text-gray-500">Điều chỉnh số lượng phim trên một hàng</p>
                    </div>
                    <select 
                        value={settings.desktopCardSize}
                        onChange={(e) => updateSettings({ desktopCardSize: e.target.value as any })}
                        className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full md:w-40 p-2.5"
                    >
                        <option value="large">Lớn (Mặc định)</option>
                        <option value="medium">Vừa</option>
                        <option value="small">Nhỏ</option>
                    </select>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

                {/* Mobile Columns */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Số cột hiển thị (Mobile)</h3>
                        <p className="text-xs text-gray-500">Số lượng phim trên một hàng ở màn hình dọc</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
                        {[4, 3, 2].map((col) => (
                            <button
                                key={col}
                                onClick={() => updateSettings({ mobileCardColumns: col as any })}
                                className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${
                                    settings.mobileCardColumns === col 
                                    ? 'border-primary bg-primary/10 text-primary' 
                                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'
                                }`}
                            >
                                {col} Cột
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* --- SECTION 2: EXPERIENCE --- */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-800 font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Film size={18} /> Trải Nghiệm
            </div>
            
            <div className="p-4 space-y-6">
                {/* Comic Infinite Scroll */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <BookOpen size={16} className="text-blue-500"/> Chế độ Lướt truyện vô hạn
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {settings.comicInfiniteScroll 
                                ? 'Tự động tải chương tiếp theo khi cuộn xuống cuối.' 
                                : 'Hiện nút chuyển chương khi đọc hết (Không tự tải).'}
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={settings.comicInfiniteScroll}
                            onChange={(e) => updateSettings({ comicInfiniteScroll: e.target.checked })}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

                {/* Auto Next Episode */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <PlayCircle size={16} className="text-red-500"/> Tự chuyển tập phim
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Tự động chuyển sang tập tiếp theo khi xem hết phim.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={settings.autoNextEpisode}
                            onChange={(e) => updateSettings({ autoNextEpisode: e.target.checked })}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                    </label>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

                {/* Default Player */}
                <div className="flex flex-col gap-3">
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Trình phát Video mặc định</h3>
                        <p className="text-xs text-gray-500">Chọn trình phát ưa thích (Lưu ý: Nguồn Namec không hỗ trợ đổi Player).</p>
                    </div>
                    <select 
                        value={settings.defaultPlayer}
                        onChange={(e) => updateSettings({ defaultPlayer: e.target.value as any })}
                        className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                    >
                        <option value="xgplayer">XGPlayer (Mặc định - Khuyên dùng)</option>
                        <option value="shaka">Shaka Player (Ổn định)</option>
                        <option value="videojs">Video.js (Cổ điển)</option>
                        <option value="oplayer">OPlayer (Nhẹ)</option>
                        <option value="reactplayer">ReactPlayer</option>
                        <option value="embed">Embed (Trình phát gốc)</option>
                    </select>
                </div>
            </div>
        </div>

      </div>

      {/* --- EXPERIMENTAL LAB --- */}
      <div className="pt-8 relative">
          <div className="absolute top-8 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
          <div className="relative text-center mb-6">
              <span className="bg-gray-100 dark:bg-darker px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Góc Vọc Vạch</span>
          </div>
          <div className="space-y-4">
              <ChineseOCR />
              <TextTranslator />
              <QRCodeGenerator />
              <ScientificCalculator />
              <TextToSpeech />
              <WorldClock />
          </div>
      </div>
    </div>
  );
};
