import React from 'react';
import { Mascot } from './Mascot';
import { ModuleId, ModuleData, UserProgress } from '../types';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { playPopSound, speakIndonesian } from '../utils/audio';

interface HomeScreenProps {
  modules: Record<ModuleId, ModuleData>;
  progress: UserProgress;
  onSelectModule: (moduleId: ModuleId) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  modules,
  progress,
  onSelectModule,
}) => {
  const moduleCards: {
    id: ModuleId;
    title: string;
    subtitle: string;
    icon: string;
    sampleGlyphs: string;
    bgStyle: string;
    borderStyle: string;
    badgeStyle: string;
    buttonColor: string;
    audioHint: string;
  }[] = [
    {
      id: 'huruf',
      title: 'Huruf A-Z',
      subtitle: 'Mengenal huruf & bunyi',
      icon: '🔤',
      sampleGlyphs: 'A B C D',
      bgStyle: 'bg-gradient-to-br from-amber-300 via-orange-300 to-amber-400 text-amber-950',
      borderStyle: 'border-amber-400',
      badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
      buttonColor: 'bg-amber-500 hover:bg-amber-600 text-white',
      audioHint: 'Ayo belajar huruf A sampai Z!',
    },
    {
      id: 'angka',
      title: 'Angka 1-20',
      subtitle: 'Belajar berhitung seru',
      icon: '🔢',
      sampleGlyphs: '1 2 3 4',
      bgStyle: 'bg-gradient-to-br from-sky-300 via-blue-300 to-indigo-300 text-blue-950',
      borderStyle: 'border-sky-400',
      badgeStyle: 'bg-sky-100 text-sky-900 border-sky-300',
      buttonColor: 'bg-sky-500 hover:bg-sky-600 text-white',
      audioHint: 'Ayo belajar angka dan berhitung!',
    },
    {
      id: 'bentuk',
      title: 'Bentuk Bangun',
      subtitle: 'Lingkaran, segitiga & bintang',
      icon: '🔺',
      sampleGlyphs: '⭕ 🔺 ⬛ ⭐',
      bgStyle: 'bg-gradient-to-br from-emerald-300 via-teal-300 to-green-300 text-emerald-950',
      borderStyle: 'border-emerald-400',
      badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      buttonColor: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      audioHint: 'Ayo belajar berbagai macam bentuk!',
    },
    {
      id: 'warna',
      title: 'Warna-Warni',
      subtitle: 'Merah, biru, kuning, hijau',
      icon: '🎨',
      sampleGlyphs: '🔴 🔵 🟡 🟢',
      bgStyle: 'bg-gradient-to-br from-pink-300 via-purple-300 to-violet-300 text-purple-950',
      borderStyle: 'border-purple-400',
      badgeStyle: 'bg-purple-100 text-purple-900 border-purple-300',
      buttonColor: 'bg-purple-500 hover:bg-purple-600 text-white',
      audioHint: 'Ayo mengenal dunia warna-warni!',
    },
  ];

  const handleCardClick = (mod: (typeof moduleCards)[0]) => {
    playPopSound();
    speakIndonesian(mod.audioHint);
    onSelectModule(mod.id);
  };

  return (
    <div id="home-screen" className="w-full max-w-4xl mx-auto flex flex-col items-center px-4 py-3">
      {/* Friendly Mascot Greeting at Top */}
      <div className="flex flex-col items-center mb-6">
        <Mascot
          mood="idle"
          message="Halo teman kecil! Pilih petualangan belajarmu hari ini!"
          size="md"
          showSpeechBubble={true}
        />
      </div>

      {/* Hero Welcome Banner */}
      <div className="w-full text-center mb-6">
        <h2 className="text-3xl sm:text-5xl font-black text-amber-950 font-fredoka tracking-tight">
          Ayo Mulai Belajar! 🚀
        </h2>
        <p className="text-base sm:text-lg font-bold text-amber-800 mt-1 max-w-md mx-auto">
          Sentuh salah satu kotak besar di bawah untuk mulai bermain!
        </p>
      </div>

      {/* 4 Big Colorful Module Cards (Min 80x80px interaction, rounded, high contrast) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
        {moduleCards.map((card) => {
          const isCompleted = progress.completedModules[card.id];
          const hasPlayed = progress.completedStages[`${card.id}_kenali`];

          return (
            <button
              key={card.id}
              id={`home-module-card-${card.id}`}
              onClick={() => handleCardClick(card)}
              className={`group relative p-6 sm:p-7 rounded-[36px] text-left transition-all duration-300 shadow-xl hover:shadow-2xl border-4 sm:border-5 border-white flex flex-col justify-between min-h-[170px] sm:min-h-[190px] overflow-hidden ${card.bgStyle} hover:-translate-y-1.5 active:translate-y-0.5 active:scale-98`}
            >
              {/* Background watermark icon */}
              <span className="absolute -bottom-4 -right-4 text-8xl opacity-20 group-hover:scale-110 transition-transform select-none">
                {card.icon}
              </span>

              {/* Top Row: Icon + Badges */}
              <div className="flex items-center justify-between w-full z-10">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl bg-white/90 shadow-md flex items-center justify-center text-3xl sm:text-4xl border-2 border-white/80 group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>

                {isCompleted ? (
                  <div className="flex items-center gap-1.5 bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-full shadow-sm text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesai!</span>
                  </div>
                ) : hasPlayed ? (
                  <div className="flex items-center gap-1 bg-amber-400 text-amber-950 font-extrabold px-3 py-1.5 rounded-full shadow-sm text-xs sm:text-sm">
                    <Sparkles className="w-3.5 h-3.5 fill-amber-950" />
                    <span>Sedang Belajar</span>
                  </div>
                ) : card.id === 'huruf' ? (
                  <div className="flex items-center gap-1 bg-rose-500 text-white font-extrabold px-3 py-1 rounded-full shadow-sm text-xs animate-pulse">
                    ⭐ Disarankan
                  </div>
                ) : null}
              </div>

              {/* Middle: Title & Subtitle */}
              <div className="mt-4 z-10">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight font-fredoka leading-snug drop-shadow-sm">
                  {card.title}
                </h3>
                <p className="text-sm sm:text-base font-bold opacity-90 mt-0.5">
                  {card.subtitle}
                </p>
                <div className="text-xs sm:text-sm font-black opacity-80 mt-1.5 tracking-wider">
                  {card.sampleGlyphs}
                </div>
              </div>

              {/* Bottom: Play Prompt Bar */}
              <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between z-10">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                  Buka Modul
                </span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-md group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Encouragement Footer note */}
      <div className="mt-8 text-center bg-white/75 backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-amber-200 shadow-sm">
        <p className="text-xs sm:text-sm font-bold text-amber-900">
          💡 Tips: Sentuh tombol speaker 🔊 di setiap layar untuk mendengarkan suara dan panduan!
        </p>
      </div>
    </div>
  );
};
