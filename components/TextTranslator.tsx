
import React, { useState, useEffect } from "react";
import {
  Languages,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Copy,
  Check,
  RotateCw,
  Loader2,
  Globe,
} from "lucide-react";
import { Button } from "./Button";

// Translation APIs that support CORS from browsers
// MyMemory is reliable and free (1000 req/day without key)
// Lingva instances are open-source alternatives
const TRANSLATION_SERVICES = {
  mymemory: "https://api.mymemory.translated.net/get",
  lingva: [
    "https://lingva.ml",
    "https://lingva.pussthecat.org",
    "https://translate.plausibility.cloud",
  ],
};

const LANGS = [
  { code: "auto", name: "Phát hiện ngôn ngữ", mymemory: "auto" },
  { code: "en", name: "Tiếng Anh", mymemory: "en" },
  { code: "vi", name: "Tiếng Việt", mymemory: "vi" },
  { code: "zh", name: "Tiếng Trung", mymemory: "zh-CN" },
  { code: "ja", name: "Tiếng Nhật", mymemory: "ja" },
  { code: "ko", name: "Tiếng Hàn", mymemory: "ko" },
  { code: "fr", name: "Tiếng Pháp", mymemory: "fr" },
  { code: "de", name: "Tiếng Đức", mymemory: "de" },
  { code: "ru", name: "Tiếng Nga", mymemory: "ru" },
  { code: "es", name: "Tiếng Tây Ban Nha", mymemory: "es" },
];

export const TextTranslator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("vi");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [currentService, setCurrentService] = useState("MyMemory");

  // Reset state when closed to save memory
  useEffect(() => {
    if (!isOpen) {
      setError("");
    }
  }, [isOpen]);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError("");
    setOutputText("");

    const srcLang = LANGS.find((l) => l.code === sourceLang);
    const tgtLang = LANGS.find((l) => l.code === targetLang);

    // Try MyMemory API first (most reliable, supports CORS)
    try {
      setCurrentService("MyMemory");
      const srcCode =
        srcLang?.mymemory === "auto" ? "autodetect" : srcLang?.mymemory || "en";
      const tgtCode = tgtLang?.mymemory || "vi";

      const url = `${TRANSLATION_SERVICES.mymemory}?q=${encodeURIComponent(inputText)}&langpair=${srcCode}|${tgtCode}`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          // MyMemory sometimes returns the same text if it can't translate
          const translated = data.responseData.translatedText;
          if (
            translated &&
            translated.toLowerCase() !== inputText.toLowerCase()
          ) {
            setOutputText(translated);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("MyMemory translation failed, trying Lingva...");
    }

    // Fallback to Lingva instances
    for (const server of TRANSLATION_SERVICES.lingva) {
      try {
        setCurrentService(`Lingva (${server.replace("https://", "")})`);
        const srcCode = sourceLang === "auto" ? "auto" : sourceLang;
        const url = `${server}/api/v1/${srcCode}/${targetLang}/${encodeURIComponent(inputText)}`;
        const res = await fetch(url);

        if (res.ok) {
          const data = await res.json();
          if (data.translation) {
            setOutputText(data.translation);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn(`Lingva translation failed on ${server}, trying next...`);
        continue;
      }
    }

    setError("Tất cả dịch vụ đều bận. Vui lòng thử lại sau ít phút.");
    setIsLoading(false);
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSwapLanguages = () => {
    if (sourceLang === "auto") {
      // Can't swap if source is auto, force set source to current target, target to English (default)
      setSourceLang(targetLang);
      setTargetLang("en");
    } else {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
    }
    // Swap text too if there is a result
    if (outputText) {
      setInputText(outputText);
      setOutputText(inputText); // Old input becomes output (approximate)
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 overflow-hidden mt-4 transition-all">
      <div 
        className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
          <span className="bg-teal-600 text-white p-1 rounded-md">
            <Languages size={18} />
          </span>
          <span>Dịch Văn Bản (Free)</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className="p-4 md:p-6 animate-in slide-in-from-top-2 duration-300">
          {/* Language Controls */}
          <div className="flex flex-col md:flex-row gap-3 mb-4 items-center">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="flex-1 w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleSwapLanguages}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              title="Đổi ngôn ngữ"
            >
              <ArrowRightLeft size={18} />
            </button>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="flex-1 w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
            >
              {LANGS.filter((l) => l.code !== "auto").map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Input / Output Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập văn bản cần dịch..."
                className="w-full h-40 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500 text-gray-900 dark:text-white resize-none"
              />
              {inputText && (
                <button
                  onClick={() => {
                    setInputText("");
                    setOutputText("");
                  }}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                >
                  <RotateCw size={14} />
                </button>
              )}
            </div>

            {/* Output */}
            <div className="relative">
              <div
                className={`w-full h-40 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm overflow-y-auto ${!outputText ? "text-gray-400 italic" : "text-gray-900 dark:text-white"}`}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-teal-600">
                    <Loader2 className="animate-spin" />
                    <span className="text-xs">Đang dịch...</span>
                  </div>
                ) : error ? (
                  <div className="text-red-500 flex flex-col items-center justify-center h-full text-center">
                    <span className="font-bold text-xs mb-1">Lỗi kết nối</span>
                    <span className="text-xs">{error}</span>
                  </div>
                ) : outputText ? (
                  outputText
                ) : (
                  "Bản dịch sẽ hiện ở đây..."
                )}
              </div>

              {outputText && (
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 text-gray-400 hover:text-teal-500 transition-colors"
                  title="Sao chép"
                >
                  {isCopied ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Ẩn thông tin Service để tránh rối mắt và lộ hàng */}
            {/* 
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <Globe size={12} />
              <span>Service: {currentService}</span>
            </div>
            */}
            <div></div>

            <Button
              onClick={handleTranslate}
              disabled={isLoading || !inputText}
              className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowRightLeft size={18} />
              )}
              {isLoading ? "Đang xử lý..." : "Dịch Ngay"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
