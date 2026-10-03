import React, { useEffect, useState } from 'react';
import { Headphones } from 'lucide-react';
import { VOICE } from '../data/voicePhrases';
import {
  ensureVoicePack,
  getVoicePackState,
  requestPersistentStorage,
  subscribeVoicePack,
  VoicePackState,
} from '../utils/voicePack';

/**
 * Mengunduh paket suara saat aplikasi dibuka.
 * Layar hanya muncul kalau memang perlu mengunduh dari internet (pertama kali,
 * atau setelah paket diperbarui). Kunjungan berikutnya langsung dari cache.
 */
export const VoicePackLoader: React.FC = () => {
  const [pack, setPack] = useState<VoicePackState>(getVoicePackState());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = subscribeVoicePack(setPack);
    requestPersistentStorage();
    ensureVoicePack(VOICE);
    return () => {
      unsub();
    };
  }, []);

  const visible = pack.status === 'loading' && pack.downloading && !dismissed;
  if (!visible) return null;

  const percent = pack.total > 0 ? Math.round((pack.done / pack.total) * 100) : 0;

  return (
    <div
      id="voice-pack-loader"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-pack-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-white rounded-[2rem] border-4 border-amber-300 shadow-2xl px-6 py-7 text-center">
        <div className="mx-auto mb-4 w-20 h-20 rounded-3xl bg-amber-400 border-4 border-white shadow-lg flex items-center justify-center animate-bounce-subtle">
          <Headphones className="w-10 h-10 text-amber-950 stroke-[2.5]" />
        </div>

        <h2 id="voice-pack-title" className="text-2xl sm:text-3xl font-extrabold text-amber-950">
          Menyiapkan suara Mimi…
        </h2>
        <p className="mt-2 text-sm sm:text-base font-semibold text-amber-900/80">
          Sebentar ya! Suara diunduh sekali saja, supaya nanti langsung terdengar tanpa menunggu.
        </p>

        <div
          className="mt-5 h-6 w-full rounded-full bg-amber-100 border-2 border-amber-300 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-[width] duration-300"
            style={{ width: `${Math.max(percent, 4)}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-bold text-amber-900 tabular-nums">
          {pack.done} dari {pack.total} suara • {percent}%
        </p>

        <button
          id="voice-pack-skip"
          onClick={() => setDismissed(true)}
          className="mt-5 text-sm font-bold text-amber-800 underline underline-offset-4 hover:text-amber-950 cursor-pointer"
        >
          Lanjut dulu, unduh di belakang
        </button>
      </div>
    </div>
  );
};
