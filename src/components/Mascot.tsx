import React, { useState } from 'react';
import { MascotMood } from '../types';
import { speakIndonesian, playPopSound } from '../utils/audio';

interface MascotProps {
  mood?: MascotMood;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showSpeechBubble?: boolean;
  onTap?: () => void;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  mood = 'idle',
  message,
  size = 'md',
  showSpeechBubble = true,
  onTap,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Friendly phrases for tapping on mascot
  const defaultMessages: Record<MascotMood, string> = {
    idle: 'Halo sahabat kecil! Ayo belajar bersama!',
    speaking: 'Dengarkan baik-baik ya, teman!',
    happy: 'Hore! Hebat sekali jawabanmu!',
    encourage: 'Jangan khawatir, ayo coba lagi! Kamu pasti bisa!',
    celebrate: 'Luar biasa! Kamu pintar sekali!',
  };

  const currentMessage = message || defaultMessages[mood];

  const handleMascotClick = () => {
    playPopSound();
    speakIndonesian(currentMessage);
    if (onTap) onTap();
  };

  const sizeDimensions = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32 md:w-36 md:h-36',
    lg: 'w-44 h-44 md:w-52 md:h-52',
  };

  return (
    <div
      id="mascot-container"
      className={`relative flex flex-col items-center select-none ${className}`}
    >
      {/* Speech Bubble */}
      {showSpeechBubble && currentMessage && (
        <div
          id="mascot-speech-bubble"
          onClick={handleMascotClick}
          className="cursor-pointer mb-2 max-w-[280px] sm:max-w-xs bg-white text-amber-950 font-semibold px-4 py-2.5 rounded-2xl shadow-md border-2 border-amber-300 relative text-sm sm:text-base text-center transition-transform hover:scale-105 active:scale-95 animate-bounce-subtle"
        >
          <span>{currentMessage}</span>
          {/* Audio hint indicator */}
          <span className="inline-block ml-1.5 text-xs bg-amber-100 text-amber-800 rounded-full px-1.5 py-0.5 font-normal">
            🔊 Tap!
          </span>
          {/* Triangle speech pointer */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white" />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[9px] border-x-transparent border-t-[9px] border-t-amber-300 -z-10" />
        </div>
      )}

      {/* Mascot SVG Character: "Kiki si Kucing Ceria" */}
      <div
        id="mascot-avatar"
        onClick={handleMascotClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative cursor-pointer transition-transform duration-300 ${
          mood === 'celebrate' || mood === 'happy'
            ? 'scale-110'
            : isHovered
            ? 'scale-105'
            : 'scale-100'
        } active:scale-95`}
        title="Klik aku untuk bicara!"
      >
        <svg
          viewBox="0 0 160 160"
          className={`${sizeDimensions[size]} drop-shadow-lg`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Animated Glow Aura when happy or celebrating */}
          {(mood === 'happy' || mood === 'celebrate') && (
            <circle
              cx="80"
              cy="85"
              r="74"
              className="animate-pulse"
              fill="#FEF08A"
              opacity="0.6"
            />
          )}

          {/* Cat Ears */}
          {/* Left Ear */}
          <path
            d="M32 65 C22 25, 45 15, 62 42 Z"
            fill="#F59E0B"
            stroke="#D97706"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M38 58 C32 35, 46 27, 56 45 Z"
            fill="#FDE68A"
          />

          {/* Right Ear */}
          <path
            d="M128 65 C138 25, 115 15, 98 42 Z"
            fill="#F59E0B"
            stroke="#D97706"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M122 58 C128 35, 114 27, 104 45 Z"
            fill="#FDE68A"
          />

          {/* Body */}
          <ellipse
            cx="80"
            cy="125"
            rx="48"
            ry="30"
            fill="#F59E0B"
            stroke="#D97706"
            strokeWidth="4"
          />
          <ellipse
            cx="80"
            cy="128"
            rx="32"
            ry="20"
            fill="#FEF3C7"
          />

          {/* Head */}
          <ellipse
            cx="80"
            cy="84"
            rx="54"
            ry="48"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="4"
          />

          {/* Cute Forehead Hair/Fur stripes */}
          <path
            d="M74 44 L77 56 M80 42 L80 57 M86 44 L83 56"
            stroke="#D97706"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Rosy Cheeks */}
          <ellipse
            cx="48"
            cy="92"
            rx="10"
            ry="7"
            fill="#F472B6"
            opacity="0.8"
          />
          <ellipse
            cx="112"
            cy="92"
            rx="10"
            ry="7"
            fill="#F472B6"
            opacity="0.8"
          />

          {/* Whiskers Left */}
          <path
            d="M30 84 L14 82 M30 92 L12 95"
            stroke="#B45309"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Whiskers Right */}
          <path
            d="M130 84 L146 82 M130 92 L148 95"
            stroke="#B45309"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* EYES */}
          {mood === 'happy' || mood === 'celebrate' ? (
            // Joyful curved crescent eyes (^_^)
            <g stroke="#78350F" strokeWidth="4.5" strokeLinecap="round">
              <path d="M52 82 C56 74, 66 74, 70 82" />
              <path d="M90 82 C94 74, 104 74, 108 82" />
            </g>
          ) : mood === 'encourage' ? (
            // Gentle caring wide eyes with warmth
            <g>
              <ellipse cx="60" cy="80" rx="7.5" ry="9" fill="#78350F" />
              <ellipse cx="100" cy="80" rx="7.5" ry="9" fill="#78350F" />
              {/* Highlights */}
              <circle cx="58" cy="77" r="3" fill="#FFFFFF" />
              <circle cx="98" cy="77" r="3" fill="#FFFFFF" />
              <circle cx="63" cy="83" r="1.5" fill="#FFFFFF" />
              <circle cx="103" cy="83" r="1.5" fill="#FFFFFF" />
            </g>
          ) : (
            // Big playful cartoon eyes
            <g>
              <ellipse cx="60" cy="80" rx="8" ry="10" fill="#78350F" />
              <ellipse cx="100" cy="80" rx="8" ry="10" fill="#78350F" />
              {/* Big white shines */}
              <circle cx="58" cy="76" r="3.5" fill="#FFFFFF" />
              <circle cx="98" cy="76" r="3.5" fill="#FFFFFF" />
              <circle cx="63" cy="83" r="1.8" fill="#FFFFFF" />
              <circle cx="103" cy="83" r="1.8" fill="#FFFFFF" />
            </g>
          )}

          {/* Little Cute Nose */}
          <polygon
            points="76,88 84,88 80,94"
            fill="#EC4899"
            stroke="#DB2777"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* MOUTH */}
          {mood === 'celebrate' || mood === 'happy' ? (
            // Big open happy smile with tongue
            <g>
              <path
                d="M71 96 Q80 114 89 96 Z"
                fill="#EF4444"
                stroke="#B91C1C"
                strokeWidth="2"
              />
              <path
                d="M74 102 Q80 110 86 102 Z"
                fill="#F472B6"
              />
            </g>
          ) : mood === 'speaking' ? (
            // Cheerful talking mouth
            <ellipse
              cx="80"
              cy="100"
              rx="6"
              ry="5"
              fill="#EF4444"
              stroke="#B91C1C"
              strokeWidth="2"
            />
          ) : (
            // Sweet cat smile (:3)
            <path
              d="M72 96 Q76 101 80 96 Q84 101 88 96"
              stroke="#78350F"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Paws */}
          {mood === 'celebrate' || mood === 'happy' ? (
            // Paws raised celebrating \o/
            <g>
              <ellipse cx="38" cy="68" rx="9" ry="8" fill="#FEF3C7" stroke="#D97706" strokeWidth="3" />
              <ellipse cx="122" cy="68" rx="9" ry="8" fill="#FEF3C7" stroke="#D97706" strokeWidth="3" />
            </g>
          ) : (
            // Cute paws resting on chest
            <g>
              <ellipse cx="56" cy="120" rx="10" ry="7" fill="#FEF3C7" stroke="#D97706" strokeWidth="3" />
              <ellipse cx="104" cy="120" rx="10" ry="7" fill="#FEF3C7" stroke="#D97706" strokeWidth="3" />
            </g>
          )}

          {/* Floating Stars for celebration */}
          {(mood === 'happy' || mood === 'celebrate') && (
            <g fill="#F59E0B">
              <polygon points="20,40 23,48 31,49 25,54 27,62 20,57 13,62 15,54 9,49 17,48" className="animate-spin-slow" />
              <polygon points="140,40 143,48 151,49 145,54 147,62 140,57 133,62 135,54 129,49 137,48" className="animate-spin-slow" />
            </g>
          )}

          {/* Floating Heart for encouragement */}
          {mood === 'encourage' && (
            <g>
              <path
                d="M135 48 C135 43, 142 40, 145 44 C148 40, 155 43, 155 48 C155 54, 145 61, 145 61 C145 61, 135 54, 135 48 Z"
                fill="#F43F5E"
                className="animate-bounce"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
