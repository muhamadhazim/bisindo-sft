# Implementasi A–Z eksperimental — 12 September 2026

Implementasi lokal sesuai rencana pengguna. Tidak ada retraining atau push.
Materi A–F, G–L, M–R, S–Z tersedia melalui `/learn`. URL C/L/O tetap berlaku.

## Perilaku yang tersedia

Amati karakter -> praktik -> diterima setelah stabil 400 ms -> perayaan Sinyal
sekitar 1,5 detik -> tombol Lanjut/Ulangi. Kamera dan sesi model tetap hidup saat
berpindah target. Release no-hand 250 ms dan cooldown 500 ms mencegah pose yang
terus ditahan menyelesaikan target selanjutnya. Ringkasan menghitung hanya huruf
yang diterima; membuka C tidak menganggap A/B selesai. Progress hanya di memori.
Reduced motion memakai kartu statis. Stop/tab tersembunyi/navigasi membersihkan
resource dan tidak memindahkan target otomatis. Mulai kamera kembali lewat tombol.

## Model dan batas keputusan

ONNX turunan mengekspos Softmax `[1,26]` tanpa ZipMap; bobot asli tetap sama.
Envelopes sama-mask, p99, pengali 1,8 dan threshold 0,5 direkonstruksi dari notebook.
Skor teratas seri, fitur invalid, tangan ambigu/kurang, mask tanpa referensi dan
jarak di luar envelope ditolak. Tidak ada persentase kebenaran gesture di UI.
Runtime `onnxruntime-web@1.29.0`, WASM satu thread, aset lokal, lazy saat latihan.
Loader memverifikasi checksum model/envelopes/metadata dan kontrak versi/schema/
provider/dimensi/label. Error menyediakan retry tanpa fallback tersembunyi.
Rollback pengembang: `NEXT_PUBLIC_RECOGNITION_ENGINE=clo-rf`, lalu build ulang;
hanya untuk kontrak C/L/O historis. Default tetap MLP A–Z.

## Bukti teknis

- 5.273 record manifest diverifikasi; 3.515 vektor cocok dengan extractor aplikasi.
- Pembagian usable: train 2.169, validation 664, test 682; hash/group tidak bocor.
  Signer/session tidak diketahui, sehingga bukan evaluasi signer-independent.
- Probabilitas ONNX asli dan turunan serta confusion matrix notebook direproduksi.
  Test: 367 label cocok, 100 label berbeda, 215 uncertain. Validation: 321/97/246.
- Browser WASM: seluruh 682 probabilitas/keputusan diuji, selisih absolut maksimum
  7,748603820800781e-7 (batas 1e-5), nol perbedaan keputusan. Pada satu run lokal:
  model load 1.257 ms, inference rata-rata 0,126 ms; tidak termasuk tracker atau HP.
- Replay foto berlisensi C/L/O dan dua-tangan D melalui MediaPipe VIDEO + ONNX
  memverifikasi perayaan, release, ulangi, perpindahan target dan cleanup stream.
- Uji perangkat kamera lokal: 640x480, pelacakan aktif, semua track berhenti saat
  keluar halaman. Tidak ada frame kamera yang direkam atau disimpan.
- Hasil check akhir dicatat di bagian status di bawah.

## Karakter dan sumber

26 pose orisinal Sinyal, 21 titik per tangan dan lima rantai jari, disimpan terpisah
dari renderer dan recognition. SVG dan 3D menggunakan pose/radius yang sama.
3D lazy pada halaman amati, putar terbatas/reset, demand rendering dan fallback
2D untuk WebGL/context loss. Halaman kamera tidak memuat renderer Three.js.

Rhio menjadi varian acuan; 26 foto Sanjaya dibandingkan secara internal. Source
ID/URL/SHA, lisensi, region yang belum diketahui, jumlah tangan yang direview,
sudut depan dan status foto dicatat di GestureReference. Foto orang tidak menjadi
contoh utama. Audit rinci: public/assets/signs/sinyal-v2/REVIEW.md.

SOURCE_VERIFIED hanya berarti dicocokkan dengan sumber foto, bukan validasi ahli.
Bentuk/finger contact dan kedalaman 3D tetap perkiraan; sumber kebenaran adalah
referensi berlisensi dan review manusia, bukan karakter. X menggunakan ekstraksi
crop sumber yang mempertahankan silang; S memiliki koreksi titik ibu jari yang
terlihat di foto. Bukti anotasi terpisah dan tidak mengubah input/model pengenal.
J/R memiliki unsur dinamis; Z belum pasti jenis geraknya. Ketiganya diberi
batasan POSE_SNAPSHOT yang terlihat: aplikasi menilai bentuk diam saja.

## Validasi yang masih harus dilakukan secara terpisah

Uji manusia langsung setiap huruf, berbagai pengguna/pencahayaan, near-miss dan
HP fisik belum dinyatakan lolos. Fitur 52 dimensi tidak menyimpan posisi relatif
antartangan; IMAGE/VIDEO dapat berbeda. Tidak ada klaim mastery, ketepatan bahasa,
validasi rangkaian gerak, atau performa HP berdasarkan replay foto/build.
Tidak ada akun, XP, persistence, backend frame, deployment, atau training baru.

## Reproduksi dan catatan keputusan

Model: scripts/export-alphabet.py, scripts/verify-alphabet-features.mjs,
scripts/prepare-onnx-assets.mjs; lingkungan Python tercatat di ml/alphabet-v2.
Pose: scripts/export-gesture-references.py, memerlukan backup sumber dan foto
Rhio yang dirujuk di `.tools/bisindo-dataset` untuk checksum; hasil poses/SVG
sudah disertakan, sehingga aplikasi tidak memerlukan dataset lokal pengguna.
Tests: npm run typecheck, npm run lint, npm run build, npm test (Node 24.21+).
Hardware smoke: npm run test:camera:local dengan server localhost:3000.

ADR-027 mencatat perluasan yang disetujui pengguna, runtime ONNX eksplisit,
karakter sumber dan sesi manual. PRD/DECISIONS/ARCHITECTURE/CONTRACTS/TASKS serta
IMPLEMENTATION_STATUS diperbarui lokal; `docs/` tetap diabaikan sesuai .gitignore.
Dokumen ini dan README module menjadi catatan yang dilacak Git. Notebook, ONNX
sumber dan raw backup pengguna dipertahankan; artefak lokal tidak di-commit.

## Status akhir verifikasi

TypeScript/type generation, ESLint dan production build lolos. Seluruh **102 tes
Playwright Chromium lolos** pada build akhir (1,4 menit). Layout 320/360/768/1440px,
zoom, keyboard, reduced motion, live regions, fallback aset/WebGL, model retry,
stream cleanup, sesi parsial, manual target/Continue/repeat/double click dan
isolasi renderer kamera tercakup. Foto replay dan uji kamera perangkat tetap
dipisahkan dari validasi gesture manusia/HP yang belum dilakukan. Screenshot
mobile/desktop, lembar 26 poster dan framing C 3D ditinjau lokal. Threshold tetap.
