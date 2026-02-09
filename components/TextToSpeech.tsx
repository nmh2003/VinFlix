
import React, { useState, useEffect } from 'react';
import { MessageSquare, Volume2, Play, Pause, Square, ChevronDown, ChevronUp, Mic } from 'lucide-react';
import { Button } from './Button';

export const TextToSpeech: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      // Filter for Vietnamese or fallback to all if none found (but highlight Vietnamese)
      const vnVoices = available.filter(v => v.lang.includes('vi'));
      const otherVoices = available.filter(v => !v.lang.includes('vi'));
      
      const sorted = [...vnVoices, ...otherVoices];
      setVoices(sorted);
      
      if (vnVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(vnVoices[0].name);
      } else if (available.length > 0 && !selectedVoice) {
        setSelectedVoice(available[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
        window.speechSynthesis.cancel();
    }
  }, []);

  const handleSpeak = () => {
    if (!text) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsSpeaking(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 overflow-hidden mt-4 transition-all">
      <div 
        className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
           <span className="bg-orange-500 text-white p-1 rounded-md"><Volume2 size={18}/></span>
           <span>Đọc Văn Bản (TTS)</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className="p-4 md:p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-4">
                <textarea
                    className="w-full h-32 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white resize-none"
                    placeholder="Nhập văn bản tiếng Việt để đọc..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giọng đọc</label>
                        <select 
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 text-sm rounded-lg p-2.5 text-gray-900 dark:text-white"
                        >
                            {voices.map(v => (
                                <option key={v.name} value={v.name}>
                                    {v.name} ({v.lang})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tốc độ: {rate}</label>
                            <input 
                                type="range" min="0.5" max="2" step="0.1" 
                                value={rate} onChange={(e) => setRate(parseFloat(e.target.value))}
                                className="w-full accent-orange-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cao độ: {pitch}</label>
                            <input 
                                type="range" min="0.5" max="2" step="0.1" 
                                value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))}
                                className="w-full accent-orange-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {!isSpeaking || isPaused ? (
                        <Button onClick={handleSpeak} className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700">
                            <Play size={18} /> {isPaused ? 'Tiếp tục' : 'Đọc ngay'}
                        </Button>
                    ) : (
                        <Button onClick={handlePause} className="flex-1 gap-2 bg-yellow-600 hover:bg-yellow-700">
                            <Pause size={18} /> Tạm dừng
                        </Button>
                    )}
                    <Button onClick={handleStop} variant="secondary" className="px-4">
                        <Square size={18} />
                    </Button>
                </div>
                
                {/* 
                <p className="text-[10px] text-gray-400 text-center italic">
                    * Sử dụng giọng đọc có sẵn trong trình duyệt. Chất lượng phụ thuộc vào thiết bị của bạn.
                </p>
                */}
            </div>
        </div>
      )}
    </div>
  );
};
