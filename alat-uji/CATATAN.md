# Catatan serah terima: cara kerja repo SUGIMATION

Catatan ini untuk Claude di sesi berikutnya. Pengguna (pemula, bahasa Indonesia) membuat versi baru di chat Claude biasa, lalu mengirim file HTML ke sini. Tugas kita: gabungkan, uji, simpan ke GitHub lewat pull request, lalu kirim pemanggilnya.

## Isi repo
- `cuan-iklan.html`, `hiburan.html`, `edukasi.html`, `kreator.html`, `serba-bisa.html`, `uji-gambar.html`: aplikasi versi **gabungan** (fitur pengguna + semua perbaikan kita). Selalu yang terbaru di `main`.
- Sejak V3.0 (12 Nov 2026) nama aplikasi menjadi **Sugi Studio AI**. Kreator dibangun pengguna dari Edukasi V3.0; Serba Bisa dibangun dari Hiburan V3.0 (tanpa kartu tema: landing berisi ide bebas + `#landing-examples`, mulai lewat `startFromExample(i)`).
- `pemanggil-*.html`: pemanggil Gemini Canvas V2. Mengambil aplikasi dari `raw.githubusercontent.com/elhabsyihauto-ai/Sugimation/main/<file>.html`. TIDAK memakai `document.write`/`document.open` (membuat Canvas berkedip). Isi aplikasi disisipkan (gaya → isi body → script berurutan), lalu `window.onload` dipanggil manual, dengan pengaman supaya hanya berjalan sekali. Pemanggil baru = salin pemanggil lain, ganti judul dan nama file.
- `alat-uji/dasar/*.html`: **versi ASLI pengguna yang terakhir** (sebelum digabung) untuk setiap aplikasi. Dipakai sebagai dasar penggabungan 3 arah.
- `alat-uji/*.js`: skrip uji Playwright (lihat bawah).

## Kebiasaan pengguna yang penting
- Pengguna hampir selalu membuat versi baru dari **salinan aslinya sendiri**, bukan dari file gabungan yang kita kirim. Akibatnya, tanpa penggabungan, perbaikan kita akan hilang.
- Setiap selesai: kirim file gabungan (`SendUserFile`) sebagai dasar versi berikutnya, dan beri langkah Merge yang sederhana.
- Commit/PR dalam bahasa Indonesia; PR menjelaskan isi, penggabungan, perbaikan, dan hasil uji (jujur: diuji dengan jawaban AI tiruan, belum di Canvas sungguhan).

## Alur kerja: versi baru aplikasi yang sudah ada
1. Kenali file dari `<title>` dan komentar di baris 2, bukan dari nama file.
2. Cek dasarnya: apakah memuat penanda perbaikan kita (misalnya `staleWarnHtml`, `SAME_RE`, `TELL_START`, `danceOk`, `initHistory(); // riwayat dimuat dulu`). Jika tidak ada, versi itu dibuat dari salinan asli pengguna.
3. Gabung 3 arah:
   `git merge-file -p main.html alat-uji/dasar/<app>.html baru.html > gabungan.html`
   (main.html = `git show origin/main:<app>.html`). Dasar = versi asli pengguna yang menjadi induk versi baru (biasanya `alat-uji/dasar/<app>.html`; jika pengguna melompati versi, cari induk yang tepat).
4. Bentrokan biasanya hanya di baris catatan perubahan (baris 2): pakai baris milik pengguna, lalu sisipkan kembali semua catatan "Ditambah: ..." kita di versi yang sesuai.
5. Periksa: jumlah baris beda `gabungan vs baru` harus sama dengan `main vs dasar` (ditambah perbaikan baru, jika ada).
6. `node --check` pada isi `<script>`, lalu ESLint `no-undef` (`alat-uji/eslintrc.json`).
7. Setelah PR di-merge, perbarui `alat-uji/dasar/<app>.html` dengan versi asli pengguna yang baru (supaya penggabungan berikutnya benar).

## Alur kerja: aplikasi BARU yang dibangun dari aplikasi lain
- Cara tercepat (dipakai untuk Kreator dan Serba Bisa V3.0): gabung 3 arah dengan versi ASLI induknya sebagai dasar: `git merge-file -p induk-gabungan.html induk-asli.html baru.html`. Bentrokan biasanya hanya baris 2. Lalu bandingkan baris beda `baru vs gabungan` dengan `induk-asli vs induk-gabungan` (harus sama persis selain baris 2).
- Pasang perbaikan dengan patch bagian demi bagian: `diff -u alat-uji/dasar/hiburan.html hiburan.html` (atau aplikasi induknya), lalu `git apply -C1` per bagian.
- **Buang bagian khusus aplikasi induk** yang fungsinya tidak ada (contoh dari Cuan Iklan V2.1: `isStandUp`, `phaseBibleText`, `phaseTimingText`, `phaseMemoryText` menimbulkan ReferenceError). Wajib jalankan ESLint `no-undef` setelahnya.
- Cek label Kode Proyek: `app:` di `makeProjectCode` harus sama dengan yang dicek `importProjectText` (Cuan Iklan V2.1 pernah salah: `sugimation-cuan` vs `sugimation-cuan-iklan`, sehingga kode selalu ditolak).
- Cek semua isian "tulis sendiri" memakai `isInputBlocked` (filter 18+). Hiburan V2.8 pernah lupa di Jenis Hantu.

## Perbaikan yang sudah ada di main (jangan sampai hilang)
- Buat Ulang berantai: kamera (`cam`), gambar akhir (`se-`), Timing Plan (Komedi), Bible/Silabus (Drama/Seri) ikut dibuat ulang; peringatan bagian lama (`staleParts`, `staleWarnHtml`, `STALE_NAMES`).
- Kartu Lanjutkan Proyek: `initHistory()` sebelum `renderLandingThemes()`, dan `renderResumeCard()` setiap `showView('landing')`.
- Cek otomatis tanpa peringatan palsu: "premium" dari gaya aplikasi (`APP_STYLE_PHRASES`, Cuan Iklan); `HAIR_RE` hanya kata sifat utuh tanpa koma; kalimat penyangkalan sadis dan "luka lama/hati/batin" (`noAvoid`); putaran tari/penonton stand up (Hiburan); pemisah kalimat setelah tanda kutip (`positiveSentences`); kartu "same as" diisi dari scene sebelumnya (`SAME_RE`); cara bicara hanya membaca storyboard; Coverage "hanya diceritakan" hanya jika baris dimulai dengan orang bercerita (`TELL_START`).
- Cuan Iklan: catatan foto produk tanpa kurung ganda.
- Cuan Iklan V3.0: cek Blocking Map memanggil `isHororVideo()` dengan penjaga `typeof` (fungsi itu tidak ada di Cuan Iklan; tanpa penjaga pemeriksaan otomatis berhenti dengan ReferenceError).
- Uji Gambar: pesan gagal Character Sheet tidak ditimpa `updateButtons()`.

## Status peringatan palsu dari hasil Canvas nyata Hiburan V2.8
Sejak V3.0 pengguna sendiri sudah menangani nomor 1, 2, 4, 7 (H60-H62, terbukti dengan `cek-tertunda.js`) dan nomor 3 (suara latar dasar, belum diuji khusus). Nomor 6 diselesaikan dengan meringkas blok tetap prompt (H63), bukan menaikkan batas; pantau di Canvas. **Nomor 5 ("invisible crowd") masih ditandai di V3.0.**
Daftar asli:
Ditemukan di hasil video horor lift (foto sendiri, gaya realistis, tanpa ucapan). Berlaku juga untuk Edukasi dan Cuan Iklan (kode pemeriksaan sama). Belum diperbaiki:
1. **Foto sendiri - rambut/fiktif** salah sasaran: rambut dan kata "fictional adult woman" milik hantu/tokoh lain dihitung sebagai milik pemakai foto. Usul: periksa per kalimat yang menyebut "reference photo" atau nama tokoh foto; Character Sheet dipotong per "Character Sheet N" dan hanya yang merujuk foto yang dicek; "fictional" hanya ditandai jika dalam ~40 huruf menyebut pemakai foto.
2. **Istilah studio**: "recessed LED panel" lampu plafon lift dianggap alat studio. Usul: abaikan "led panel" yang didahului ceiling/recessed/overhead atau diikuti "in the ceiling".
3. **Suara latar berubah**: alarm/pintu yang memang kejadian cerita dianggap ambience berubah. Usul: lewati jika kata ambience baru muncul di baris storyboard scene itu (tanpa baris Card).
4. **Blocking Map satu tokoh**: di Horor, peta posisi tokoh + hantu dianggap salah. Usul: lewati untuk Horor jika menyebut entity/reflection/ghost.
5. **Titik lemah AI "crowd"**: "invisible crowd" (kiasan) ditandai. Usul: abaikan invisible/unseen/imaginary crowd.
6. **Panjang prompt 520 kata**: semua scene realistis 555-597 kata. Aturan wajib aplikasi untuk gaya realistis + foto sendiri sudah sekitar 580 kata. Usul: batas 650 untuk gaya realistis.
7. **Kesalahan nyata yang TIDAK tertangkap**: video "Tanpa ucapan" tetapi Scene 1 berisi ucapan dengan lip-sync. Usul cek baru: jika `isNoSpeech()` dan prompt (kalimat positif) berisi lip-sync atau says/mutters/whispers + kutipan, tandai.
Juga teramati: Teks Layar menambah teks di Scene 2 dan 4 yang tidak ada di naskah (spoiler twist).

## Skrip uji (`alat-uji/`)
Jalankan dari folder kerja sementara (bukan dari repo). Chromium + Playwright sudah terpasang (`require('playwright')`). Semua memakai jawaban Gemini tiruan (route Playwright), jadi yang diuji adalah alur dan logika, bukan mutu teks AI.
- **`uji-v3.js`: uji alur untuk V3.0 ke atas (semua aplikasi).** Skrip lama `hiburan-test.js`/`edukasi-test.js`/`flows.js` hanya cocok untuk wizard V2.x (V3.0 menambah Pemeran, Lokasi, jalur Cepat/Atur sendiri, dan menghapus Format Produksi). `node uji-v3.js file:///home/user/Sugimation/<app>.html` menjalankan cabang pertama setiap tema (atau contoh Serba Bisa); `JALUR=atur` untuk jalur Atur sendiri; jalankan juga lewat `pemanggil-<app>.html`.
- `cek-tertunda.js`: cek peringatan palsu yang tertunda (lampu panel lift, invisible crowd, panjang prompt realistis, tanpa ucapan tapi lip-sync).
- `kode.js`, `resume.js`, `gore.js`, `wave1.js`, `cards.js`, `wave4.js` kini menerima path aplikasi sebagai argumen dan juga bisa dipakai untuk V3.0. Bandingkan hasil versi asli pengguna dengan versi gabungan: perbedaannya harus berupa peringatan palsu yang hilang.
- `hiburan-test.js` / `edukasi-test.js`: 9 tema dari pilih tema sampai hasil, fitur khusus (Horor hantu, lagu, Komedi Timing Plan, Drama/Seri episode, Daftar Cek Fakta), Buat Ulang berantai, simpan/buka proyek. `FILE=file:///home/user/Sugimation/pemanggil-<app>.html node ...` untuk lewat pemanggil (isi aplikasi untuk pemanggil dibaca langsung dari file di repo).
- `flows.js`, `v15.js`, `v16.js`, `autocheck.js`: Cuan Iklan. `flows.js` dan `v15.js` membaca `dl.html` di folder yang sama: salin `cuan-iklan.html` ke `dl.html` dulu. Tiga kegagalan `flows.js` di V2.1 adalah artefak skrip lama (lihat PR #11).
- `kode.js`, `resume.js`, `cards.js`, `wave1.js`, `wave4.js`, `gore.js`: pemeriksaan engine bersama (Kode Proyek, kartu Lanjutkan Proyek, Kartu Kontinuitas + cara bicara, cek V2.4, Gelombang 4, sadis). Banyak yang menerima path aplikasi sebagai argumen; sebagian berisi path `hiburan.html` tetap: ganti dengan `sed` untuk aplikasi lain.
- `uji-gambar-test.js`: Uji Gambar (mode normal, hanya Imagen, tanpa model, foto ditolak).
- `eslintrc.json`: `npm i eslint@8.57.0` lalu `npx eslint --no-eslintrc -c eslintrc.json app.js` (isi `<script>` diekstrak dengan `sed -n '/<script>/,/<\/script>/p'`).

## Jebakan uji yang pernah terjadi (bukan bug aplikasi)
- V3.0: tombol "Pro — Atur sendiri durasi per scene" juga cocok dengan kata "Atur sendiri": pilih jalur hanya di halaman "Mau Atur Sedetail Apa?".
- V3.0: tombol berubah setelah setiap klik (dirender ulang): cari tombol lagi berdasarkan teks, jangan simpan indeks.
- ESLint Cuan Iklan V3.0 menandai `isSongMode`/`isHororVideo` (fungsi khusus Hiburan); keduanya sudah dijaga `typeof ... === "function"`, jadi aman.
- `hasText: 'Lanjut'` juga cocok dengan "me**lanjut**kan": pakai `/^\s*Lanjut\s*$/`.
- `innerText` mengikuti CSS `uppercase` ("LANJUTKAN PROYEK"): pakai regex `i`.
- Sejak V2.7/V2.0 jendela "Simpan proyek ini?" muncul otomatis ~1 detik setelah hasil jadi dan menutupi tombol: tutup dengan `closeManualCopy()`.
- Horor punya halaman "Pilih Jenis Hantu" (`pickHantu`) sebelum ide.
- `closeModal` menambah `hidden` setelah 200 ms: jangan buka pesan baru tepat setelah menutup.
- `CHANGE_RE` sengaja melewati cek cahaya/posisi jika scene menyebut perubahan ("walks in", "turns off"): naskah contoh harus netral.
- Pemeriksaan otomatis baru wajar menandai naskah tiruan yang tidak punya `Card:`, Coverage, atau Callback: saring sesuai yang sedang diuji.

## Sugi Studio Satu Pintu (sejak 13 Nov 2026)
- `pemanggil-satu-pintu.html` + folder `satu-pintu/` (`sugi-core.js` dan `seri-*.js`) adalah **hasil rakitan otomatis** dari kelima aplikasi di repo ini. Perakitnya ada di repo dapur (`elhabsyihauto-ai/sugi-studio-dapur`, folder `satu-pintu/`). Jangan edit file di `satu-pintu/` secara langsung.
- Setiap kali salah satu dari kelima aplikasi berubah di `main`, jalankan ulang `python3 satu-pintu/rakit.py --cabang main` dari repo dapur, lalu commit hasilnya di sini.
- Kelima aplikasi dan pemanggil lamanya tetap dipakai member seperti biasa.
