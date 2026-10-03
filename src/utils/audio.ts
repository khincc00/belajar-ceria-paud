// Web Audio API & Gemini AI Fluid Voice Sound Engine
// Urutan pemutaran suara:
//   1. Paket suara offline (sudah diunduh di awal)  -> instan, tanpa delay
//   2. Cache memori dari Gemini TTS sesi ini
//   3. Gemini TTS lewat server (/api/tts)
//   4. Suara bawaan browser (Web Speech)

import { getClipBytes, getVoicePackState } from './voicePack';
import { VOICE } from '../data/voicePhrases';

let audioCtx: AudioContext | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentAbortController: AbortController | null = null;
const clientAudioCache = new Map<string, string>();
let clientRateLimitedUntil = 0;

// --- Pemutaran dari paket suara ---
let currentSource: AudioBufferSourceNode | null = null;
let speakToken = 0; // naik setiap ada ucapan baru / stop, untuk membatalkan decode yang telat
const decodedCache = new Map<ArrayBuffer, AudioBuffer>();
const DECODED_CACHE_MAX = 40;

// iOS Safari: agar suara tetap keluar walau tombol senyap (silent switch) aktif
try {
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  if (nav?.audioSession) nav.audioSession.type = 'playback';
} catch {
  // abaikan
}

async function decodeClip(ctx: AudioContext, bytes: ArrayBuffer): Promise<AudioBuffer> {
  const hit = decodedCache.get(bytes);
  if (hit) {
    // pindahkan ke paling baru (LRU sederhana)
    decodedCache.delete(bytes);
    decodedCache.set(bytes, hit);
    return hit;
  }
  // slice(0): decodeAudioData "mengosongkan" buffer aslinya, jadi kirim salinan
  const buf = await ctx.decodeAudioData(bytes.slice(0));
  decodedCache.set(bytes, buf);
  if (decodedCache.size > DECODED_CACHE_MAX) {
    const oldest = decodedCache.keys().next().value;
    if (oldest) decodedCache.delete(oldest);
  }
  return buf;
}

/** Putar klip dari paket suara. Mengembalikan false jika tidak bisa (lanjut ke cara lain). */
async function playFromVoicePack(
  bytes: ArrayBuffer,
  token: number,
  onStart?: () => void,
  onEnd?: () => void
): Promise<boolean> {
  const ctx = getAudioContext();
  if (ctx && ctx.state !== 'running') {
    try {
      await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 150))]);
    } catch {
      // abaikan
    }
  }

  // Jalur utama: Web Audio (latensi paling kecil)
  if (ctx && ctx.state === 'running') {
    try {
      const buffer = await decodeClip(ctx, bytes);
      if (token !== speakToken) return true; // sudah dibatalkan oleh ucapan lain
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 1;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.onended = () => {
        if (currentSource === source) {
          currentSource = null;
          onEnd?.();
        }
      };
      currentSource = source;
      source.start();
      onStart?.();
      return true;
    } catch {
      // jatuh ke <audio>
    }
  }

  // Cadangan: elemen <audio> dari data lokal (tetap tanpa internet)
  try {
    if (token !== speakToken) return true;
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onplay = () => onStart?.();
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      onEnd?.();
    };
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

// Antrean ucapan otomatis: menunggu ucapan yang sedang jalan selesai (tidak memotong)
let isSpeaking = false;
let speakingSince = 0;
const SPEAKING_STALE_MS = 20000; // pengaman: ucapan yang tak pernah melapor selesai
const speechQueue: string[] = [];

// Stop any currently playing speech immediately
export function stopSpeaking(keepQueue = false): void {
  speakToken++;
  isSpeaking = false;
  if (!keepQueue) speechQueue.length = 0;
  if (currentSource) {
    const src = currentSource;
    currentSource = null;
    try {
      src.onended = null;
      src.stop();
    } catch {
      // sudah berhenti
    }
  }
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Cached voice lookup for high-quality natural Indonesian
let cachedIdVoice: SpeechSynthesisVoice | null = null;

function getBestIndonesianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (cachedIdVoice) return cachedIdVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Priority ranking: Natural/Online voices > Google Indonesian > Any id-ID > id
  const naturalId = voices.find(
    v => (v.lang === 'id-ID' || v.lang.startsWith('id')) &&
         (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('online'))
  );
  if (naturalId) {
    cachedIdVoice = naturalId;
    return naturalId;
  }

  const googleId = voices.find(
    v => (v.lang === 'id-ID' || v.lang.startsWith('id')) && v.name.toLowerCase().includes('google')
  );
  if (googleId) {
    cachedIdVoice = googleId;
    return googleId;
  }

  const anyId = voices.find(
    v => v.lang === 'id-ID' || v.lang.toLowerCase().replace('_', '-').startsWith('id') || v.name.toLowerCase().includes('indonesia')
  );
  if (anyId) {
    cachedIdVoice = anyId;
    return anyId;
  }

  return null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedIdVoice = null;
    getBestIndonesianVoice();
  };
}

// Smooth fallback using browser's best available speech engine
function fallbackWebSpeech(text: string, onStart?: () => void, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95; // Natural friendly conversational tempo
    utterance.pitch = 1.06; // Warm, upbeat pitch for children

    const bestVoice = getBestIndonesianVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    if (onStart) utterance.onstart = () => onStart();
    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Speak text using fluid, human-like Gemini TTS with natural intonation and instant local fallback
export function speakIndonesian(text: string, onStart?: () => void, onEnd?: () => void): Promise<void> {
  return runSpeech(text, onStart, onEnd, false);
}

/**
 * Ucapkan setelah ucapan yang sedang berjalan selesai (tidak memotongnya).
 * Dipakai untuk ucapan otomatis, mis. soal baru setelah pujian. Kalau anak menyentuh
 * sesuatu yang memicu ucapan baru, antrean ini dibatalkan.
 */
export function speakAfterCurrent(text: string): void {
  if (!text) return;
  if (isSpeaking && Date.now() - speakingSince < SPEAKING_STALE_MS) {
    speechQueue.push(text);
    return;
  }
  runSpeech(text, undefined, undefined, false);
}

async function runSpeech(
  text: string,
  onStartRaw: (() => void) | undefined,
  onEndRaw: (() => void) | undefined,
  fromQueue: boolean
): Promise<void> {
  if (!text || typeof window === 'undefined') {
    onEndRaw?.();
    return;
  }

  // Stop previous speech to prevent overlapping voices
  stopSpeaking(fromQueue);

  const voice = VOICE;
  const trimmed = text.trim();
  const cacheKey = `${voice}:${trimmed}`;
  const token = speakToken;
  isSpeaking = true;
  speakingSince = Date.now();

  const onStart = onStartRaw;
  let finished = false;
  const onEnd = () => {
    // abaikan jika sudah dipotong ucapan lain
    if (finished || token !== speakToken) return;
    finished = true;
    isSpeaking = false;
    onEndRaw?.();
    const next = speechQueue.shift();
    if (next) runSpeech(next, undefined, undefined, true);
  };

  // 0. Paket suara offline: putar langsung dari memori, tanpa menunggu internet
  const packBytes = getClipBytes(voice, trimmed);
  if (packBytes) {
    if (await playFromVoicePack(packBytes, token, onStart, onEnd)) return;
  } else if (import.meta.env?.DEV && getVoicePackState().status === 'ready') {
    console.warn('[Paket Suara] Kalimat belum ada di paket, tambahkan ke src/data/voicePhrases.ts:', trimmed);
  }

  const playAudioElement = (audioDataUrl: string) => {
    try {
      const audio = new Audio(audioDataUrl);
      currentAudio = audio;
      audio.onplay = () => onStart?.();
      audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
        onEnd?.();
      };
      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        fallbackWebSpeech(trimmed, onStart, onEnd);
      };
      audio.play().catch(() => {
        fallbackWebSpeech(trimmed, onStart, onEnd);
      });
    } catch {
      fallbackWebSpeech(trimmed, onStart, onEnd);
    }
  };

  // 1. Check client-side memory cache first for instant zero-latency playback
  if (clientAudioCache.has(cacheKey)) {
    playAudioElement(clientAudioCache.get(cacheKey)!);
    return;
  }

  // 2. If client is aware of quota limit cooldown, skip network and use local natural voice immediately
  if (Date.now() < clientRateLimitedUntil) {
    fallbackWebSpeech(trimmed, onStart, onEnd);
    return;
  }

  // 3. Fetch fluid voice from Gemini TTS server endpoint
  const controller = new AbortController();
  currentAbortController = controller;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, voice }),
      signal: controller.signal,
    });

    if (!res.ok) {
      fallbackWebSpeech(trimmed, onStart, onEnd);
      return;
    }

    const data = await res.json();
    if (data.rateLimited) {
      clientRateLimitedUntil = Date.now() + (data.retryAfter || 30) * 1000;
      fallbackWebSpeech(trimmed, onStart, onEnd);
      return;
    }

    if (data.audio) {
      clientAudioCache.set(cacheKey, data.audio);
      playAudioElement(data.audio);
      return;
    } else {
      fallbackWebSpeech(trimmed, onStart, onEnd);
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return;
    }
    fallbackWebSpeech(trimmed, onStart, onEnd);
  }
}

// Play a cheerful pop click
export function playPopSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // AudioContext might be blocked until user gesture
  }
}

// Play celebratory correct chime (C5 -> E5 -> G5 -> C6)
export function playCorrectSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const startTime = now + idx * 0.08;
      const duration = 0.25;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    });
  } catch {
    // ignore
  }
}

// Play gentle encouraging chime (Never harsh, warm and supportive)
export function playGentleEncourageSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [440, 523.25]; // A4 -> C5 warm gentle bell
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      const startTime = now + idx * 0.12;
      const duration = 0.35;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch {
    // ignore
  }
}

// Play Star sparkle sound
export function playStarCollectSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  } catch {
    // ignore
  }
}

// Play Fanfare for module completion
export function playFanfareSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const melody = [
      { freq: 523.25, duration: 0.12, delay: 0 },
      { freq: 659.25, duration: 0.12, delay: 0.12 },
      { freq: 783.99, duration: 0.14, delay: 0.24 },
      { freq: 1046.5, duration: 0.4, delay: 0.38 },
    ];

    const now = ctx.currentTime;
    melody.forEach(item => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.freq, now + item.delay);

      const startTime = now + item.delay;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + item.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + item.duration + 0.05);
    });
  } catch {
    // ignore
  }
}
