/**
 * Pembuat Paket Suara Offline — Kelas Kecil / Belajar Ceria
 * ------------------------------------------------------------------
 * Membuat semua kalimat aplikasi menjadi file MP3 kecil memakai Gemini TTS,
 * lalu menyimpannya ke public/voice/<Suara>/ beserta manifest.json.
 *
 * Pemakaian:
 *   npm run voice-pack                     # buat semua suara Mimi
 *   npm run voice-pack -- --rpm 10         # API key berbayar: lebih cepat
 *   npm run voice-pack -- --check          # cek berapa yang belum dibuat (tanpa API)
 *
 * Bisa dihentikan (Ctrl+C) dan dilanjutkan kapan saja: klip yang sudah ada dilewati.
 * Paket yang belum lengkap tetap bisa dipakai; kalimat yang belum ada memakai suara online.
 */

import { config as loadEnv } from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mp3Encoder } from '@breezystack/lamejs';
import { getAllVoicePhrases, VOICE } from '../src/data/voicePhrases';

loadEnv({ path: '.env.local' });
loadEnv();

// Harus sama dengan server.ts supaya gaya suaranya sama
const MODEL = 'gemini-3.1-flash-tts-preview';
const PROMPT = (text: string) => `Say cheerfully and warmly in Indonesian: ${text}`;
const SAMPLE_RATE = 24000;
const MP3_KBPS = 48;
const OUT_ROOT = path.join(process.cwd(), 'public', 'voice');

// ---------- argumen ----------
const args = process.argv.slice(2);
const arg = (name: string, fallback?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const voices = [VOICE];
const rpm = Math.max(1, Number(arg('rpm', '3')));
const checkOnly = args.includes('--check');

// ---------- util ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function clipFileName(voice: string, text: string) {
  const h = crypto.createHash('sha1').update(`${MODEL}|${voice}|${PROMPT(text)}`).digest('hex').slice(0, 16);
  return `${h}.mp3`;
}

/** Buang hening di awal & akhir (penyebab utama "telat" terdengar), sisakan sedikit napas. */
function trimSilence(pcm: Int16Array, threshold = 600, padMs = 40): Int16Array {
  const pad = Math.round((SAMPLE_RATE * padMs) / 1000);
  let start = 0;
  while (start < pcm.length && Math.abs(pcm[start]) < threshold) start++;
  let end = pcm.length - 1;
  while (end > start && Math.abs(pcm[end]) < threshold) end--;
  if (start >= end) return pcm;
  return pcm.subarray(Math.max(0, start - pad), Math.min(pcm.length, end + pad * 3));
}

function pcmToMp3(pcm: Int16Array): Buffer {
  const enc = new Mp3Encoder(1, SAMPLE_RATE, MP3_KBPS);
  const chunks: Uint8Array[] = [];
  const block = 1152;
  for (let i = 0; i < pcm.length; i += block) {
    const out = enc.encodeBuffer(pcm.subarray(i, i + block));
    if (out.length) chunks.push(new Uint8Array(out));
  }
  const tail = enc.flush();
  if (tail.length) chunks.push(new Uint8Array(tail));
  return Buffer.concat(chunks);
}

interface Manifest {
  version: number;
  voice: string;
  model: string;
  generatedAt: string;
  totalBytes: number;
  clips: Record<string, string>;
}

function readManifest(voice: string): Manifest {
  const p = path.join(OUT_ROOT, voice, 'manifest.json');
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      // rusak: buat ulang
    }
  }
  return { version: 1, voice, model: MODEL, generatedAt: '', totalBytes: 0, clips: {} };
}

function writeManifest(voice: string, m: Manifest, phrases: string[]) {
  const dir = path.join(OUT_ROOT, voice);
  // urutkan sesuai katalog supaya kalimat yang sering dipakai terunduh duluan
  const clips: Record<string, string> = {};
  let total = 0;
  for (const t of phrases) {
    const f = m.clips[t];
    if (f && fs.existsSync(path.join(dir, f))) {
      clips[t] = f;
      total += fs.statSync(path.join(dir, f)).size;
    }
  }
  const out: Manifest = { ...m, version: 1, generatedAt: new Date().toISOString(), totalBytes: total, clips };
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(out, null, 2));
  return out;
}

class QuotaExhausted extends Error {}

async function synthesize(ai: GoogleGenAI, voice: string, text: string): Promise<Int16Array> {
  let consecutive429 = 0;
  for (;;) {
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: [{ parts: [{ text: PROMPT(text) }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      });
      const b64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!b64) throw new Error('Gemini tidak mengembalikan audio');
      const buf = Buffer.from(b64, 'base64');
      return new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 2));
    } catch (err: any) {
      const msg = String(err?.message || err);
      // 402: saldo prabayar habis -> menunggu tidak ada gunanya
      if (err?.status === 402 || /credits are depleted|prepayment/i.test(msg)) {
        throw new QuotaExhausted(
          'Saldo kredit prabayar Gemini habis. Isi ulang di https://ai.studio/projects lalu jalankan lagi.'
        );
      }
      const is429 = err?.status === 429 || /429|RESOURCE_EXHAUSTED|quota/i.test(msg);
      if (!is429) throw err;
      consecutive429++;
      if (/per ?day|PerDay|daily/i.test(msg) || consecutive429 >= 6) {
        throw new QuotaExhausted(msg);
      }
      const m = msg.match(/retry in ([0-9.]+)s/i) || msg.match(/"retryDelay":\s*"(\d+)s"/);
      const waitS = m ? Math.ceil(parseFloat(m[1])) + 2 : 30 * consecutive429;
      process.stdout.write(`\n   ⏳ kuota per menit penuh, tunggu ${waitS} detik…`);
      await sleep(waitS * 1000);
    }
  }
}

async function main() {
  const phrases = getAllVoicePhrases();
  console.log(`📚 ${phrases.length} kalimat unik di katalog. Suara: ${voices.join(', ')}\n`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!checkOnly && (!apiKey || apiKey === 'MY_GEMINI_API_KEY')) {
    console.error('❌ GEMINI_API_KEY belum diisi. Tulis di file .env.local:\n   GEMINI_API_KEY="kunci-api-kamu"');
    process.exit(1);
  }
  const ai = checkOnly ? null : new GoogleGenAI({ apiKey: apiKey! });
  const minGapMs = Math.ceil(60000 / rpm);

  for (const voice of voices) {
    const dir = path.join(OUT_ROOT, voice);
    fs.mkdirSync(dir, { recursive: true });
    const manifest = readManifest(voice);

    // Klip yang file-nya sudah ada (dari run sebelumnya) langsung dipakai
    for (const t of phrases) {
      const f = clipFileName(voice, t);
      if (fs.existsSync(path.join(dir, f))) manifest.clips[t] = f;
    }
    const todo = phrases.filter((t) => !manifest.clips[t]);
    console.log(`🎙️  ${voice}: ${phrases.length - todo.length} sudah ada, ${todo.length} perlu dibuat`);

    if (checkOnly || todo.length === 0) {
      writeManifest(voice, manifest, phrases);
      continue;
    }
    const etaMin = Math.ceil((todo.length * minGapMs) / 60000);
    console.log(`   Perkiraan waktu ± ${etaMin} menit pada ${rpm} permintaan/menit. Boleh dihentikan & dilanjutkan.\n`);

    let lastStart = 0;
    for (let i = 0; i < todo.length; i++) {
      const text = todo[i];
      const wait = lastStart + minGapMs - Date.now();
      if (wait > 0) await sleep(wait);
      lastStart = Date.now();

      process.stdout.write(`   [${i + 1}/${todo.length}] ${text.slice(0, 60)}`);
      try {
        const pcm = trimSilence(await synthesize(ai!, voice, text));
        const mp3 = pcmToMp3(pcm);
        const file = clipFileName(voice, text);
        fs.writeFileSync(path.join(dir, file), mp3);
        manifest.clips[text] = file;
        writeManifest(voice, manifest, phrases); // simpan tiap klip: aman kalau dihentikan
        process.stdout.write(`  ✅ ${(mp3.length / 1024).toFixed(1)} KB\n`);
      } catch (err: any) {
        if (err instanceof QuotaExhausted) {
          writeManifest(voice, manifest, phrases);
          console.log('\n\n🛑 Kuota Gemini habis untuk sekarang. Jalankan lagi nanti, progres sudah tersimpan.');
          console.log(`   Alasan: ${String(err.message).slice(0, 300)}`);
          process.exit(0);
        }
        process.stdout.write(`  ⚠️  dilewati (${String(err?.message || err).slice(0, 80)})\n`);
      }
    }

    const final = writeManifest(voice, manifest, phrases);
    console.log(
      `\n✨ ${voice} selesai: ${Object.keys(final.clips).length}/${phrases.length} klip, ${(final.totalBytes / 1024 / 1024).toFixed(2)} MB\n`
    );
  }

  // Hapus file mp3 yatim (kalimat yang sudah tidak ada di katalog)
  for (const voice of voices) {
    const dir = path.join(OUT_ROOT, voice);
    if (!fs.existsSync(dir)) continue;
    const used = new Set(Object.values(readManifest(voice).clips));
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.mp3') && !used.has(f)) fs.unlinkSync(path.join(dir, f));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
