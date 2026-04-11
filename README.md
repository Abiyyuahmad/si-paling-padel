# Padel Score Hub

PWA mobile-first untuk mengelola skor turnamen padel format Americano dan Mexicano.

Fitur utama:

- Generate pertandingan untuk `Americano` dan `Mexicano`
- Opsi partner `balanced`, `random`, dan `mix partner`
- Input skor detail per poin dengan tombol kiri dan kanan
- Klasemen live berdasarkan total poin, win, dan point differential
- Penyimpanan otomatis di `localStorage`
- Siap di-deploy sebagai static site ke GitHub Pages

## Stack

- React 19
- TypeScript
- Vite
- Web App Manifest + service worker manual

## Menjalankan lokal

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

## Deploy ke GitHub Pages

Project ini sudah memakai `base: './'` di Vite, jadi asset path aman untuk static hosting.

Workflow auto-deploy sudah tersedia di [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml). Setiap `push` ke branch `main`, GitHub Actions akan:

1. Install dependency dengan `npm ci`
2. Menjalankan `npm run build`
3. Upload folder `dist/`
4. Deploy ke GitHub Pages

Langkah aktivasi di GitHub:

1. Push repo ini ke GitHub.
2. Pastikan branch default Anda adalah `main`.
3. Buka `Settings > Pages`.
4. Pada bagian `Source`, pilih `GitHub Actions`.
5. Push perubahan ke `main` dan tunggu workflow selesai.

Jika nanti nama branch utama Anda bukan `main`, ubah trigger branch di workflow.

## Catatan format

- Americano `balanced` paling ideal untuk jumlah pemain kelipatan 4.
- Mode `mix` memerlukan jumlah pemain `male` dan `female` yang seimbang.
- Jika court lebih sedikit dari kebutuhan match serentak, generator akan membagi jadwal menjadi beberapa wave ronde.
