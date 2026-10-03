import React, { useState, useEffect, useMemo } from 'react';
import { LearningItem, ModuleData, MascotMood } from '../types';
import { Volume2, Sparkles, Check, ArrowRight } from 'lucide-react';
import { speakIndonesian, speakAfterCurrent, playPopSound, playCorrectSound, playGentleEncourageSound, playStarCollectSound } from '../utils/audio';
import { say, COCOK_CHEERS, COCOK_ENCOURAGE, COCOK_DONE } from '../data/voicePhrases';

interface CocokkanStageProps {
  moduleData: ModuleData;
  onCompleteStage: () => void;
  onSetMascot: (mood: MascotMood, msg?: string) => void;
  onAddStar: (count: number) => void;
}

export const CocokkanStage: React.FC<CocokkanStageProps> = ({
  moduleData,
  onCompleteStage,
  onSetMascot,
  onAddStar,
}) => {
  const [round, setRound] = useState(0);
  const totalRounds = 5;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // Generate target and 3 options for current round
  const currentChallenge = useMemo(() => {
    // Pick random target
    const shuffledItems = [...moduleData.items].sort(() => Math.random() - 0.5);
    const target = shuffledItems[0];

    // Pick 2 distractors
    const distractors = shuffledItems.slice(1, 3);
    const options = [target, ...distractors].sort(() => Math.random() - 0.5);

    return { target, options };
  }, [round, moduleData.items]);

  const { target, options } = currentChallenge;

  // Speak prompt when challenge starts
  useEffect(() => {
    setIsCorrect(null);
    setSelectedOptionId(null);
    setIsAnswerLocked(false);
    setFeedbackText('');

    const promptText = say.cocokPrompt(target);
    speakAfterCurrent(promptText); // tunggu pujian / ucapan sebelumnya selesai
    onSetMascot('idle', say.cocokMascotIdle(target));
  }, [round, target]);

  const handleSpeakTarget = () => {
    playPopSound();
    const promptText = say.cocokPrompt(target); // tombol speaker mengulang pertanyaan
    speakIndonesian(promptText);
    onSetMascot('speaking', say.cocokMascotSpeaking(target));
  };

  const handleSelectOption = (option: LearningItem) => {
    if (isAnswerLocked) return;

    setSelectedOptionId(option.id);
    const match = option.id === target.id;

    if (match) {
      setIsCorrect(true);
      setIsAnswerLocked(true);
      playCorrectSound();
      playStarCollectSound();
      onAddStar(1);

      const cheer = COCOK_CHEERS[Math.floor(Math.random() * COCOK_CHEERS.length)];
      setFeedbackText(cheer);
      speakIndonesian(cheer);
      onSetMascot('happy', cheer);

      // Auto advance after short celebration
      setTimeout(() => {
        if (round + 1 < totalRounds) {
          setRound((r) => r + 1);
        } else {
          // Completed all rounds
          onSetMascot('celebrate', COCOK_DONE);
          onCompleteStage();
        }
      }, 1600);
    } else {
      setIsCorrect(false);
      playGentleEncourageSound();
      const encouragement = COCOK_ENCOURAGE;
      setFeedbackText(encouragement);
      speakIndonesian(encouragement);
      onSetMascot('encourage', encouragement);

      // Reset selection after brief moment so child can try again without penalty
      setTimeout(() => {
        setSelectedOptionId(null);
        setIsCorrect(null);
      }, 1200);
    }
  };

  return (
    <div id="cocokkan-stage" className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Progress tracker */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <span className="text-sm font-bold text-amber-900 bg-amber-100 px-3.5 py-1.5 rounded-full border border-amber-300">
          Tantangan {round + 1} dari {totalRounds}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                i < round
                  ? 'bg-amber-500 scale-110'
                  : i === round
                  ? 'bg-amber-400 animate-pulse border-2 border-amber-600'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Target Question Box */}
      <div
        id="cocokkan-target-card"
        className="w-full bg-white rounded-3xl sm:rounded-[36px] p-6 sm:p-7 shadow-xl border-4 border-amber-300 text-center flex flex-col items-center relative"
      >
        {/* Speaker hint */}
        <button
          id="cocokkan-btn-speak"
          onClick={handleSpeakTarget}
          className="absolute top-4 right-4 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black shadow-md border-3 border-white flex items-center justify-center transition-transform"
          title="Ulangi Pertanyaan"
          aria-label="Ulangi Pertanyaan"
        >
          <Volume2 className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
        </button>

        <p className="text-base sm:text-lg font-bold text-amber-800 mb-1">
          Mana yang sama dengan:
        </p>

        {/* Target Item Display */}
        <div className="my-2 p-4 bg-amber-50 rounded-3xl border-3 border-amber-200 flex flex-col items-center min-w-[200px] shadow-sm">
          <span className="text-6xl sm:text-7xl mb-1 drop-shadow">
            {target.gambarContoh}
          </span>
          <span className="text-3xl sm:text-4xl font-black text-amber-950 font-fredoka">
            {target.label}
          </span>
          <span className="text-base sm:text-lg font-extrabold text-amber-700">
            {target.contoh}
          </span>
        </div>

        {/* Feedback message banner if answered */}
        {feedbackText && (
          <div
            id="cocokkan-feedback-banner"
            className={`mt-2 px-4 py-2 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2 animate-bounce-subtle ${
              isCorrect
                ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400'
                : 'bg-rose-100 text-rose-900 border-2 border-rose-300'
            }`}
          >
            {isCorrect ? <Sparkles className="w-5 h-5 text-emerald-600" /> : '❤️'}
            <span>{feedbackText}</span>
          </div>
        )}

        <p className="text-sm sm:text-base font-bold text-gray-600 mt-4">
          👉 Sentuh salah satu kartu di bawah ini:
        </p>

        {/* 3 Large Option Cards (Min 80x80px interactive area) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full mt-3">
          {options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const showSuccess = isSelected && isCorrect === true;
            const showWrong = isSelected && isCorrect === false;

            return (
              <button
                key={option.id}
                id={`cocokkan-option-${option.id}`}
                onClick={() => handleSelectOption(option)}
                disabled={isAnswerLocked}
                className={`min-h-[100px] sm:min-h-[120px] p-4 rounded-3xl font-black flex flex-col items-center justify-center gap-1 transition-all duration-200 shadow-md border-4 ${
                  showSuccess
                    ? 'bg-emerald-400 text-emerald-950 border-white scale-105 shadow-xl animate-bounce'
                    : showWrong
                    ? 'bg-rose-200 text-rose-950 border-rose-400 scale-95'
                    : 'bg-white hover:bg-amber-100/70 active:scale-95 text-amber-950 border-amber-200 hover:border-amber-400'
                }`}
              >
                {/* Visual glyph or icon */}
                <span className="text-4xl sm:text-5xl">
                  {option.gambarContoh}
                </span>

                <span className="text-2xl sm:text-3xl font-black font-fredoka">
                  {option.label}
                </span>

                {showSuccess && (
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-950 bg-white/80 px-2 py-0.5 rounded-full">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Benar!
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skip or Finish early button if child wants */}
      <div className="mt-4 flex justify-center">
        <button
          id="cocokkan-btn-next-step"
          onClick={() => {
            playPopSound();
            onCompleteStage();
          }}
          className="text-amber-800 hover:text-amber-950 font-extrabold text-sm sm:text-base underline underline-offset-4 flex items-center gap-1.5 p-2"
        >
          <span>Lanjut ke Kuis Uji</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
