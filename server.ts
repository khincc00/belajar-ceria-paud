import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import { VOICE } from './src/data/voicePhrases';

// Convert raw 16-bit mono PCM to WAV format
function pcm16ToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
  header.writeUInt16LE(1, 20); // audio format (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// In-memory cache for audio clips to provide instant fluid playback
const audioCache = new Map<string, string>();
let rateLimitedUntil = 0;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser for API routes
  app.use(express.json());

  // API: Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      cachedClipsCount: audioCache.size,
      rateLimited: Date.now() < rateLimitedUntil,
    });
  });

  // API: Gemini 3.1 Flash TTS Preview
  app.post('/api/tts', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required', fallback: true });
      }

      const trimmedText = text.trim();
      const selectedVoice = VOICE;
      const cacheKey = `${selectedVoice}:${trimmedText}`;

      // Fast-path 1: return cached high-quality audio
      if (audioCache.has(cacheKey)) {
        return res.json({
          audio: audioCache.get(cacheKey),
          cached: true,
          voice: selectedVoice,
        });
      }

      // Fast-path 2: if currently under free-tier RPM quota cooldown, signal graceful fallback immediately
      if (Date.now() < rateLimitedUntil) {
        const remainingSec = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
        return res.json({
          fallback: true,
          rateLimited: true,
          retryAfter: remainingSec,
        });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.json({
          fallback: true,
          error: 'GEMINI_API_KEY not configured',
        });
      }

      // Instruct the model to speak warmly, fluidly and enthusiastically for children
      const prompt = `Say cheerfully and warmly in Indonesian: ${trimmedText}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{
          parts: [{ text: prompt }],
        }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Pcm = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Pcm) {
        return res.json({
          fallback: true,
          error: 'No audio returned from Gemini TTS',
        });
      }

      const pcmBuffer = Buffer.from(base64Pcm, 'base64');
      const wavBuffer = pcm16ToWav(pcmBuffer, 24000, 1, 16);
      const audioDataUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

      // Cache for subsequent clicks
      audioCache.set(cacheKey, audioDataUrl);

      return res.json({
        audio: audioDataUrl,
        format: 'wav',
        voice: selectedVoice,
      });
    } catch (err: any) {
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('Quota exceeded');

      if (isRateLimit) {
        let retrySeconds = 30;
        try {
          const match = err?.message?.match(/retry in ([0-9.]+)s/i);
          if (match && match[1]) {
            retrySeconds = Math.ceil(parseFloat(match[1])) + 2;
          }
        } catch {
          // ignore parsing error
        }
        rateLimitedUntil = Date.now() + retrySeconds * 1000;
        console.warn(`[TTS] Gemini TTS free-tier quota reached (3 RPM). Cooldown for ${retrySeconds}s, utilizing natural fallback.`);
        return res.json({
          fallback: true,
          rateLimited: true,
          retryAfter: retrySeconds,
        });
      }

      console.warn('[TTS] Generation notice:', err?.message || err);
      return res.json({
        fallback: true,
        error: err?.message || 'TTS generation unavailable',
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
