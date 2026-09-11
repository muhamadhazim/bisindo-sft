# AGENTS.md — Aturan Tertinggi untuk Codex

Dokumen ini adalah instruksi tertinggi untuk coding agent.

## 1. Source Precedence

Jika ada konflik:

`AGENTS.md > PRD.md > DECISIONS.md > ARCHITECTURE.md > CONTRACTS.md > domain docs > TASKS.md > code comments`

Jangan menyelesaikan konflik dengan asumsi diam-diam. Catat keputusan baru di `docs/DECISIONS.md`.

## 2. Scope Guardrail

Sebelum coding:

1. baca `docs/PRD.md`,
2. baca `docs/DECISIONS.md`,
3. baca `docs/ARCHITECTURE.md`,
4. baca dokumen domain terkait,
5. cek phase aktif di `docs/TASKS.md`.

Jangan menambah:

- chatbot,
- generative AI,
- social feed,
- marketplace,
- payment,
- continuous sign-language translator,

kecuali scope secara eksplisit diubah.

## 3. Product Guardrail

Produk fokus pada **learning & practice**, bukan translator universal.

Semua konten BISINDO yang mengatakan gesture "benar" harus memiliki:

- source,
- region/reference context bila diketahui,
- validation status.

Developer/Codex **dilarang mengarang gesture rule dari intuisi atau screenshot acak**.

## 4. Technology Guardrail

Baseline:

- Next.js 16 App Router,
- TypeScript strict,
- current patched Active LTS version,
- React 19,
- MediaPipe Tasks Vision.

Untuk Next.js 16:

- jangan menggunakan `next lint`,
- gunakan ESLint/Biome secara langsung,
- jika Supabase SSR membutuhkan request/session refresh boundary, gunakan `proxy.ts`, bukan deprecated `middleware.ts`.

## 5. Architecture Guardrail

Wajib:

- MediaPipe lifecycle terisolasi dari React presentation.
- Recognition engine terisolasi dari camera lifecycle.
- Coaching engine terpisah dari recognition engine.
- Game scoring terpisah dari model score.
- Supabase access melalui module khusus.
- Raw camera frame tidak dikirim ke backend.
- ML model browser versioned.
- Feature schema training/runtime harus identik.
- Detection array order tidak boleh dipakai untuk menentukan left/right hand.
- Gameplay timing dipusatkan dalam config.

Dilarang:

- hardcode gesture logic di page component,
- direct DB query tersebar di UI,
- service/secret key di browser,
- `any` tanpa alasan,
- satu component raksasa,
- softmax/probability ditampilkan sebagai "gesture accuracy".

## 6. Camera Guardrail

Wajib:

- `navigator.mediaDevices.getUserMedia`,
- secure context,
- `playsInline`,
- stop seluruh `MediaStreamTrack` saat unmount/route change,
- error handling untuk denied/not-found/not-readable,
- display mirror dipisahkan dari model coordinate.

Untuk overlay pada mirrored preview:
- ubah coordinate hanya saat rendering overlay,
- jangan mengubah canonical model feature hanya agar overlay terlihat benar.

## 7. Hand Canonicalization Guardrail

MediaPipe dapat mengembalikan multiple hand result.

Jangan:

```text
hands[0] = left
hands[1] = right
```

Canonicalize berdasarkan handedness result dan validate confidence.

Jika handedness ambigu:
- return `UNCERTAIN`,
- jangan swap secara diam-diam.

Setiap sign mendefinisikan `requiredHands`:
- `ONE`,
- `TWO`,
- atau validator-specific rule.

## 8. ML / Feature Parity Guardrail

Sebelum model browser diterima:

- feature schema ID sama dengan metadata model,
- landmark provider sama/compatible,
- landmark model asset/version dicatat,
- preprocessing sama,
- ordering sama,
- normalization sama,
- missing-hand policy sama.

Jangan train dengan legacy landmark pipeline lalu deploy dengan pipeline berbeda tanpa parity test.

Random Forest/scikit-learn **tidak** otomatis dapat dimuat dengan `tf.loadLayersModel`.

Browser model valid hanya jika:
- rule-based TypeScript, atau
- Keras/TF model berhasil dikonversi dan smoke-tested di browser, atau
- runtime lain dipilih secara eksplisit dan didokumentasikan.

## 9. Dataset Guardrail

Wajib:

- split sebelum augmentation,
- augmented derivative tetap pada split parent,
- signer/source group tidak bocor train → test,
- license dicatat.

Horizontal flip:
- **disabled by default**,
- hanya boleh jika validator memastikan tidak mengubah semantik/handedness target.

## 10. Recognition Guardrail

Model/engine harus dapat mengembalikan:

- `NO_HAND`,
- `TRACKING`,
- `UNCERTAIN`,
- `CORRECT`,
- `RETRY`.

Jangan memaksa top-1 class.

Stabilization sebaiknya time-based (`stableForMs`), bukan hanya N frames, agar konsisten antar perangkat.

## 11. Dynamic Gesture Guardrail

Dynamic recognition harus memakai timestamp.

Jangan menganggap 30 raw frames dari semua device memiliki durasi sama.

Jika model butuh fixed sequence:
- capture timestamped landmarks,
- resample/interpolate ke sequence length yang diharapkan model.

## 12. Coaching Guardrail

Jangan membandingkan user terhadap satu orang sebagai "pose sempurna".

Reference coaching idealnya berasal dari:
- beberapa validated samples,
- tolerance/range,
- median/robust statistics.

Numeric similarity **off by default** sampai calibrated.

Default UI:
- Benar,
- Hampir,
- Coba lagi,
- Tidak yakin.

## 13. 3D Guardrail

Three.js/R3F:
- optional,
- lazy-loaded,
- fallback 2D wajib,
- tidak boleh menurunkan camera usability.

3D asset harus:
- buatan sendiri, atau
- punya license compatible dan attribution.

3D visualization bukan sumber kebenaran linguistik.

## 14. Supabase Guardrail

Gunakan terminology current:

Browser:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server secret hanya jika benar-benar perlu:
- `SUPABASE_SECRET_KEY`

Jangan gunakan legacy **API keys** `anon`/`service_role` untuk implementasi baru kecuali project lama mengharuskan dan keputusan dicatat.

Catatan:
- Postgres roles bernama `anon` dan `authenticated` tetap valid untuk grants/RLS.
- Jangan menyamakan nama role database `anon` dengan legacy anon API key.

RLS:
- enable setiap exposed table,
- grants minimum,
- policies per operation,
- `to authenticated`,
- index user-owned filter column,
- test dengan `supabase test db`.

## 15. Priority

Urutan:

1. correctness,
2. content validity,
3. accessibility,
4. camera stability,
5. responsive behavior,
6. recognition quality,
7. error/fallback states,
8. persistence,
9. gameplay,
10. animation,
11. 3D polish.

## 16. Definition of Done

Task belum selesai sebelum:

- typecheck lolos,
- lint lolos,
- test relevan lolos,
- 360px tidak overflow horizontal,
- loading/error/empty state tersedia,
- camera cleanup benar bila task menyentuh camera,
- no secret leaked,
- feature schema compatible bila task menyentuh model,
- docs diperbarui jika contract/architecture berubah.

## 17. Reference Repository Policy

Boleh dipelajari:

- Spellhand,
- Silent-Vox,
- Talkee,
- Krisna realtime BISINDO,
- WL-BISINDO.

Sebelum reuse:
- cek license,
- jangan wholesale-copy,
- catat attribution,
- jangan menganggap metric repo lain berlaku untuk project ini.

Talkee tidak memiliki license yang teridentifikasi pada audit ini:
- research reference only,
- jangan copy code/model sampai ada izin/license jelas.

## 18. Workflow per Task

1. baca docs,
2. sebutkan assumption,
3. implement minimal change,
4. test,
5. cek mobile,
6. cek error path,
7. update docs bila contract berubah,
8. stop pada phase saat ini.

## 19. Git Checkpoints

Instruksi user (2026-09-11): commit perubahan secara bertahap agar riwayat
implementasi dapat ditelusuri.

- Buat commit setelah satu langkah logis selesai dan checks yang relevan lolos.
- Gunakan pesan commit yang menjelaskan perubahan konkret.
- Stage hanya file yang terkait dengan langkah tersebut.
- Hormati `.gitignore`; jangan memasukkan credential, dependency terpasang,
  build output, atau artefak lokal.
- Commit lokal tidak berarti melakukan push ke remote.
