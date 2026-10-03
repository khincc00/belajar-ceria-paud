<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1a579e6f-496d-4cda-8d70-1ae721f393df

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Paket Suara Offline (tanpa delay)

Supaya suara langsung terdengar saat disentuh, semua kalimat dibuat sekali menjadi
file MP3 kecil di `public/voice/Puck/`. Aplikasi hanya memakai satu suara (Mimi). Saat aplikasi dibuka, paket ini diunduh
sekali (ada layar progres), disimpan di browser, lalu diputar langsung dari memori.
Kunjungan berikutnya tidak perlu mengunduh lagi dan tetap jalan tanpa internet.

**Membuat paket suara** (sekali saja, butuh `GEMINI_API_KEY` di `.env.local`):

```bash
npm install
npm run voice-pack:check          # lihat berapa klip yang belum dibuat
npm run voice-pack                # buat semua suara Mimi (Gemini "Puck")
npm run voice-pack -- --rpm 10    # API key berbayar: lebih cepat
```

- Bisa dihentikan (Ctrl+C) dan dijalankan lagi kapan saja; klip yang sudah ada dilewati.
- Kalimat yang otomatis diucapkan dibuat duluan, jadi paket yang belum lengkap tetap berguna.
  Kalimat yang belum ada di paket otomatis memakai suara online seperti sebelumnya.
- Setelah selesai, ikutkan folder `public/voice/` saat upload/deploy.

**Menambah atau mengubah kalimat:** tulis di `src/data/voicePhrases.ts` (atau ubah
`audioText` di `src/data/learningData.ts`), lalu jalankan `npm run voice-pack` lagi.
Hanya kalimat baru yang dibuat; file lama yang tidak terpakai dihapus otomatis.
Saat `npm run dev`, konsol browser memberi peringatan jika ada kalimat yang belum masuk paket.
