# prokom-kelompok-G

Aplikasi web rekomendasi tempat makan di area Tembalang, Semarang. Fitur utama:

- Filter budget dengan slider (Rp 5.000 – Rp 50.000)
- Filter kategori dengan chip tombol: Semua, Warung, Kantin, Angkringan, Kafe
- Urutkan berdasarkan terdekat, termurah, rating tertinggi
- Search bar untuk mencari nama tempat makan atau nama menu
- Daftar tempat makan dengan nama, kategori, rentang harga, jarak dari UNDIP, rating, dan jam buka
- Peta interaktif dengan marker tempat makan

## Cara menjalankan

Pastikan Node.js dan npm sudah terpasang.

1. Install dependensi:

```bash
npm install
```

2. Jalankan development server:

```bash
npm run dev
```

3. Buka aplikasi di browser:

```text
http://localhost:5173
```

4. Setelah server berjalan, Anda dapat menggunakan fitur filter, pencarian, dan sort di panel samping.

## Struktur penting

- `src/App.jsx` — logika filter, sort, search, dan tampilan daftar tempat makan
- `src/components/MapView.jsx` — peta Leaflet dan marker tempat makan
- `src/index.css` — gaya tampilan aplikasi
- `data/restaurants.json` — data dummy minimal 8 tempat makan

## Catatan

- Peta menggunakan Leaflet + OpenStreetMap.
- Jika ingin menambahkan data baru, edit `data/restaurants.json` atau tambah melalui peta.
- `src/firebase.js` hanya diperlukan jika Anda ingin menambahkan integrasi Firebase.

