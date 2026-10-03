import React from 'react';
import { Home, Sparkles, Volume2, RotateCcw } from 'lucide-react';
import { playPopSound, speakIndonesian } from '../utils/audio';

interface NavbarProps {
  currentModuleTitle?: string;
  stars: number;
  onGoHome: () => void;
  onResetProgress?: () => void;
  showHomeButton: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentModuleTitle,
  stars,
  onGoHome,
  onResetProgress,
  showHomeButton,
}) => {
  return (
    <header
      id="main-navbar"
      className="w-full max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2 z-30"
    >
      {/* Home Button */}
      <div className="flex items-center gap-2">
        {showHomeButton ? (
          <button
            id="nav-btn-home"
            onClick={() => {
              playPopSound();
              speakIndonesian('Kembali ke menu utama!');
              onGoHome();
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-3xl shadow-lg border-4 border-white flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 active:shadow-sm cursor-pointer"
            aria-label="Kembali ke Rumah"
            title="Kembali ke Rumah"
          >
            <Home className="w-8 h-8 sm:w-9 sm:h-9 text-amber-950 stroke-[2.5]" />
            <span className="text-[11px] sm:text-xs font-extrabold uppercase mt-0.5">Rumah</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-amber-400 border-4 border-white shadow-md flex items-center justify-center text-2xl sm:text-3xl">
              🎈
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-amber-950 tracking-tight leading-none">
                Belajar Ceria
              </h1>
              <span className="text-xs sm:text-sm font-semibold text-amber-800">
                PAUD & TK (Usia 5-7 Tahun)
              </span>
            </div>
          </div>
        )}

        {/* Current Module Title badge if in module */}
        {currentModuleTitle && (
          <div className="hidden sm:flex items-center px-4 py-2 bg-white/80 backdrop-blur rounded-2xl border-2 border-amber-200 shadow-sm">
            <span className="text-base sm:text-lg font-bold text-amber-950">
              {currentModuleTitle}
            </span>
          </div>
        )}
      </div>

      {/* Right controls: Star counter & Quick voice prompt */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Star Counter Pill */}
        <div
          id="nav-star-counter"
          className="flex items-center gap-2 bg-white px-3 sm:px-4 py-2 rounded-2xl shadow-md border-3 border-amber-300 transition-transform hover:scale-105"
        >
          <div className="relative">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 fill-amber-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-700 leading-none">Bintang</span>
            <span className="text-lg sm:text-xl font-black text-amber-950 leading-tight">
              {stars}
            </span>
          </div>
        </div>

        {/* Sound test button */}
        <button
          id="nav-btn-speaker"
          onClick={() => {
            playPopSound();
            speakIndonesian('Ayo semangat belajar dan kumpulkan banyak bintang!');
          }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white hover:bg-amber-50 border-2 border-amber-300 text-amber-700 flex items-center justify-center shadow-sm transition-transform active:scale-95 cursor-pointer"
          title="Dengarkan Suara"
          aria-label="Dengarkan Suara"
        >
          <Volume2 className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Reset progress button (small & subtle for parents/teachers) */}
        {onResetProgress && (
          <button
            id="nav-btn-reset"
            onClick={onResetProgress}
            className="w-10 h-10 rounded-xl bg-white/60 hover:bg-white text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors text-xs cursor-pointer"
            title="Ulangi Progres dari Awal"
            aria-label="Ulangi Progres"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
