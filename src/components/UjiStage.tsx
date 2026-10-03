import React, { useState, useEffect, useMemo } from 'react';
import { ModuleData, MascotMood } from '../types';
import { Volume2, Sparkles, Star, Check } from 'lucide-react';
import { speakIndonesian, speakAfterCurrent, playPopSound, playCorrectSound, playGentleEncourageSound, playStarCollectSound } from '../utils/audio';
import { say, UJI_PRAISES, UJI_ENCOURAGE } from '../data/voicePhrases';

interface UjiStageProps {
  moduleData: ModuleData;
  onCompleteModule: () => void;
  onSetMascot: (mood: MascotMood, msg?: string) => void;
  onAddStar: (count: number) => void;
}

interface Question {
  id: string;
  questionText: string;
  audioText: string;
  targetVisual: string;
  options: {
    id: string;
    label: string;
    visual: string;
    isCorrect: boolean;
  }[];
}

export const UjiStage: React.FC<UjiStageProps> = ({
  moduleData,
  onCompleteModule,
  onSetMascot,
  onAddStar,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [starsEarnedInQuiz, setStarsEarnedInQuiz] = useState<number[]>([]);

  // Build 5 dynamic, age-appropriate questions based on module
  const questions: Question[] = useMemo(() => {
    const items = [...moduleData.items].sort(() => Math.random() - 0.5);

    if (moduleData.modul === 'huruf') {
      return items.slice(0, 5).map((item, idx) => {
        // Distractors
        const others = moduleData.items.filter((i) => i.id !== item.id).sort(() => Math.random() - 0.5);
        const distractor1 = others[0];
        const distractor2 = others[1];

        // Question types variation:
        if (idx % 2 === 0) {
          // Question: "Huruf apa untuk hewan/benda ini?"
          const options = [
            { id: item.id, label: item.label, visual: item.gambarContoh, isCorrect: true },
            { id: distractor1.id, label: distractor1.label, visual: distractor1.gambarContoh, isCorrect: false },
            { id: distractor2.id, label: distractor2.label, visual: distractor2.gambarContoh, isCorrect: false },
          ].sort(() => Math.random() - 0.5);

          return {
            id: `q_huruf_${idx}`,
            questionText: say.ujiHurufContoh(item),
            audioText: say.ujiHurufContoh(item),
            targetVisual: item.gambarContoh,
            options,
          };
        } else {
          // Question: "Mana huruf kecil dari huruf ini?"
          const options = [
            { id: item.id, label: item.subLabel || item.label.toLowerCase(), visual: '✨', isCorrect: true },
            { id: distractor1.id, label: distractor1.subLabel || distractor1.label.toLowerCase(), visual: '✨', isCorrect: false },
            { id: distractor2.id, label: distractor2.subLabel || distractor2.label.toLowerCase(), visual: '✨', isCorrect: false },
          ].sort(() => Math.random() - 0.5);

          return {
            id: `q_huruf_kecil_${idx}`,
            questionText: say.ujiHurufKecilText(item),
            audioText: say.ujiHurufKecilAudio(item),
            targetVisual: item.label,
            options,
          };
        }
      });
    } else if (moduleData.modul === 'angka') {
      return items.slice(0, 5).map((item, idx) => {
        const others = moduleData.items.filter((i) => i.id !== item.id).sort(() => Math.random() - 0.5);
        const distractor1 = others[0];
        const distractor2 = others[1];

        const count = item.jumlah || 1;
        const visualEmojis = Array.from({ length: Math.min(count, 10) })
          .map(() => item.gambarContoh)
          .join(' ');

        const options = [
          { id: item.id, label: item.label, visual: '🔢', isCorrect: true },
          { id: distractor1.id, label: distractor1.label, visual: '🔢', isCorrect: false },
          { id: distractor2.id, label: distractor2.label, visual: '🔢', isCorrect: false },
        ].sort(() => Math.random() - 0.5);

        return {
          id: `q_angka_${idx}`,
          questionText: say.ujiAngkaText(item),
          audioText: say.ujiAngkaAudio(item),
          targetVisual: visualEmojis,
          options,
        };
      });
    } else if (moduleData.modul === 'bentuk') {
      return items.slice(0, 5).map((item, idx) => {
        const others = moduleData.items.filter((i) => i.id !== item.id).sort(() => Math.random() - 0.5);
        const distractor1 = others[0];
        const distractor2 = others[1];

        const options = [
          { id: item.id, label: item.label, visual: item.gambarContoh, isCorrect: true },
          { id: distractor1.id, label: distractor1.label, visual: distractor1.gambarContoh, isCorrect: false },
          { id: distractor2.id, label: distractor2.label, visual: distractor2.gambarContoh, isCorrect: false },
        ].sort(() => Math.random() - 0.5);

        return {
          id: `q_bentuk_${idx}`,
          questionText: say.ujiBentuk(item),
          audioText: say.ujiBentuk(item),
          targetVisual: item.gambarContoh,
          options,
        };
      });
    } else {
      // Warna
      return items.slice(0, 5).map((item, idx) => {
        const others = moduleData.items.filter((i) => i.id !== item.id).sort(() => Math.random() - 0.5);
        const distractor1 = others[0];
        const distractor2 = others[1];

        const options = [
          { id: item.id, label: item.label, visual: item.gambarContoh, isCorrect: true },
          { id: distractor1.id, label: distractor1.label, visual: distractor1.gambarContoh, isCorrect: false },
          { id: distractor2.id, label: distractor2.label, visual: distractor2.gambarContoh, isCorrect: false },
        ].sort(() => Math.random() - 0.5);

        return {
          id: `q_warna_${idx}`,
          questionText: say.ujiWarna(item),
          audioText: say.ujiWarna(item),
          targetVisual: item.gambarContoh,
          options,
        };
      });
    }
  }, [moduleData]);

  const currentQ = questions[currentQuestionIndex] || questions[0];

  // Speak question on transition
  useEffect(() => {
    setIsCorrect(null);
    setSelectedOptionId(null);
    setIsAnswerLocked(false);

    speakAfterCurrent(currentQ.audioText); // tunggu pujian sebelumnya selesai
    onSetMascot('speaking', currentQ.questionText);
  }, [currentQuestionIndex, currentQ]);

  const handleSpeakQuestion = () => {
    playPopSound();
    speakIndonesian(currentQ.audioText);
    onSetMascot('speaking', currentQ.questionText);
  };

  const handleOptionClick = (option: { id: string; label: string; isCorrect: boolean }) => {
    if (isAnswerLocked) return;

    setSelectedOptionId(option.id);

    if (option.isCorrect) {
      setIsCorrect(true);
      setIsAnswerLocked(true);
      playCorrectSound();
      playStarCollectSound();
      onAddStar(2); // 2 stars for quiz
      setStarsEarnedInQuiz((prev) => [...prev, currentQuestionIndex]);

      const praise = UJI_PRAISES[Math.floor(Math.random() * UJI_PRAISES.length)];
      speakIndonesian(praise);
      onSetMascot('happy', praise);

      // Advance to next question or complete module
      setTimeout(() => {
        if (currentQuestionIndex + 1 < questions.length) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          // Completed the whole module quiz!
          onCompleteModule();
        }
      }, 1600);
    } else {
      setIsCorrect(false);
      playGentleEncourageSound();
      const encouragement = UJI_ENCOURAGE;
      speakIndonesian(encouragement);
      onSetMascot('encourage', encouragement);

      setTimeout(() => {
        setSelectedOptionId(null);
        setIsCorrect(null);
      }, 1200);
    }
  };

  return (
    <div id="uji-stage" className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Visual Stars Progress Bar */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <span className="text-sm font-bold text-amber-900 bg-amber-100 px-3.5 py-1.5 rounded-full border border-amber-300">
          Soal Kuis {currentQuestionIndex + 1} dari {questions.length}
        </span>

        {/* Visual Sticker / Star Collection Bar */}
        <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full border-2 border-amber-200">
          {questions.map((_, i) => {
            const hasStar = starsEarnedInQuiz.includes(i);
            return (
              <Star
                key={i}
                className={`w-6 h-6 transition-all duration-300 ${
                  hasStar
                    ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow'
                    : i === currentQuestionIndex
                    ? 'text-amber-300 animate-pulse'
                    : 'text-gray-300 fill-gray-100'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Question Card */}
      <div
        id="uji-question-card"
        className="w-full bg-white rounded-3xl sm:rounded-[36px] p-6 sm:p-8 shadow-xl border-4 border-amber-300 text-center flex flex-col items-center relative"
      >
        {/* Speaker audio button */}
        <button
          id="uji-btn-speak"
          onClick={handleSpeakQuestion}
          className="absolute top-4 right-4 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black shadow-md border-3 border-white flex items-center justify-center transition-transform"
          title="Dengarkan Soal"
          aria-label="Dengarkan Soal"
        >
          <Volume2 className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
        </button>

        <h3 className="text-xl sm:text-2xl font-black text-amber-950 max-w-md mt-1 mb-2 font-fredoka">
          {currentQ.questionText}
        </h3>

        {/* Question visual cue */}
        <div className="my-2 p-5 bg-amber-50 rounded-3xl border-3 border-amber-200 flex items-center justify-center min-w-[140px] shadow-sm">
          <span className="text-6xl sm:text-7xl drop-shadow animate-bounce-subtle">
            {currentQ.targetVisual}
          </span>
        </div>

        <p className="text-sm sm:text-base font-bold text-gray-600 mt-2 mb-2">
          Pilih jawaban yang benar:
        </p>

        {/* Big visual choices (Min 80x80px) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full mt-2">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const showSuccess = isSelected && isCorrect === true;
            const showWrong = isSelected && isCorrect === false;

            return (
              <button
                key={opt.id}
                id={`uji-opt-${opt.id}`}
                onClick={() => handleOptionClick(opt)}
                disabled={isAnswerLocked}
                className={`min-h-[110px] sm:min-h-[130px] p-4 rounded-3xl font-black flex flex-col items-center justify-center gap-1.5 transition-all duration-200 shadow-md border-4 ${
                  showSuccess
                    ? 'bg-emerald-400 text-emerald-950 border-white scale-105 shadow-xl animate-bounce'
                    : showWrong
                    ? 'bg-rose-200 text-rose-950 border-rose-400 scale-95'
                    : 'bg-white hover:bg-amber-100/80 active:scale-95 text-amber-950 border-amber-200 hover:border-amber-400'
                }`}
              >
                <span className="text-3xl sm:text-4xl">
                  {opt.visual}
                </span>

                <span className="text-2xl sm:text-3xl font-black font-fredoka">
                  {opt.label}
                </span>

                {showSuccess && (
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-950 bg-white/90 px-2.5 py-0.5 rounded-full">
                    <Check className="w-4 h-4 stroke-[3]" /> Hebat!
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
