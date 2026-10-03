export type ModuleId = 'huruf' | 'angka' | 'bentuk' | 'warna';

export type StageId = 'kenali' | 'cocokkan' | 'uji';

export interface LearningItem {
  id: string;
  label: string;
  subLabel?: string;
  contoh: string;
  gambarContoh: string;
  audioText: string;
  warna?: string;
  deskripsiBentuk?: string; // for shapes
  jumlah?: number; // for numbers
  detailSvg?: string; // for custom shapes or colors
}

export interface ModuleData {
  modul: ModuleId;
  judul: string;
  subjudul: string;
  ikon: string;
  warnaTema: {
    bg: string;
    cardBg: string;
    primary: string;
    secondary: string;
    border: string;
    text: string;
    lightBg: string;
  };
  items: LearningItem[];
}

export type MascotMood = 'idle' | 'happy' | 'encourage' | 'speaking' | 'celebrate';

export interface UserProgress {
  stars: number;
  completedStages: Record<string, boolean>; // e.g. "huruf_kenali": true
  completedModules: Record<ModuleId, boolean>;
  lastPlayedModule?: ModuleId;
}
