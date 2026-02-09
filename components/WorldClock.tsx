
import React, { useState, useEffect } from 'react';
import { Globe2, ChevronDown, ChevronUp, Sun, Moon, MapPin, Quote, RefreshCw, Loader2 } from 'lucide-react';

interface City {
  name: string;
  zone: string;
  country: string;
}

const CITIES: City[] = [
  { name: 'Hà Nội', zone: 'Asia/Ho_Chi_Minh', country: 'Vietnam' },
  { name: 'Tokyo', zone: 'Asia/Tokyo', country: 'Japan' },
  { name: 'New York', zone: 'America/New_York', country: 'USA' },
  { name: 'London', zone: 'Europe/London', country: 'UK' },
  { name: 'Paris', zone: 'Europe/Paris', country: 'France' },
  { name: 'Seoul', zone: 'Asia/Seoul', country: 'Korea' },
];

// Sub-component: Analog Clock Face
const AnalogClock: React.FC<{ time: Date; zone: string; isDay: boolean }> = ({ time, zone, isDay }) => {
  // Convert current time to the specific timezone time
  const zoneTimeStr = time.toLocaleString('en-US', { timeZone: zone, hour12: false });
  const zoneDate = new Date(zoneTimeStr);

  const seconds = zoneDate.getSeconds();
  const minutes = zoneDate.getMinutes();
  const hours = zoneDate.getHours();

  const secDeg = seconds * 6;
  const minDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className={`relative w-20 h-20 rounded-full border-2 shadow-inner flex items-center justify-center ${isDay ? 'border-gray-800/10 bg-white/20' : 'border-white/20 bg-black/20'}`}>
      {/* Clock Center Dot */}
      <div className={`w-1.5 h-1.5 rounded-full z-10 ${isDay ? 'bg-gray-800' : 'bg-white'}`}></div>

      {/* Hour Hand */}
      <div 
        className={`absolute w-1 top-[20%] bottom-[50%] origin-bottom rounded-full ${isDay ? 'bg-gray-800' : 'bg-white'}`}
        style={{ transform: `rotate(${hourDeg}deg)` }}
      ></div>

      {/* Minute Hand */}
      <div 
        className={`absolute w-0.5 top-[10%] bottom-[50%] origin-bottom rounded-full ${isDay ? 'bg-gray-600' : 'bg-gray-300'}`}
        style={{ transform: `rotate(${minDeg}deg)` }}
      ></div>

      {/* Second Hand */}
      <div 
        className="absolute w-[1px] top-[5%] bottom-[50%] origin-bottom bg-red-500"
        style={{ transform: `rotate(${secDeg}deg)` }}
      ></div>
    </div>
  );
};

export const WorldClock: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [time, setTime] = useState(new Date());
  
  // Quote State
  const [quote, setQuote] = useState<string>('');
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Fetch initial quote if empty
    if (!quote) fetchQuote();

    return () => clearInterval(timer);
  }, [isOpen]);

  const fetchQuote = async () => {
    setIsQuoteLoading(true);
    try {
        // Add timestamp to prevent caching
        const res = await fetch(`https://api.adviceslip.com/advice?t=${Date.now()}`);
        const data = await res.json();
        if (data && data.slip) {
            setQuote(data.slip.advice);
        }
    } catch (error) {
        console.error("Failed to fetch quote", error);
        setQuote("Time waits for no one."); // Fallback
    } finally {
        setIsQuoteLoading(false);
    }
  };

  const getTimeData = (date: Date, timeZone: string) => {
    const formatter = new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      timeZone: timeZone,
      hour12: false
    });
    
    // Parse parts to check for day/night (simplistic: 6h-18h is day)
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
    
    const h = parseInt(getPart('hour'));
    const isDay = h >= 6 && h < 18;
    
    return {
      timeStr: `${getPart('hour')}:${getPart('minute')}`,
      secStr: getPart('second'),
      dateStr: `${getPart('weekday')}, ${getPart('day')}/${getPart('month')}`,
      isDay
    };
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 overflow-hidden mt-4 transition-all">
      <div 
        className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
           <span className="bg-cyan-600 text-white p-1 rounded-md"><Globe2 size={18}/></span>
           <span>Giờ Thế Giới (Pro)</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className="p-4 md:p-6 animate-in slide-in-from-top-2 duration-300 bg-gray-50 dark:bg-black/20">
            {/* Clock Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {CITIES.map((city) => {
                    const { timeStr, secStr, dateStr, isDay } = getTimeData(time, city.zone);
                    const isVN = city.zone === 'Asia/Ho_Chi_Minh';

                    return (
                        <div 
                            key={city.zone} 
                            className={`relative overflow-hidden rounded-2xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg border ${
                                isDay 
                                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800 border-blue-200' 
                                    : 'bg-gradient-to-br from-slate-800 to-slate-900 text-white border-slate-700'
                            } ${isVN ? 'ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-black' : ''}`}
                        >
                            {/* Background Icon Decoration */}
                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                {isDay ? <Sun size={100} /> : <Moon size={100} />}
                            </div>

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 opacity-80 text-xs font-bold tracking-wider uppercase">
                                        <MapPin size={12} /> {city.country}
                                    </div>
                                    <h3 className="text-xl font-bold leading-tight">{city.name}</h3>
                                    <div className="text-xs opacity-70 mt-1">{dateStr}</div>
                                </div>
                                
                                {/* Analog Clock Visual */}
                                <AnalogClock time={time} zone={city.zone} isDay={isDay} />
                            </div>

                            {/* Digital Time */}
                            <div className="mt-4 relative z-10 flex items-baseline gap-1">
                                <span className="text-4xl font-mono font-bold tracking-tighter">
                                    {timeStr}
                                </span>
                                <span className={`text-lg font-mono font-medium ${isDay ? 'text-blue-600' : 'text-cyan-400'}`}>
                                    :{secStr}
                                </span>
                                {isVN && (
                                    <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-full bg-cyan-500 text-white uppercase">
                                        Vị trí của bạn
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Daily Quote Section - Minimalist */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-500 mb-2">
                            Châm ngôn hôm nay
                        </h4>
                        
                        <div className="flex gap-3">
                            <Quote size={24} className="text-gray-400 dark:text-gray-600 shrink-0 rotate-180" />
                            <p className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-100 italic font-serif leading-relaxed">
                                {quote || 'Loading wisdom...'}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={fetchQuote} 
                        disabled={isQuoteLoading}
                        className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Đổi câu khác"
                    >
                        {isQuoteLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
