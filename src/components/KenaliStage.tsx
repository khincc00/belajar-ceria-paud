import React, { useState, useEffect, useRef } from 'react';
import { LearningItem, ModuleData } from '../types';
import { Volume2, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { speakIndonesian, speakAfterCurrent, playPopSound, playCorrectSound } from '../utils/audio';

interface KenaliStageProps {
  moduleData: ModuleData;
  onCompleteStage: () => void;
  onItemChange?: (item: LearningItem) => void;
}

export const KenaliStage: React.FC<KenaliStageProps> = ({
  moduleData,
  onCompleteStage,
  onItemChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = moduleData.items[currentIndex] || moduleData.items[0];

  // Speak automatically when current item changes or on load.
  // Saat pertama dibuka, tunggu ucapan sebelumnya (mis. nama tahap) selesai dulu.
  const isFirstSpeak = useRef(true);
  useEffect(() => {
    if (currentItem) {
      if (isFirstSpeak.current) {
        isFirstSpeak.current = false;
        speakAfterCurrent(currentItem.audioText);
      } else {
        speakIndonesian(currentItem.audioText);
      }
      if (onItemChange) onItemChange(currentItem);
    }
  }, [currentIndex, currentItem]);

  const handlePrev = () => {
    playPopSound();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : moduleData.items.length - 1));
  };

  const handleNext = () => {
    playPopSound();
    setCurrentIndex((prev) => (prev < moduleData.items.length - 1 ? prev + 1 : 0));
  };

  const handleSpeak = () => {
    playPopSound();
    speakIndonesian(currentItem.audioText);
  };

  const handleSelectDirect = (index: number) => {
    playPopSound();
    setCurrentIndex(index);
  };

  return (
    <div id="kenali-stage" className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Big Interactive Card */}
      <div
        id="kenali-main-card"
        className="w-full bg-white rounded-3xl sm:rounded-[36px] p-6 sm:p-8 shadow-xl border-4 border-amber-300 relative flex flex-col items-center text-center transition-all"
      >
        {/* Top Header Badge & Speaker */}
        <div className="w-full flex items-center justify-between mb-4">
          <span className="text-xs sm:text-sm font-black bg-amber-100 text-amber-900 px-3.5 py-1.5 rounded-full border border-amber-300">
            {currentIndex + 1} dari {moduleData.items.length}
          </span>

          {/* Big Speaker Button */}
          <button
            id="kenali-btn-sound"
            onClick={handleSpeak}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black shadow-md border-3 border-white flex items-center justify-center transition-transform"
            title="Dengarkan Suara"
            aria-label="Dengarkan Suara"
          >
            <Volume2 className="w-9 h-9 stroke-[2.5]" />
          </button>
        </div>

        {/* Big Letter / Item Display */}
        <div
          id="kenali-item-display"
          onClick={handleSpeak}
          className="cursor-pointer group flex flex-col items-center justify-center my-2 p-4 rounded-3xl transition-transform hover:scale-105 active:scale-95"
        >
          {moduleData.modul === 'huruf' ? (
            <div className="flex items-baseline justify-center gap-3 sm:gap-6">
              <span className="text-7xl sm:text-9xl font-black text-amber-900 tracking-tight drop-shadow-sm font-fredoka">
                {currentItem.label}
              </span>
              <span className="text-5xl sm:text-7xl font-extrabold text-amber-600 font-fredoka">
                {currentItem.subLabel || currentItem.label.toLowerCase()}
              </span>
            </div>
          ) : moduleData.modul === 'warna' ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-32 h-32 sm:w-44 sm:h-44 rounded-3xl shadow-inner border-4 border-white drop-shadow-md transition-transform group-hover:scale-105"
                style={{ backgroundColor: currentItem.warna || '#EF4444' }}
              />
              <span className="text-3xl sm:text-5xl font-black text-gray-900 font-fredoka">
                {currentItem.label}
              </span>
            </div>
          ) : moduleData.modul === 'bentuk' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center text-7xl sm:text-8xl p-4 bg-emerald-50 rounded-3xl border-3 border-emerald-200">
                {currentItem.gambarContoh}
              </div>
              <span className="text-3xl sm:text-5xl font-black text-emerald-900 font-fredoka">
                {currentItem.label}
              </span>
            </div>
          ) : (
            // Angka
            <div className="flex flex-col items-center">
              <span className="text-7xl sm:text-9xl font-black text-sky-900 tracking-tight drop-shadow-sm font-fredoka">
                {currentItem.label}
              </span>
              {/* Object counting array */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm my-2 text-2xl sm:text-3xl">
                {Array.from({ length: Math.min(currentItem.jumlah || 1, 20) }).map((_, i) => (
                  <span key={i} className="animate-bounce-subtle">
                    {currentItem.gambarContoh}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Visual Example Card: e.g. "🐔 Ayam" */}
        <div
          id="kenali-example-box"
          onClick={handleSpeak}
          className="cursor-pointer mt-3 w-full max-w-md bg-amber-50 hover:bg-amber-100/80 border-2 border-amber-200 rounded-2xl sm:rounded-3xl p-4 flex items-center justify-center gap-4 transition-all"
        >
          <span className="text-4xl sm:text-5xl drop-shadow">
            {currentItem.gambarContoh}
          </span>
          <div className="text-left">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
              Contoh Kata
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-950 font-fredoka">
              {currentItem.contoh}
            </span>
          </div>
          <Sparkles className="w-6 h-6 text-amber-400 ml-auto shrink-0" />
        </div>

        {/* Big Navigation Buttons (< Prev / Next >) - Minimum 80x80px */}
        <div className="w-full flex items-center justify-between gap-4 mt-6">
          <button
            id="kenali-btn-prev"
            onClick={handlePrev}
            className="flex-1 min-h-[72px] sm:min-h-[80px] bg-sky-400 hover:bg-sky-500 text-sky-950 font-black rounded-3xl shadow-lg border-4 border-white flex items-center justify-center gap-2 text-lg sm:text-xl transition-transform hover:scale-102 active:scale-95"
            aria-label="Item Sebelumnya"
          >
            <ChevronLeft className="w-8 h-8 stroke-[3]" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <button
            id="kenali-btn-next"
            onClick={handleNext}
            className="flex-1 min-h-[72px] sm:min-h-[80px] bg-emerald-400 hover:bg-emerald-500 text-emerald-950 font-black rounded-3xl shadow-lg border-4 border-white flex items-center justify-center gap-2 text-lg sm:text-xl transition-transform hover:scale-102 active:scale-95"
            aria-label="Item Berikutnya"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="w-8 h-8 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Quick Select Grid (Horizontal Scrollable / Wrap) */}
      <div id="kenali-quick-picker" className="w-full mt-6 bg-white/70 backdrop-blur rounded-3xl p-4 border-2 border-amber-200/80 shadow-sm">
        <p className="text-xs sm:text-sm font-bold text-amber-900 mb-2 px-1 text-center">
          Pilih langsung:
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-h-36 overflow-y-auto p-1">
          {moduleData.items.map((item, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={item.id}
                id={`picker-item-${item.id}`}
                onClick={() => handleSelectDirect(idx)}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center transition-all shadow-sm ${
                  isSelected
                    ? 'bg-amber-400 text-amber-950 scale-110 shadow-md border-2 border-white'
                    : 'bg-white hover:bg-amber-100 text-gray-700 border border-amber-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action to proceed to next stage */}
      <div className="mt-6 w-full flex justify-center">
        <button
          id="kenali-btn-proceed"
          onClick={() => {
            playCorrectSound();
            speakIndonesian('Hebat! Sekarang ayo bermain mencocokkan!');
            onCompleteStage();
          }}
          className="w-full max-w-md py-4 sm:py-5 px-8 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-amber-950 font-black rounded-3xl shadow-xl border-4 border-white text-xl sm:text-2xl flex items-center justify-center gap-3 transition-transform hover:scale-103 active:scale-95"
        >
          <span>Ayo Main Cocokkan!</span>
          <ArrowRight className="w-7 h-7 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
