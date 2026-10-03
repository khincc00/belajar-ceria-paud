import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Mascot } from './Mascot';
import { ModuleData } from '../types';
import { Sparkles, Home, RotateCcw, Award } from 'lucide-react';
import { playFanfareSound, speakAfterCurrent, playPopSound } from '../utils/audio';
import { say } from '../data/voicePhrases';

interface CelebrationModalProps {
  moduleData: ModuleData;
  starsEarned: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  moduleData,
  starsEarned,
  onPlayAgain,
  onGoHome,
}) => {
  useEffect(() => {
    // Play fanfare and speak
    playFanfareSound();
    const celebrationSpeech = say.celebration(moduleData.judul);
    speakAfterCurrent(celebrationSpeech); // tunggu pujian soal terakhir selesai

    // Launch multi-burst canvas confetti
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'],
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [moduleData]);

  return (
    <div
      id="celebration-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="celebration-card"
        className="w-full max-w-lg bg-white rounded-[40px] p-6 sm:p-8 shadow-2xl border-6 border-amber-300 flex flex-col items-center text-center relative animate-bounce-subtle"
      >
        {/* Sparkle Header Ribbon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 -mt-14 sm:-mt-16 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl sm:text-4xl">
          👑
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-amber-950 mt-3 font-fredoka">
          Hore! Luar Biasa!
        </h2>
        <p className="text-base sm:text-lg font-bold text-amber-800 mt-1 max-w-xs">
          Kamu sudah menyelesaikan <span className="text-amber-950 underline">{moduleData.judul}</span>!
        </p>

        {/* Mascot celebrating */}
        <div className="my-3">
          <Mascot
            mood="celebrate"
            size="md"
            message="Aku bangga sekali padamu! Kamu anak hebat!"
            showSpeechBubble={true}
          />
        </div>

        {/* Reward stars box */}
        <div className="w-full bg-amber-50 rounded-3xl p-4 border-2 border-amber-200 flex items-center justify-center gap-3 my-2">
          <Sparkles className="w-8 h-8 text-amber-500 fill-amber-400 animate-spin-slow" />
          <div className="text-left">
            <span className="text-xs font-bold text-amber-700 uppercase">
              Bintang Terkumpul
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-950">
              +{starsEarned} Bintang Baru! 🌟
            </div>
          </div>
        </div>

        {/* Action buttons (Min 80px high on primary) */}
        <div className="w-full flex flex-col sm:flex-row gap-3 mt-4">
          <button
            id="celebration-btn-play-again"
            onClick={() => {
              playPopSound();
              onPlayAgain();
            }}
            className="flex-1 py-4 px-5 bg-sky-400 hover:bg-sky-500 active:scale-95 text-sky-950 font-black rounded-3xl shadow-md border-3 border-white text-lg flex items-center justify-center gap-2 transition-transform"
          >
            <RotateCcw className="w-6 h-6 stroke-[3]" />
            <span>Main Lagi</span>
          </button>

          <button
            id="celebration-btn-home"
            onClick={() => {
              playPopSound();
              onGoHome();
            }}
            className="flex-1 py-4 px-5 bg-amber-400 hover:bg-amber-500 active:scale-95 text-amber-950 font-black rounded-3xl shadow-lg border-3 border-white text-lg flex items-center justify-center gap-2 transition-transform"
          >
            <Home className="w-6 h-6 stroke-[3]" />
            <span>Pilih Modul Lain</span>
          </button>
        </div>
      </div>
    </div>
  );
};
