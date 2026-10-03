import React from 'react';
import { StageId } from '../types';
import { Eye, Shapes, Award, CheckCircle2 } from 'lucide-react';
import { playPopSound, speakIndonesian } from '../utils/audio';

interface ModuleStageNavProps {
  currentStage: StageId;
  onSelectStage: (stage: StageId) => void;
  completedStages: Record<string, boolean>;
  moduleId: string;
}

export const ModuleStageNav: React.FC<ModuleStageNavProps> = ({
  currentStage,
  onSelectStage,
  completedStages,
  moduleId,
}) => {
  const stages: { id: StageId; label: string; icon: React.ReactNode; voiceText: string }[] = [
    {
      id: 'kenali',
      label: '1. Kenali',
      icon: <Eye className="w-5 h-5 sm:w-6 sm:h-6" />,
      voiceText: 'Tahap satu, kenali!',
    },
    {
      id: 'cocokkan',
      label: '2. Cocokkan',
      icon: <Shapes className="w-5 h-5 sm:w-6 sm:h-6" />,
      voiceText: 'Tahap dua, cocokkan!',
    },
    {
      id: 'uji',
      label: '3. Uji Kuis',
      icon: <Award className="w-5 h-5 sm:w-6 sm:h-6" />,
      voiceText: 'Tahap tiga, uji kuis seru!',
    },
  ];

  return (
    <nav
      id="module-stage-nav"
      className="w-full max-w-2xl mx-auto flex items-center justify-center gap-2 sm:gap-4 px-2 py-2 mb-4"
    >
      {stages.map((stage) => {
        const isActive = currentStage === stage.id;
        const isCompleted = !!completedStages[`${moduleId}_${stage.id}`];

        return (
          <button
            key={stage.id}
            id={`stage-tab-${stage.id}`}
            onClick={() => {
              playPopSound();
              speakIndonesian(stage.voiceText);
              onSelectStage(stage.id);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 sm:py-4 px-2 sm:px-4 rounded-2xl sm:rounded-3xl font-extrabold text-sm sm:text-base transition-all duration-200 shadow-md ${
              isActive
                ? 'bg-amber-400 text-amber-950 border-3 sm:border-4 border-white scale-105 shadow-lg'
                : 'bg-white/85 hover:bg-white text-gray-700 border-2 border-amber-200/70 hover:scale-102'
            }`}
          >
            <span className={isActive ? 'text-amber-950' : 'text-amber-600'}>
              {stage.icon}
            </span>
            <span className="whitespace-nowrap">{stage.label}</span>
            {isCompleted && (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 fill-emerald-100 shrink-0" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
