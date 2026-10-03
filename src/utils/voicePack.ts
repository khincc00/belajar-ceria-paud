// Paket Suara Offline
// ------------------------------------------------------------------
// Semua kalimat sudah dibuat sebelumnya (npm run voice-pack) dan disimpan di
// public/voice/<Suara>/. Saat aplikasi dibuka, paketnya diunduh SEKALI,
// disimpan di Cache Storage browser (tetap ada walau offline / dibuka lagi),
// lalu dimuat ke memori supaya suara bisa diputar instan tanpa menunggu internet.

import { normalizePhrase } from '../data/voicePhrases';

export interface VoicePackManifest {
  version: number;
  voice: string;
  generatedAt?: string;
  totalBytes?: number;
  /** teks (sudah dinormalisasi) -> nama file mp3 */
  clips: Record<string, string>;
}

export type VoicePackStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

export interface VoicePackState {
  voice: string | null;
  status: VoicePackStatus;
  done: number;
  total: number;
  /** true jika file harus diunduh dari internet (bukan dari cache) */
  downloading: boolean;
}

const CACHE_PREFIX = 'kelas-kecil-voice-';
const PARALLEL_DOWNLOADS = 6;

let state: VoicePackState = { voice: null, status: 'idle', done: 0, total: 0, downloading: false };
const listeners = new Set<(s: VoicePackState) => void>();

/** Byte mp3 per kalimat untuk suara yang sedang aktif (kecil, ±10 KB per klip). */
let clipBytes = new Map<string, ArrayBuffer>();
let loadedVoice: string | null = null;
let loadPromise: Promise<void> | null = null;
let loadingVoice: string | null = null;

function setState(patch: Partial<VoicePackState>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn(state));
}

export function getVoicePackState(): VoicePackState {
  return state;
}

export function subscribeVoicePack(fn: (s: VoicePackState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Ambil byte mp3 untuk kalimat ini, kalau ada di paket suara yang sudah dimuat. */
export function getClipBytes(voice: string, text: string): ArrayBuffer | null {
  if (loadedVoice !== voice) return null;
  return clipBytes.get(normalizePhrase(text)) ?? null;
}

export function isVoicePackReady(voice: string): boolean {
  return loadedVoice === voice && state.status === 'ready';
}

function baseUrl(voice: string) {
  const base = (import.meta as any).env?.BASE_URL ?? '/';
  return `${base}voice/${encodeURIComponent(voice)}/`;
}

async function openCache(voice: string): Promise<Cache | null> {
  try {
    if (typeof caches === 'undefined') return null; // butuh https / localhost
    return await caches.open(CACHE_PREFIX + voice);
  } catch {
    return null;
  }
}

/** Hapus cache suara lain yang dulu pernah dipilih (mis. Kak Luna), supaya tidak memakan memori. */
async function deleteOtherVoiceCaches(voice: string): Promise<void> {
  try {
    if (typeof caches === 'undefined') return;
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE_PREFIX + voice).map((n) => caches.delete(n))
    );
  } catch {
    // abaikan
  }
}

async function fetchClip(url: string, cache: Cache | null): Promise<{ bytes: ArrayBuffer; fromNetwork: boolean }> {
  if (cache) {
    const hit = await cache.match(url);
    if (hit) return { bytes: await hit.arrayBuffer(), fromNetwork: false };
  }
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (cache) {
        try {
          await cache.put(url, res.clone());
        } catch {
          // kuota penyimpanan penuh: tetap lanjut, cuma tidak tersimpan permanen
        }
      }
      return { bytes: await res.arrayBuffer(), fromNetwork: true };
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function doLoad(voice: string): Promise<void> {
  setState({ voice, status: 'loading', done: 0, total: 0, downloading: false });

  let manifest: VoicePackManifest;
  try {
    const res = await fetch(baseUrl(voice) + 'manifest.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('no manifest');
    manifest = await res.json();
  } catch {
    // Paket untuk suara ini belum dibuat -> aplikasi tetap jalan dengan suara online.
    if (loadingVoice === voice) setState({ status: 'unavailable' });
    return;
  }

  const entries = Object.entries(manifest.clips);
  await deleteOtherVoiceCaches(voice);
  const cache = await openCache(voice);
  const next = new Map<string, ArrayBuffer>();
  let done = 0;
  let failed = 0;
  setState({ total: entries.length });

  let cursor = 0;
  const worker = async () => {
    while (cursor < entries.length) {
      if (loadingVoice !== voice) return; // pengguna ganti suara di tengah jalan
      const [text, file] = entries[cursor++];
      try {
        const { bytes, fromNetwork } = await fetchClip(baseUrl(voice) + file, cache);
        next.set(normalizePhrase(text), bytes);
        if (fromNetwork && !state.downloading) setState({ downloading: true });
      } catch {
        failed++;
      }
      done++;
      if (loadingVoice === voice) setState({ done });
    }
  };
  await Promise.all(Array.from({ length: PARALLEL_DOWNLOADS }, worker));
  if (loadingVoice !== voice) return;

  // Bersihkan file lama di cache yang sudah tidak dipakai manifest terbaru
  if (cache) {
    try {
      const wanted = new Set(entries.map(([, f]) => new URL(baseUrl(voice) + f, location.href).href));
      const keys = await cache.keys();
      await Promise.all(keys.filter((k) => !wanted.has(k.url)).map((k) => cache.delete(k)));
    } catch {
      // abaikan
    }
  }

  clipBytes = next;
  loadedVoice = voice;
  setState({ status: next.size > 0 ? 'ready' : 'error', downloading: false });
  if (failed > 0) console.warn(`[Paket Suara] ${failed} klip gagal diunduh, akan memakai suara online.`);
}

/**
 * Pastikan paket suara untuk `voice` sudah dimuat. Aman dipanggil berkali-kali.
 * Selesai (resolve) setelah paket siap, atau segera jika paket belum tersedia.
 */
export function ensureVoicePack(voice: string): Promise<void> {
  if (loadedVoice === voice && state.status === 'ready') return Promise.resolve();
  if (loadingVoice === voice && loadPromise) return loadPromise;
  loadingVoice = voice;
  loadPromise = doLoad(voice).catch(() => {
    if (loadingVoice === voice) setState({ status: 'error' });
  });
  return loadPromise;
}

/** Minta browser agar cache suara tidak dihapus otomatis (best effort). */
export function requestPersistentStorage(): void {
  try {
    (navigator as any).storage?.persist?.();
  } catch {
    // abaikan
  }
}
