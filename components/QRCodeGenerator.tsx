
import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import { Button } from './Button';

export const QRCodeGenerator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [text, setText] = useState('https://vinflix.netlify.app/');
  const [color, setColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vinflix-qr.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 overflow-hidden mt-4 transition-all">
      <div 
        className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
           <span className="bg-blue-600 text-white p-1 rounded-md"><QrCode size={18}/></span>
           <span>Tạo Mã QR</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className="p-4 md:p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Inputs */}
                <div className="flex-1 space-y-4 w-full">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Nội dung / Liên kết</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={text} 
                                onChange={(e) => setText(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                placeholder="Nhập văn bản..."
                            />
                            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-500 mb-1">Màu mã</label>
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 rounded-lg">
                                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{color}</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-500 mb-1">Màu nền</label>
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 rounded-lg">
                                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{bgColor}</span>
                            </div>
                        </div>
                    </div>

                    <Button onClick={downloadQR} className="w-full gap-2 mt-2">
                        <Download size={18} /> Tải Xuống PNG
                    </Button>
                </div>

                {/* Preview */}
                <div className="w-full md:w-auto flex justify-center">
                    <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200" ref={qrRef}>
                        <QRCodeCanvas 
                            value={text} 
                            size={200}
                            fgColor={color}
                            bgColor={bgColor}
                            level="H"
                            includeMargin={true}
                        />
                        <p className="text-center text-xs text-gray-400 mt-2 font-mono">VINFLIX LAB</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
