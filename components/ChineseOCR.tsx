
import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, Image as ImageIcon, Copy, RefreshCw, AlertTriangle, 
  Check, FileText, Languages, ChevronDown, ChevronUp, Loader2, Sparkles 
} from 'lucide-react';
import { Button } from './Button';

// Dynamic import type
type TesseractType = typeof import('tesseract.js');

export const ChineseOCR: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>('https://kenh14cdn.com/203336854389633024/2025/4/2/rmbp-screenshot-2025-04-01-at-110906pm-1743560258090-174356025843389008731.jpg');
  const [ocrText, setOcrText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  
  // Settings
  const [lang, setLang] = useState<'chi_sim' | 'chi_tra'>('chi_sim');
  const [quality, setQuality] = useState<'standard' | 'best'>('standard');

  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      // Only revoke blobs, not remote URLs
      if (selectedImage && selectedImage.startsWith('blob:')) {
          URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (selectedImage && selectedImage.startsWith('blob:')) URL.revokeObjectURL(selectedImage);
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setOcrText('');
      setError('');
      setStatusText('Đã sẵn sàng quét');
    }
  };

  const handleScan = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError('');
    setOcrText('');
    setStatusText('Đang khởi tạo bộ xử lý...');
    
    try {
      // LAZY LOAD TESSERACT.JS
      // @ts-ignore
      const Tesseract: TesseractType = await import('tesseract.js');

      // OPTIONS CONFIGURATION
      // Standard: Uses default CDN (fast, light)
      // Best: Uses tessdata_best repo (slow, heavy, accurate)
      const workerOptions = quality === 'best' 
        ? {
            langPath: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_best/main',
            gzip: false // GitHub raw files are usually not gzipped
          }
        : undefined; // Default standard config

      setStatusText(quality === 'best' ? 'Đang tải gói dữ liệu chất lượng cao (Sẽ lâu hơn)...' : 'Đang tải dữ liệu...');

      // Tesseract v5: createWorker(languages, oem, options)
      // OEM 1 = LSTM (Neural Net)
      const worker = await Tesseract.createWorker(lang, 1, workerOptions);

      setStatusText('Đang nhận diện văn bản...');

      // Recognize
      const { data: { text } } = await worker.recognize(selectedImage);
      
      setOcrText(text);
      await worker.terminate();
      setStatusText('Hoàn tất!');
    } catch (err: any) {
      console.error("OCR Error:", err);
      setError('Có lỗi xảy ra. Nếu dùng chế độ BEST, hãy đảm bảo mạng khỏe để tải data (~15MB).');
      setStatusText('Thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!ocrText) return;
    navigator.clipboard.writeText(ocrText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 overflow-hidden mt-8 transition-all">
      <div 
        className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
           <span className="bg-purple-600 text-white p-1 rounded-md"><Scan size={18}/></span>
           <span>OCR / Chuyển đổi văn bản từ hình ảnh (Beta)</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className="p-4 md:p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT: INPUT AREA */}
                <div className="space-y-4">
                    <div 
                        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition-colors bg-gray-50 dark:bg-black relative overflow-hidden group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {selectedImage ? (
                            <img 
                                src={selectedImage} 
                                alt="Preview" 
                                className="w-full h-full object-contain z-10" 
                                onError={() => setSelectedImage(null)}
                            />
                        ) : (
                            <div className="flex flex-col items-center text-gray-400 group-hover:text-purple-500">
                                <ImageIcon size={48} className="mb-2" />
                                <span className="font-medium text-sm">Chạm để chọn ảnh</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            {/* LANGUAGE SELECT */}
                            <select 
                                value={lang} 
                                onChange={(e) => setLang(e.target.value as any)}
                                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm rounded-lg p-2.5 flex-1 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 outline-none"
                                disabled={isProcessing}
                            >
                                <option value="chi_sim">Trung (Giản thể)</option>
                                <option value="chi_tra">Trung (Phồn thể)</option>
                            </select>

                            {/* QUALITY SELECT (NEW) */}
                            <select 
                                value={quality} 
                                onChange={(e) => setQuality(e.target.value as any)}
                                className={`bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm rounded-lg p-2.5 flex-1 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 outline-none ${quality === 'best' ? 'font-bold text-purple-600 dark:text-purple-400' : ''}`}
                                disabled={isProcessing}
                            >
                                <option value="standard">⚡ Nhanh (Standard)</option>
                                <option value="best">💎 Chính xác (Best)</option>
                            </select>
                        </div>

                        {quality === 'best' && (
                            <div className="text-[10px] text-orange-500 flex items-center gap-1 bg-orange-50 dark:bg-orange-900/10 p-2 rounded">
                                <Sparkles size={12} /> Chế độ BEST tải gói dữ liệu nặng (~15MB). Lần đầu sẽ chậm.
                            </div>
                        )}

                        <Button 
                            onClick={handleScan} 
                            disabled={!selectedImage || isProcessing}
                            className={`w-full gap-2 ${isProcessing ? 'opacity-75 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Scan size={18} />}
                            {isProcessing ? 'Đang Quét...' : 'Quét Ngay'}
                        </Button>
                    </div>

                    {/* Status Text (Replaces Progress Bar) */}
                    {isProcessing && (
                        <div className="w-full text-center">
                            <p className="text-xs text-purple-600 dark:text-purple-400 animate-pulse font-medium">{statusText}</p>
                        </div>
                    )}
                    {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                </div>

                {/* RIGHT: OUTPUT AREA */}
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FileText size={16} /> Kết quả
                        </h4>
                        <button 
                            onClick={handleCopy} 
                            disabled={!ocrText}
                            className="text-xs flex items-center gap-1 text-gray-500 hover:text-purple-500 disabled:opacity-50"
                        >
                            {isCopied ? <Check size={14} className="text-green-500"/> : <Copy size={14} />}
                            {isCopied ? 'Đã copy' : 'Copy'}
                        </button>
                    </div>
                    <textarea 
                        className="w-full h-64 md:h-full bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-purple-500 resize-none font-mono"
                        placeholder="Văn bản sau khi quét sẽ hiện ở đây..."
                        value={ocrText}
                        onChange={(e) => setOcrText(e.target.value)}
                    ></textarea>
                    
                    {ocrText && (
                        <div className="mt-2 text-right">
                            <a 
                                href={`https://translate.google.com/?sl=zh-CN&tl=vi&text=${encodeURIComponent(ocrText)}&op=translate`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1"
                            >
                                <Languages size={12} /> Dịch trên Google
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
