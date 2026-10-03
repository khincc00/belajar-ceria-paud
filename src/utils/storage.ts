import { ModuleId, UserProgress } from '../types';

const STORAGE_KEY = 'belajar_ceria_progress_v1';

const DEFAULT_PROGRESS: UserProgress = {
  stars: 0,
  completedStages: {},
  completedModules: {
    huruf: false,
    angka: false,
    bentuk: false,
    warna: false,
  },
};

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      completedStages: parsed.completedStages || {},
      completedModules: {
        ...DEFAULT_PROGRESS.completedModules,
        ...(parsed.completedModules || {}),
      },
    };
  } catch (e) {
    console.error('Failed to load progress from localStorage', e);
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress to localStorage', e);
  }
}

export function addStars(count: number): UserProgress {
  const current = loadProgress();
  const updated: UserProgress = {
    ...current,
    stars: Math.max(0, current.stars + count),
  };
  saveProgress(updated);
  return updated;
}

export function markStageCompleted(moduleId: ModuleId, stage: string): UserProgress {
  const current = loadProgress();
  const key = `${moduleId}_${stage}`;
  const updated: UserProgress = {
    ...current,
    completedStages: {
      ...current.completedStages,
      [key]: true,
    },
  };
  saveProgress(updated);
  return updated;
}

export function markModuleCompleted(moduleId: ModuleId): UserProgress {
  const current = loadProgress();
  const updated: UserProgress = {
    ...current,
    completedModules: {
      ...current.completedModules,
      [moduleId]: true,
    },
  };
  saveProgress(updated);
  return updated;
}

export function resetProgress(): UserProgress {
  saveProgress(DEFAULT_PROGRESS);
  return DEFAULT_PROGRESS;
}
