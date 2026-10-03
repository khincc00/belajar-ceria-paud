// Katalog semua kalimat yang diucapkan aplikasi.
// Dipakai oleh komponen (supaya teksnya selalu sama) DAN oleh
// scripts/generate-voice-pack.ts untuk membuat paket suara offline.
// Kalau menambah kalimat baru, tambahkan di sini lalu jalankan `npm run voice-pack`.

import { LearningItem, ModuleId } from '../types';
import { LEARNING_MODULES } from './learningData';

/** Satu-satunya suara Gemini TTS yang dipakai aplikasi (suara Mimi). */
export const VOICE = 'Puck';

/** Kunci pencarian: spasi dirapikan supaya "A,  seperti" == "A, seperti". */
export function normalizePhrase(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

// ---------- Kalimat dengan template ----------
export const say = {
  welcomeModule: (judul: string) => `Selamat datang di ${judul}! Ayo kenali satu per satu!`,
  kenaliMascot: (item: LearningItem) => `Ini ${item.label}! ${item.contoh}`,
  celebration: (judul: string) => `Selamat! Kamu hebat sekali telah menyelesaikan ${judul}!`,

  // Cocokkan
  cocokPrompt: (item: LearningItem) => `Mana yang cocok dengan ${item.label}? ${item.contoh}?`,
  cocokMascotIdle: (item: LearningItem) => `Cari yang cocok dengan ${item.label} ya!`,
  cocokMascotSpeaking: (item: LearningItem) => `Mana yang cocok dengan ${item.label}?`,

  // Uji kuis
  ujiHurufContoh: (item: LearningItem) => `Huruf apa untuk ${item.contoh}?`,
  ujiHurufKecilText: (item: LearningItem) => `Mana pasangan huruf kecil untuk ${item.label}?`,
  ujiHurufKecilAudio: (item: LearningItem) => `Mana pasangan huruf kecil untuk huruf ${item.label}?`,
  ujiAngkaText: (item: LearningItem) => `Ada berapa ${item.contoh.split(' ')[1] || 'benda'} ini?`,
  ujiAngkaAudio: (item: LearningItem) => `Ada berapa ${item.contoh.split(' ')[1] || 'benda'} di kotak? Hitung yuk!`,
  ujiBentuk: (item: LearningItem) => `Benda mana yang berbentuk ${item.label}?`,
  ujiWarna: (item: LearningItem) => `Warna apa ${item.contoh}?`,
};

// ---------- Kalimat acak ----------
export const UJI_PRAISES = [
  'Hore! Luar biasa pintar!',
  'Benar sekali! Hebat!',
  'Jawabanmu sempurna!',
  'Wah, hebat sekali kamu!',
];

export const COCOK_CHEERS = [
  'Hore! Benar sekali! Kamu hebat!',
  'Pintar sekali! Jawabanmu tepat!',
  'Luar biasa! Benar!',
  'Bagus sekali! Kamu juara!',
];

export const UJI_ENCOURAGE = 'Ayo coba lagi, teman baik! Kamu pasti bisa!';
export const COCOK_ENCOURAGE = 'Hampir benar! Ayo coba pilih yang lain, kamu pasti bisa!';
export const COCOK_DONE = 'Hore! Kamu berhasil menyelesaikan permainan cocokkan!';

// ---------- Kalimat tetap lainnya ----------
// Prioritas 1: diucapkan otomatis saat bermain (dibuat duluan oleh generator)
const AUTO_PHRASES = [
  'Ayo belajar huruf A sampai Z!',
  'Ayo belajar angka dan berhitung!',
  'Ayo belajar berbagai macam bentuk!',
  'Ayo mengenal dunia warna-warni!',
  'Hebat! Sekarang ayo bermain mencocokkan!',
  'Progres belajar telah diulang dari awal!',
  'Kembali ke menu utama!',
  'Ayo semangat belajar dan kumpulkan banyak bintang!',
  'Tahap satu, kenali!',
  'Tahap dua, cocokkan!',
  'Tahap tiga, uji kuis seru!',
  UJI_ENCOURAGE,
  COCOK_ENCOURAGE,
  ...UJI_PRAISES,
  ...COCOK_CHEERS,
];

// Prioritas 2: hanya terdengar saat balon bicara maskot disentuh
const MASCOT_PHRASES = [
  'Halo teman kecil! Pilih petualangan belajarmu hari ini!',
  'Halo sahabat kecil! Ayo belajar bersama!',
  'Dengarkan baik-baik ya, teman!',
  'Hore! Hebat sekali jawabanmu!',
  'Jangan khawatir, ayo coba lagi! Kamu pasti bisa!',
  'Luar biasa! Kamu pintar sekali!',
  'Halo! Ayo belajar bersama Mimi!',
  'Aku bangga sekali padamu! Kamu anak hebat!',
  'Mau belajar apa lagi selanjutnya?',
  'Hebat! Sekarang mari kita mencocokkan!',
  'Keren banget! Saatnya kuis uji kepintaran!',
  COCOK_DONE,
];

/**
 * Semua kalimat unik yang mungkin diucapkan aplikasi,
 * diurutkan dari yang paling penting (otomatis terdengar) ke balon maskot.
 */
export function getAllVoicePhrases(): string[] {
  const out = new Set<string>();
  const add = (t: string) => out.add(normalizePhrase(t));
  const modules = (Object.keys(LEARNING_MODULES) as ModuleId[]).map((id) => LEARNING_MODULES[id]);

  // 1. Otomatis terdengar
  AUTO_PHRASES.forEach(add);
  modules.forEach((mod) => {
    add(say.celebration(mod.judul));
    mod.items.forEach((item) => {
      add(item.audioText);
      add(say.cocokPrompt(item));
      if (mod.modul === 'huruf') {
        add(say.ujiHurufContoh(item));
        add(say.ujiHurufKecilAudio(item));
      } else if (mod.modul === 'angka') {
        add(say.ujiAngkaAudio(item));
      } else if (mod.modul === 'bentuk') {
        add(say.ujiBentuk(item));
      } else {
        add(say.ujiWarna(item));
      }
    });
  });

  // 2. Balon bicara maskot (disentuh anak)
  MASCOT_PHRASES.forEach(add);
  modules.forEach((mod) => {
    add(say.welcomeModule(mod.judul));
    mod.items.forEach((item) => {
      add(say.kenaliMascot(item));
      add(say.cocokMascotIdle(item));
      add(say.cocokMascotSpeaking(item));
      if (mod.modul === 'huruf') add(say.ujiHurufKecilText(item));
      if (mod.modul === 'angka') add(say.ujiAngkaText(item));
    });
  });

  return [...out];
}
