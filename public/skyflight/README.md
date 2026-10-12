# Sky Flight Challenge

Game pesawat 3D di browser. Terbangkan pesawat oranye melewati 10 ring kuning secepat mungkin. Bisa dimainkan dengan keyboard atau micro:bit V2 lewat kabel USB.

Catatan: **Python tidak diperlukan.** Node.js juga tidak diperlukan.

## Yang kamu butuhkan
- VS Code + ekstensi **Live Server**
- Browser Chrome atau Edge (Brave juga bisa, lihat Masalah umum)
- micro:bit V2 dan kabel USB data (opsional)

## Cara menjalankan
1. Ekstrak file zip.
2. Buka folder `sky-flight-challenge` di VS Code (File → Open Folder).
3. Pasang ekstensi "Live Server" jika belum ada (menu Extensions, cari "Live Server").
4. Klik kanan `index.html` → **Open with Live Server**.
5. Game terbuka di browser. Pakai Chrome atau Edge.

## Menyiapkan micro:bit
1. Buka https://makecode.microbit.org dan buat proyek baru.
2. Pilih mode **JavaScript** di bagian atas.
3. Hapus isi lama, lalu tempel seluruh isi file `microbit/main.ts`.
4. Klik **Download**, lalu seret file `.hex` ke drive **MICROBIT**.
5. Tutup serial console MakeCode (kalau terbuka), karena port hanya bisa dipakai satu aplikasi.
6. Di game, klik **Sambung micro:bit** dan pilih port micro:bit.
7. Klik **Mulai Terbang**. Pegang micro:bit datar selama hitung mundur 3-2-1.

### Cara memegang
Kotak 25 LED dan tombol A/B menghadap **atas**, kabel USB mengarah ke **depan** (menjauhi badan).
- Miring ke kanan → belok kanan
- Angkat ujung USB → naik, turunkan → turun

## Kontrol keyboard
- ← / → atau A / D: belok
- ↑ atau W: naik, ↓ atau S: turun
- P atau Esc: jeda, R: ulang, M: suara, C: kalibrasi, Enter/Spasi: mulai

## Mode offline (opsional)
File `libs/three.module.js` sudah disertakan, jadi game jalan tanpa internet. Kalau file itu hilang, game otomatis mengambilnya dari internet. Untuk mengembalikannya: buka https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js di browser, tekan Ctrl+S, simpan sebagai `three.module.js` di folder `libs/` (pastikan bukan `.txt`).

## Masalah umum
- **Layar kosong atau pesan "Three.js gagal"**: buka lewat Live Server (jangan klik dua kali file-nya), cek internet, atau pakai mode offline di atas.
- **Pesawat bergetar**: micro:bit kemungkinan terbalik (tertelungkup). Balik agar LED menghadap atas.
- **Arah terbalik**: centang/hapus centang "Balik kiri/kanan" atau "Balik naik/turun" di menu. Pengaturan disimpan otomatis.
- **Port tidak muncul**: pakai kabel data (bukan kabel charger saja), tutup MakeCode atau aplikasi lain yang memakai port.
- **Brave**: aktifkan dulu `brave://flags/#brave-web-serial-api`, lalu mulai ulang Brave.
- **Tanda merah di main.ts**: normal di VS Code, karena library MakeCode tidak dikenal. Abaikan saja.
- **Sambungan micro:bit hilang**: Live Server me-refresh halaman setiap kali file disimpan, jadi klik Sambung micro:bit lagi.
- **Uji tanpa micro:bit**: buka console browser (F12) dan ketik `microbit.feed("25,0")`. Bar "Tes arah" akan bergerak sesaat (arah akhirnya mengikuti pengaturan balik).
