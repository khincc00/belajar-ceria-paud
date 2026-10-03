import { useState, useEffect } from 'react';
import { ModuleId, StageId, MascotMood, LearningItem } from './types';
import { LEARNING_MODULES } from './data/learningData';
import {
  loadProgress,
  addStars,
  markStageCompleted,
  markModuleCompleted,
  resetProgress,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { ModuleStageNav } from './components/ModuleStageNav';
import { KenaliStage } from './components/KenaliStage';
import { CocokkanStage } from './components/CocokkanStage';
import { UjiStage } from './components/UjiStage';
import { Mascot } from './components/Mascot';
import { CelebrationModal } from './components/CelebrationModal';
import { speakIndonesian, playPopSound } from './utils/audio';
import { say } from './data/voicePhrases';
import { VoicePackLoader } from './components/VoicePackLoader';

export default function App() {
  const [currentModuleId, setCurrentModuleId] = useState<ModuleId | null>(null);
  const [currentStage, setCurrentStage] = useState<StageId>('kenali');
  const [progress, setProgress] = useState(loadProgress);
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const [mascotMessage, setMascotMessage] = useState<string>('Halo! Ayo belajar bersama Mimi!');
  const [showCelebration, setShowCelebration] = useState(false);
  const [starsGainedInSession, setStarsGainedInSession] = useState(0);

  // Sync progress state with localStorage
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const currentModule = currentModuleId ? LEARNING_MODULES[currentModuleId] : null;

  // Background gradient based on selected module
  const getBgGradient = () => {
    if (!currentModuleId) {
      return 'bg-gradient-to-b from-amber-100 via-orange-50 to-amber-200';
    }
    return `bg-gradient-to-b ${currentModule?.warnaTema.bg || 'from-amber-100 to-amber-200'}`;
  };

  const handleSelectModule = (moduleId: ModuleId) => {
    setCurrentModuleId(moduleId);
    setCurrentStage('kenali');
    setStarsGainedInSession(0);
    setMascotMood('idle');
    setMascotMessage(say.welcomeModule(LEARNING_MODULES[moduleId].judul));
  };

  const handleGoHome = () => {
    setCurrentModuleId(null);
    setCurrentStage('kenali');
    setShowCelebration(false);
    setMascotMood('idle');
    setMascotMessage('Mau belajar apa lagi selanjutnya?');
  };

  const handleAddStar = (count: number) => {
    const updated = addStars(count);
    setProgress(updated);
    setStarsGainedInSession((prev) => prev + count);
  };

  const handleCompleteKenali = () => {
    if (currentModuleId) {
      const updated = markStageCompleted(currentModuleId, 'kenali');
      setProgress(updated);
      handleAddStar(1);
    }
    setCurrentStage('cocokkan');
    setMascotMood('happy');
    setMascotMessage('Hebat! Sekarang mari kita mencocokkan!');
  };

  const handleCompleteCocokkan = () => {
    if (currentModuleId) {
      const updated = markStageCompleted(currentModuleId, 'cocokkan');
      setProgress(updated);
      handleAddStar(2);
    }
    setCurrentStage('uji');
    setMascotMood('celebrate');
    setMascotMessage('Keren banget! Saatnya kuis uji kepintaran!');
  };

  const handleCompleteUji = () => {
    if (currentModuleId) {
      markStageCompleted(currentModuleId, 'uji');
      const updated = markModuleCompleted(currentModuleId);
      setProgress(updated);
      handleAddStar(3);
    }
    setShowCelebration(true);
  };

  const handleSetMascot = (mood: MascotMood, msg?: string) => {
    setMascotMood(mood);
    if (msg) setMascotMessage(msg);
  };

  const handleKenaliItemChange = (item: LearningItem) => {
    setMascotMood('idle');
    setMascotMessage(say.kenaliMascot(item));
  };

  const handleResetProgressConfirm = () => {
    if (window.confirm('Apakah Ayah / Bunda ingin mengulang semua bintang dan riwayat belajar anak dari awal?')) {
      playPopSound();
      const reset = resetProgress();
      setProgress(reset);
      speakIndonesian('Progres belajar telah diulang dari awal!');
    }
  };

  return (
    <div
      id="app-root-container"
      className={`min-h-screen w-full transition-colors duration-500 font-fredoka flex flex-col justify-between ${getBgGradient()}`}
    >
      {/* Top Navigation */}
      <Navbar
        currentModuleTitle={currentModule?.judul}
        stars={progress.stars}
        onGoHome={handleGoHome}
        onResetProgress={handleResetProgressConfirm}
        showHomeButton={currentModuleId !== null}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 py-2 flex flex-col items-center justify-center">
        {!currentModuleId ? (
          // Home View
          <HomeScreen
            modules={LEARNING_MODULES}
            progress={progress}
            onSelectModule={handleSelectModule}
          />
        ) : (
          // Active Module View
          <div id="module-container" className="w-full flex flex-col items-center">
            {/* 3 Stage Navigation (Kenali -> Cocokkan -> Uji) */}
            <ModuleStageNav
              currentStage={currentStage}
              onSelectStage={(stage) => {
                setCurrentStage(stage);
                setMascotMood('idle');
              }}
              completedStages={progress.completedStages}
              moduleId={currentModuleId}
            />

            {/* Stage Content */}
            <div className="w-full mt-2">
              {currentStage === 'kenali' && currentModule && (
                <KenaliStage
                  moduleData={currentModule}
                  onCompleteStage={handleCompleteKenali}
                  onItemChange={handleKenaliItemChange}
                />
              )}

              {currentStage === 'cocokkan' && currentModule && (
                <CocokkanStage
                  moduleData={currentModule}
                  onCompleteStage={handleCompleteCocokkan}
                  onSetMascot={handleSetMascot}
                  onAddStar={handleAddStar}
                />
              )}

              {currentStage === 'uji' && currentModule && (
                <UjiStage
                  moduleData={currentModule}
                  onCompleteModule={handleCompleteUji}
                  onSetMascot={handleSetMascot}
                  onAddStar={handleAddStar}
                />
              )}
            </div>

            {/* Mascot cheering on active module page footer */}
            <div className="mt-8 mb-4">
              <Mascot
                mood={mascotMood}
                message={mascotMessage}
                size="sm"
                showSpeechBubble={true}
              />
            </div>
          </div>
        )}
      </main>

      {/* Full-Screen Celebration Modal when completing module */}
      {showCelebration && currentModule && (
        <CelebrationModal
          moduleData={currentModule}
          starsEarned={starsGainedInSession > 0 ? starsGainedInSession : 5}
          onPlayAgain={() => {
            setShowCelebration(false);
            setCurrentStage('kenali');
          }}
          onGoHome={handleGoHome}
        />
      )}

      {/* Unduh paket suara offline saat pertama dibuka */}
      <VoicePackLoader />

      {/* Footer watermark */}
      <footer className="w-full text-center py-3 text-xs sm:text-sm font-semibold text-amber-900/60 select-none">
        Belajar Ceria PAUD-TK • Ramah Anak Usia 5-7 Tahun 🌟
      </footer>
    </div>
  );
}
