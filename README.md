# İlaç ve Su Takip

İlaç hatırlatma, doz ve stok takibi, su içme takibi yapan mobil uygulama. Bitirme projesi.

- **Mobil:** React Native (Expo SDK 58, expo-router), yerel SQLite (expo-sqlite + Drizzle) — internetsiz tam çalışır.
- **Backend:** NestJS 12 + Prisma 7 + PostgreSQL 16 — kayıt/giriş (JWT + dönen refresh token), Swagger.
- **Ortak paket:** `@ilac/shared` — Zod şemaları ve test edilen iş mantığı (plan → doz saatleri, türetilmiş stok, kalan gün).

Tasarım: [docs/superpowers/specs/2026-11-18-ilac-su-takip-design.md](docs/superpowers/specs/2026-11-18-ilac-su-takip-design.md)

## Mimari

```
apps/mobile ──(Expo, SQLite, offline)──┐
                                        ├── packages/shared (Zod + hesaplama)
apps/api ──(NestJS, Prisma)─────────────┘
   └── PostgreSQL (docker compose)
```

## Kurulum

Gerekenler: Node 22+, pnpm 10, Docker Desktop, Android telefonda **Expo Go**.

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
pnpm --filter @ilac/shared build
pnpm --filter api exec prisma migrate deploy
pnpm --filter api start:dev
```

API: http://localhost:3000 · Swagger: http://localhost:3000/docs · Sağlık: http://localhost:3000/health

Mobil (telefon ve bilgisayar aynı Wi‑Fi ağında olmalı):

```bash
cp apps/mobile/.env.example apps/mobile/.env   # EXPO_PUBLIC_API_URL'yi bilgisayarın yerel IP'si yap
pnpm --filter mobile start
```

Çıkan QR kodu Expo Go ile okut. Ayarlar → "Demo verisi yükle" (yalnızca geliştirme modunda) örnek ilaçları ekler.

## Testler

```bash
pnpm test                         # shared (Vitest) + api birim + mobil (Jest)
pnpm --filter api test:e2e        # API uçtan uca (Postgres çalışıyor olmalı; ilac_test veritabanını kullanır)
pnpm typecheck
```

Demo akışı (Maestro, development build gerekir):

```bash
cd apps/mobile && npx expo run:android
maestro test apps/mobile/.maestro/demo-flow.yaml
```

## Durum (30.11.2026 ön kontrol)

Hazır: ilaç ekleme/düzenleme/arşivleme, 3 plan tipi, Bugün ekranında doz işaretleme, türetilmiş stok ve kalan gün, düşük stok uyarısı, su takibi ve ayarları, geçmiş, onboarding, kayıt/giriş.

Sıradaki (M2): bildirimler (ilaç, su, reçete yenileme), kaçırılan doz tespiti, senkronizasyon.

> Bu uygulama tıbbi tavsiye vermez.
