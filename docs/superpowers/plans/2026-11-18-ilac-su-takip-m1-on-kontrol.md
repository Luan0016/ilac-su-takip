# İlaç ve Su Takip — M0+M1 (Ön Kontrol) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 30.11.2026 ön kontrolünde canlı gösterilecek sürüm: tüm ekranların arayüzü, offline ilaç/plan yönetimi, Bugün ekranında doz işaretleme, türetilmiş stok + kalan gün, su kaydı + hedef ilerlemesi, backend'de kayıt/giriş.

**Architecture:** pnpm monorepo. `packages/shared` saf TypeScript (Zod şemaları + tipler + hesaplama fonksiyonları), CommonJS'e derlenir ve hem mobil hem API tarafından kullanılır. `apps/mobile` Expo + expo-router + expo-sqlite/Drizzle ile tamamen offline çalışır. `apps/api` NestJS + Prisma + PostgreSQL; bu aşamada yalnız health + auth.

**Tech Stack:** Node 22 LTS, pnpm 10, TypeScript (strict), Zod, Vitest (shared), Expo SDK (create-expo-app@latest ile gelen kararlı sürüm), expo-router, expo-sqlite, drizzle-orm + drizzle-kit, react-hook-form, zustand, i18next + react-i18next + expo-localization, react-native-svg, jest-expo + @testing-library/react-native, Maestro; NestJS 11, Prisma, PostgreSQL 16, @nestjs/jwt, @nestjs/throttler, @nestjs/swagger, argon2, nestjs-zod, Jest + Supertest, Docker Compose, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-18-ilac-su-takip-design.md`

**Kapsam dışı (M2/M3 planlarında):** bildirimler, kaçırıldı tespiti, reçete yenileme bildirimi, sync, istatistik uçları, hesap silme/dışa aktarma, İngilizce çeviri, deploy.

## Global Constraints

- Proje kökü **kendi git deposudur** (`git init` Task 1'de). Üst dizindeki bir depoya commit atılmaz.
- `.npmrc`: `node-linker=hoisted` (React Native/Metro pnpm symlink'leriyle çalışmaz).
- TypeScript `strict: true` her pakette.
- Tüm kimlikler istemcide üretilen **UUID v7** (`uuid` paketi `v7()`).
- Tarih alanları: gün = `YYYY-MM-DD` metin; an = ISO 8601 UTC metin (`new Date().toISOString()`).
- İlaç saatleri duvar saati `HH:mm`, cihazın yerel saat diliminde yorumlanır.
- Haftanın günleri ISO: 1 = Pazartesi … 7 = Pazar.
- `doseAmount` = her alımda stoktan düşen miktar; `doseUnit` stok birimiyle aynıdır.
- Stok türetilir: `stockQuantity − Σ doseAmount (status='taken' ve takenAt > stockSetAt)`, en az 0.
- DoseLog benzersiz anahtarı: (`medicationId`, `scheduledAt`).
- Varsayılanlar: `refillThresholdDays = 7`, su hedefi 2000 ml, uyanma 08:00, uyku 23:00, aralık 90 dk, bardaklar [200, 300, 500].
- Hedef/test platformu Android; iOS kısıtlarına aykırı kod yazılmaz ama iOS'ta test edilmez.
- Arayüz metinleri i18next üzerinden (`tr.json`); bileşenlerde sabit Türkçe metin yok.
- "Bu uygulama tıbbi tavsiye vermez." beyanı Ayarlar'da görünür.
- API: access token 15 dk, refresh token 30 gün, rotasyonlu; şifre en az 8 karakter; e-posta küçük harfe çevrilir; kayıtta KVKK açık rızası zorunlu.

## Review Focus

1. **Belirli günler planında Pazar günü** — JS `getDay()` Pazar'ı 0 verir; ISO 7 seçilen Pazar dozu Pazar günü Bugün'de görünmeli. → Task 2 testi `weekdays_sunday_iso7`.
2. **Gece yarısını geçen "X saatte bir" planı** — 08:00 + 8 saat: 08, 16 bugün; 00:00 ertesi günün listesinde görünmeli, bugünün değil. → Task 2 testi `interval_crosses_midnight`.
3. **Başlamamış / bitmiş ilaç** — `startDate` gelecekte veya `endDate` geçmişte ise Bugün'de doz çıkmamalı; `endDate` günü dahil. → Task 2 testi `respects_start_and_end_date`.
4. **Kutu yenileme sonrası eski dozlar** — stok güncellenmeden önce alınan dozlar yeni stoktan düşmemeli; atlanan/ertelenen dozlar hiç düşmemeli; stok negatife inmemeli. → Task 3 testleri.
5. **"Aldım"a iki kez basma / geri alma** — aynı doz için tek kayıt kalmalı, stok bir kez düşmeli; geri alınca stok geri gelmeli. → Task 9 repo upsert + telefon kontrol adımı.

---

## Dosya yapısı

```
/
├─ package.json, pnpm-workspace.yaml, .npmrc, tsconfig.base.json, .gitignore, README.md
├─ docker-compose.yml                    postgres:16 (dev + test DB)
├─ .github/workflows/ci.yml
├─ packages/shared/
│  ├─ package.json (name @ilac/shared, main dist/index.js), tsconfig.json, vitest.config.ts
│  └─ src/
│     ├─ index.ts           yeniden dışa aktarım
│     ├─ schemas.ts         Zod şemaları + çıkarılan tipler
│     ├─ occurrences.ts     plan → doz anları
│     ├─ stock.ts           türetilmiş stok, günlük ortalama, kalan gün, düşük stok
│     ├─ today.ts           günün doz listesi, günün su toplamı
│     └─ *.test.ts
├─ apps/api/
│  ├─ prisma/schema.prisma
│  ├─ src/main.ts, app.module.ts, health.controller.ts
│  ├─ src/prisma/prisma.service.ts
│  ├─ src/auth/{auth.module,auth.controller,auth.service,jwt.guard,current-user.decorator}.ts
│  ├─ src/me/me.controller.ts
│  └─ test/{health,auth}.e2e-spec.ts
└─ apps/mobile/
   ├─ app/_layout.tsx, onboarding.tsx
   ├─ app/(tabs)/_layout.tsx, index.tsx, water.tsx, history.tsx, settings.tsx
   ├─ app/(tabs)/medications/{index,[id],edit}.tsx
   ├─ app/auth/{login,register}.tsx
   ├─ drizzle/ (drizzle-kit çıktısı), drizzle.config.ts, metro.config.js
   ├─ src/db/{schema,client,seed-demo}.ts, src/db/repo/{medications,doses,water}.ts
   ├─ src/components/{MedicationForm,DoseCard,WaterRing,CupButtons,LowStockBanner}.tsx
   ├─ src/api/client.ts, src/store/session.ts
   ├─ src/i18n/{index.ts,tr.json}
   ├─ __tests__/*.test.ts(x)
   └─ .maestro/demo-flow.yaml
```

---

### Task 1: Monorepo iskeleti + shared şemalar + CI

**Files:**
- Create: kök dosyalar, `packages/shared/{package.json,tsconfig.json,vitest.config.ts}`, `packages/shared/src/{index,schemas}.ts`, `packages/shared/src/schemas.test.ts`, `.github/workflows/ci.yml`

**Interfaces:**
- Produces (`@ilac/shared`):
  - `DoseStatus = 'taken' | 'skipped' | 'snoozed' | 'missed'`
  - `MedicationFormKind = 'tablet' | 'capsule' | 'syrup' | 'drops' | 'injection' | 'cream' | 'other'`
  - `medicationInputSchema` → `MedicationInput { name: string; form: MedicationFormKind; doseAmount: number; doseUnit: string; strength: string | null; color: string; notes: string | null; startDate: string; endDate: string | null; stockQuantity: number; refillThresholdDays: number }`
  - `Medication = MedicationInput & { id: string; stockSetAt: string; archivedAt: string | null }`
  - `scheduleInputSchema` → `ScheduleInput { type: 'daily' | 'weekdays' | 'interval'; times: string[]; weekdays: number[]; intervalHours: number | null; anchorTime: string | null }`
  - `Schedule = ScheduleInput & { id: string; medicationId: string }`
  - `DoseLog { id: string; medicationId: string; scheduledAt: string; status: DoseStatus; takenAt: string | null; snoozedUntil: string | null }`
  - `WaterLog { id: string; amountMl: number; loggedAt: string }`
  - `waterSettingsSchema` → `WaterSettings { dailyGoalMl: number; wakeTime: string; sleepTime: string; intervalMinutes: number; cupSizesMl: number[]; enabled: boolean }`, `DEFAULT_WATER_SETTINGS`
  - `registerSchema` → `{ email: string; password: string; consent: true }`, `loginSchema` → `{ email: string; password: string }`

- [ ] **Step 1:** `git init`; kök `package.json` (`"private": true`; scripts `build: pnpm -r build`, `test: pnpm -r test`, `typecheck: pnpm -r typecheck`), `pnpm-workspace.yaml` (`apps/*`, `packages/*`), `.npmrc`, `tsconfig.base.json` (strict). Shared: `tsc` → `dist/` CommonJS + `.d.ts`.
- [ ] **Step 2: Failing testler — `schemas.test.ts`**

```ts
it('rejects non-positive doseAmount', () => expect(medicationInputSchema.safeParse({ ...validMed, doseAmount: 0 }).success).toBe(false));
it('accepts decimal doseAmount for syrup', () => expect(medicationInputSchema.safeParse({ ...validMed, form: 'syrup', doseAmount: 2.5, doseUnit: 'ml' }).success).toBe(true));
it('rejects endDate before startDate', () => expect(medicationInputSchema.safeParse({ ...validMed, startDate: '2026-12-10', endDate: '2026-12-01' }).success).toBe(false));
it('daily requires at least one HH:mm time', () => expect(scheduleInputSchema.safeParse({ type: 'daily', times: [], weekdays: [], intervalHours: null, anchorTime: null }).success).toBe(false));
it('weekdays requires days within 1..7', () => expect(scheduleInputSchema.safeParse({ type: 'weekdays', times: ['08:00'], weekdays: [0], intervalHours: null, anchorTime: null }).success).toBe(false));
it('interval requires intervalHours 1..24 and anchorTime', () => expect(scheduleInputSchema.safeParse({ type: 'interval', times: [], weekdays: [], intervalHours: 8, anchorTime: null }).success).toBe(false));
it('rejects time "25:00"', () => expect(scheduleInputSchema.safeParse({ type: 'daily', times: ['25:00'], weekdays: [], intervalHours: null, anchorTime: null }).success).toBe(false));
it('register rejects password shorter than 8', () => expect(registerSchema.safeParse({ email: 'a@b.com', password: '1234567', consent: true }).success).toBe(false));
it('register lowercases email', () => expect(registerSchema.parse({ email: 'A@B.com', password: '12345678', consent: true }).email).toBe('a@b.com'));
it('register requires consent true', () => expect(registerSchema.safeParse({ email: 'a@b.com', password: '12345678', consent: false }).success).toBe(false));
```

- [ ] **Step 3:** `pnpm --filter @ilac/shared test` → FAIL (modül yok).
- [ ] **Step 4:** `schemas.ts`: `.superRefine` ile tip bazlı kurallar; `stockQuantity >= 0`; `refillThresholdDays` varsayılan 7; `color` `#RRGGBB`; saat regex `^([01]\d|2[0-3]):[0-5]\d$`.
- [ ] **Step 5:** `pnpm --filter @ilac/shared test` → PASS; `pnpm build` → `packages/shared/dist/index.js` oluşur.
- [ ] **Step 6:** `ci.yml`: ubuntu-latest, Node 22, pnpm; `pnpm install --frozen-lockfile && pnpm build && pnpm typecheck && pnpm test`; API e2e için `services: postgres:16` + `DATABASE_URL`.
- [ ] **Step 7:** Commit `chore: monorepo scaffold and shared schemas`.

### Task 2: Plan → doz anları (`occurrences.ts`)

**Files:** Create `packages/shared/src/occurrences.ts`, `occurrences.test.ts`

**Interfaces:**
- Consumes: `Medication`, `Schedule` (Task 1)
- Produces: `occurrencesBetween(med: Medication, schedule: Schedule, from: Date, to: Date): Date[]` — `[from, to)` aralığı, artan sıralı, yerel saat diliminde; arşivli ilaç → `[]`.

Testler `TZ=Europe/Istanbul` ile çalışır (`vitest.config.ts` → `test.env`).

- [ ] **Step 1: Failing testler**

```ts
it('daily_two_times', ...)              // 2026-11-20, ['08:00','20:00'] → [20 Kas 08:00, 20 Kas 20:00] yerel
it('weekdays_sunday_iso7', ...)         // weekdays [7], ['09:00']: 2026-11-22 (Pazar) → 1 sonuç; 2026-11-23 → 0
it('interval_crosses_midnight', ...)    // 8 saat, anchor '08:00', startDate 2026-11-20: 20 Kas → 08:00,16:00; 21 Kas → 00:00,08:00,16:00
it('respects_start_and_end_date', ...)  // startDate 2026-11-21 → 20 Kas []; endDate 2026-11-25 → 25 Kas dahil, 26 Kas []
it('archived medication yields nothing', ...)
it('range spanning 3 days returns sorted union', ...)
```

- [ ] **Step 2:** Test → FAIL.
- [ ] **Step 3:** Uygula. Daily/weekdays: aralıktaki her yerel gün için `new Date(y, m, d, hh, mm)`; ISO gün = `getDay() || 7`. Interval: ilk an = `startDate` günü yerel `anchorTime`; sonraki anlar `+ intervalHours * 3_600_000` ms; `from` öncesindeki anları döngüyle değil aritmetikle atla (`Math.ceil((from - first) / step)`).
- [ ] **Step 4:** Test → PASS.
- [ ] **Step 5:** Commit `feat(shared): schedule occurrences`.

### Task 3: Stok ve kalan gün (`stock.ts`)

**Files:** Create `packages/shared/src/stock.ts`, `stock.test.ts`

**Interfaces:**
- Produces:
  - `currentStock(med: Medication, logs: DoseLog[]): number`
  - `averageDailyDoses(schedules: Schedule[]): number` — daily: `times.length`; weekdays: `times.length * weekdays.length / 7`; interval: `24 / intervalHours`; toplam.
  - `daysLeft(med: Medication, schedules: Schedule[], logs: DoseLog[]): number | null` — ortalama 0 ise `null`; aksi halde `floor(currentStock / (doseAmount * avg))`.
  - `isLowStock(med: Medication, schedules: Schedule[], logs: DoseLog[], today: Date): boolean` — `daysLeft <= refillThresholdDays`; `endDate` stok bitiminden önceyse `false`.

- [ ] **Step 1: Failing testler**

```ts
it('only taken logs after stockSetAt reduce stock', ...) // stok 30, stockSetAt T; taken@T-1h, taken@T+1h, skipped@T+2h, snoozed@T+3h; doz 1 → 29
it('decimal syrup dose', ...)                            // stok 100 ml, doz 2.5, 4 taken → 90
it('never negative', ...)                                // stok 1, doz 1, 3 taken → 0
it('daysLeft daily 2x', ...)                             // stok 30, doz 1, ['08:00','20:00'] → 15
it('daysLeft weekdays', ...)                             // stok 6, [1,3,5] ['09:00'] → floor(6 / (3/7)) = 14
it('daysLeft interval 8h', ...)                          // stok 9, 8 saat → 3
it('daysLeft null without schedules', ...)
it('isLowStock true at threshold', ...)                  // daysLeft 7, eşik 7 → true
it('isLowStock false when endDate comes before depletion', ...) // daysLeft 5, endDate bugün+3 → false
```

- [ ] **Step 2:** FAIL. **Step 3:** Uygula. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(shared): derived stock and days left`.

### Task 4: Günün listesi (`today.ts`)

**Files:** Create `packages/shared/src/today.ts`, `today.test.ts`; Modify `packages/shared/src/index.ts`

**Interfaces:**
- Produces:
  - `DayDose { medication: Medication; scheduledAt: Date; log: DoseLog | null }`
  - `dosesForDay(meds: Medication[], schedules: Schedule[], logs: DoseLog[], day: Date): DayDose[]` — günün yerel 00:00–24:00 aralığı, `scheduledAt` sıralı; log eşleşmesi `medicationId` + `scheduledAt` ISO eşitliği; plan dışı ekstra doz loglarını da ekler.
  - `waterTotalForDay(logs: WaterLog[], day: Date): number`

- [ ] **Step 1: Failing testler**

```ts
it('merges occurrences of two meds sorted by time', ...)
it('attaches matching log by medicationId+scheduledAt', ...)
it('includes extra dose log not in schedule', ...)
it('waterTotalForDay counts only that local day', ...) // 23:50 ve ertesi gün 00:10 kayıtları ayrı günlere düşer
```

- [ ] **Step 2:** FAIL. **Step 3:** Uygula. **Step 4:** PASS; `pnpm build`.
- [ ] **Step 5:** Commit `feat(shared): day dose list and water total`.

### Task 5: API iskeleti + Prisma şeması + health

**Files:** Create `apps/api/*` (Nest CLI), `apps/api/prisma/schema.prisma`, `src/prisma/prisma.service.ts`, `src/health.controller.ts`, `test/health.e2e-spec.ts`, kök `docker-compose.yml`, `apps/api/.env.example`

**Interfaces:**
- Produces: global `PrismaService`; `GET /health → 200 { status: 'ok', db: 'ok' }` (`SELECT 1`).
- Env: `DATABASE_URL`, `JWT_SECRET`, `PORT=3000`.

Prisma modelleri (alan adları shared tiplerle aynı camelCase; tablolar `@@map` ile snake_case):
`User(id uuid, email unique, passwordHash, locale default 'tr', consentAt DateTime, createdAt, updatedAt)`, `RefreshToken(id, userId, tokenHash unique, expiresAt, revokedAt?, replacedById?)`, `Medication`, `Schedule(times String[], weekdays Int[])`, `DoseLog(@@unique([medicationId, scheduledAt]))`, `WaterLog`, `WaterSettings(userId unique, cupSizesMl Int[])`. Senkron tablolarında `userId`, `createdAt`, `updatedAt @updatedAt`, `deletedAt?`; `doseAmount`/`stockQuantity` `Decimal`. Tüm ilişkilerde `onDelete: Cascade`.

- [ ] **Step 1:** `docker-compose.yml`: `postgres:16`, port 5432, `ilac` ve `ilac_test` veritabanları (init script).
- [ ] **Step 2: Failing test** — `health.e2e-spec.ts`: `GET /health` → 200, `{ status: 'ok', db: 'ok' }`.
- [ ] **Step 3:** `pnpm --filter api test:e2e` → FAIL.
- [ ] **Step 4:** Şema + `prisma migrate dev --name init` + Nest iskeleti + Helmet + global `ZodValidationPipe`.
- [ ] **Step 5:** e2e → PASS (test DB `ilac_test`; e2e başında `prisma migrate reset --force --skip-seed`).
- [ ] **Step 6:** Commit `feat(api): nest scaffold, prisma schema, health`.

### Task 6: API auth (register / login / refresh / logout / me)

**Files:** Create `src/auth/*`, `src/me/me.controller.ts`, `test/auth.e2e-spec.ts`

**Interfaces:**
- Consumes: `registerSchema`, `loginSchema` (shared), `PrismaService`
- Produces:
  - `POST /auth/register { email, password, consent: true } → 201 { accessToken, refreshToken, user: { id, email } }`
  - `POST /auth/login { email, password } → 200` aynı gövde
  - `POST /auth/refresh { refreshToken } → 200` yeni çift (eskisi `revokedAt` + `replacedById`)
  - `POST /auth/logout { refreshToken } → 204`
  - `GET /me` (Bearer) `→ 200 { id, email, locale }`
  - `JwtGuard`, `@CurrentUser()` → `{ id: string }` (M2 sync uçları kullanacak)
- Refresh token: 32 bayt rastgele, base64url; DB'de `sha256` hash'i. `@nestjs/throttler`: auth uçlarında 10 istek/dk.

- [ ] **Step 1: Failing testler**

```ts
it('register returns tokens and stores argon2 hash, not plaintext', ...)
it('register duplicate email (case-insensitive) → 409', ...)
it('register without consent:true → 400', ...)
it('login wrong password → 401 with same message as unknown email', ...)
it('GET /me without token → 401; with token → user', ...)
it('refresh rotates: old refresh token then → 401', ...)
it('reusing a revoked refresh token revokes all user tokens', ...)
it('logout then refresh → 401', ...)
```

- [ ] **Step 2:** FAIL. **Step 3:** Uygula (`argon2.hash`, `@nestjs/jwt` 15 dk). **Step 4:** PASS.
- [ ] **Step 5:** Swagger `/docs` (`@nestjs/swagger`); auth uçları belgelenmiş, tarayıcıda açılıyor.
- [ ] **Step 6:** Commit `feat(api): auth with rotating refresh tokens`.

### Task 7: Mobil iskelet — router, yerel DB, i18n

**Files:** Create `apps/mobile` (`create-expo-app@latest`, tabs şablonu; örnek ekranlar silinir), `src/db/{schema,client}.ts`, `drizzle.config.ts`, `drizzle/`, `metro.config.js`, `src/i18n/{index.ts,tr.json}`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `__tests__/tabs.test.tsx`

**Interfaces:**
- Produces:
  - Drizzle tabloları `medications`, `schedules`, `dose_logs` (unique index `medication_id, scheduled_at`), `water_logs`, `water_settings` (tek satır, id `'default'`, ek yerel sütun `onboarded` boolean varsayılan false); `times`, `weekdays`, `cup_sizes_ml` → `text({ mode: 'json' })`; TS alan adları shared tiplerle birebir.
  - `db` (drizzle istemcisi); `_layout.tsx` açılışta `useMigrations` uygular; `water_settings` yoksa `DEFAULT_WATER_SETTINGS` yazar.
  - `t()`; `tr.json` grupları: `tabs.*`, `today.*`, `meds.*`, `water.*`, `history.*`, `settings.*`, `auth.*`, `onboarding.*`, `common.*`.
  - Sekmeler: `index` (Bugün), `medications` (İlaçlar), `water` (Su), `history` (Geçmiş), `settings` (Ayarlar).
- `metro.config.js`: `sourceExts.push('sql')`; `babel-plugin-inline-import` ile `.sql` (drizzle expo migrator gereği).

- [ ] **Step 1: Failing test** — `tabs.test.tsx`: kök layout render → "Bugün", "İlaçlar", "Su", "Geçmiş", "Ayarlar" görünür (DB modülü jest'te mock).
- [ ] **Step 2:** `pnpm --filter mobile test` → FAIL.
- [ ] **Step 3:** Uygula; `drizzle-kit generate`.
- [ ] **Step 4:** Test → PASS. Android telefonda `pnpm --filter mobile start` + Expo Go → 5 sekme görünür.
- [ ] **Step 5:** Commit `feat(mobile): router tabs, local db, i18n`.

### Task 8: İlaç yönetimi (liste, detay, ekle/düzenle)

**Files:** Create `src/db/repo/medications.ts`, `src/components/MedicationForm.tsx`, `app/(tabs)/medications/{index,[id],edit}.tsx`, `__tests__/MedicationForm.test.tsx`

**Interfaces:**
- Consumes: şemalar (Task 1), `daysLeft`, `currentStock` (Task 3), `db` (Task 7)
- Produces (`repo/medications.ts`):
  - `useMedications(): { meds: Medication[]; schedules: Schedule[] }` (`useLiveQuery`, arşivliler hariç)
  - `saveMedication(input: MedicationInput, schedules: ScheduleInput[], id?: string): Promise<string>` — tek transaction; yeni kayıtta `stockSetAt = now`; düzenlemede planlar silinip yeniden yazılır; `stockQuantity` değiştiyse `stockSetAt = now`.
  - `restock(id: string, quantity: number): Promise<void>` — `stockQuantity = quantity`, `stockSetAt = now`.
  - `archiveMedication(id: string): Promise<void>`
- `MedicationForm` props: `{ initial?: { med: MedicationInput; schedules: ScheduleInput[] }; onSubmit(med: MedicationInput, schedules: ScheduleInput[]): void }`; 3 adım: Bilgiler → Plan → Stok; react-hook-form + `zodResolver`.
- Liste satırı: renk noktası, ad, `strength`, kalan gün rozeti (`null` → rozet yok). Detay: planlar, güncel stok, "Kutu aldım" (restock), Düzenle, Arşivle. `edit.tsx` `?id=` parametresiyle hem ekleme hem düzenleme.

- [ ] **Step 1: Failing testler**

```ts
it('blocks submit when name empty and shows error', ...)
it('weekdays plan requires a day selection', ...)
it('submits parsed values: doseAmount number, times ["08:00","20:00"]', ...)
```

- [ ] **Step 2:** FAIL. **Step 3:** Uygula. **Step 4:** PASS.
- [ ] **Step 5:** Telefonda: ilaç ekle → listede kalan gün rozetiyle görünür → düzenle → arşivle → listeden kalkar.
- [ ] **Step 6:** Commit `feat(mobile): medication management`.

### Task 9: Bugün ekranı — doz işaretleme ve düşük stok

**Files:** Create `src/db/repo/doses.ts`, `src/components/{DoseCard,LowStockBanner}.tsx`, `app/(tabs)/index.tsx`, `__tests__/DoseCard.test.tsx`

**Interfaces:**
- Consumes: `dosesForDay` (Task 4), `isLowStock` (Task 3), `useMedications` (Task 8)
- Produces (`repo/doses.ts`):
  - `useDoseLogs(): DoseLog[]`
  - `setDoseStatus(medicationId: string, scheduledAt: Date, status: 'taken' | 'skipped'): Promise<void>` — `onConflictDoUpdate` hedefi (`medicationId`, `scheduledAt`); `taken` → `takenAt = now`, `skipped` → `takenAt = null`.
  - `clearDoseStatus(medicationId: string, scheduledAt: Date): Promise<void>` — "Geri al", kaydı siler.
  - `logExtraDose(medicationId: string): Promise<void>` — `scheduledAt = takenAt = now`, `taken`.
- `DoseCard` props: `{ dose: DayDose; now: Date; onTake(): void; onSkip(): void; onUndo(): void }`; durumlar: bekliyor (saat geçtiyse "gecikti" etiketi), alındı (alınma saati + Geri al), atlandı (Geri al).
- Bugün ekranı: tarih başlığı, `LowStockBanner` (düşük stoklu ilaç adları → detaya gider), doz kartları, alt kısımda su özeti için yer (Task 10 doldurur), ilaç detayında "Ekstra doz al" butonu.

- [ ] **Step 1: Failing testler**

```ts
it('pending card shows time and Aldım/Atla; pressing Aldım calls onTake', ...)
it('taken card shows taken time and Geri al', ...)
it('pending card past its time shows "gecikti"', ...)
```

- [ ] **Step 2:** FAIL. **Step 3:** Uygula. **Step 4:** PASS.
- [ ] **Step 5:** Telefonda: "Aldım"a iki kez hızlı bas → tek kayıt, stok bir kez düşer; "Geri al" → stok geri gelir.
- [ ] **Step 6:** Commit `feat(mobile): today screen with dose actions`.

### Task 10: Su takibi

**Files:** Create `src/db/repo/water.ts`, `src/components/{WaterRing,CupButtons}.tsx`, `app/(tabs)/water.tsx`, `__tests__/WaterRing.test.tsx`; Modify `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `waterTotalForDay` (Task 4), `waterSettingsSchema` (Task 1)
- Produces:
  - `useWaterToday(): { totalMl: number; logs: WaterLog[]; settings: WaterSettings }`
  - `addWater(amountMl: number): Promise<void>`, `deleteWater(id: string): Promise<void>`, `saveWaterSettings(s: WaterSettings): Promise<void>`
  - `WaterRing { totalMl: number; goalMl: number; size?: 'sm' | 'lg' }` — `react-native-svg`; yüzde `min(100, round(total / goal * 100))`.
  - `CupButtons { sizes: number[]; onAdd(ml: number): void }` + "Özel" (sayı girişi).
- Su ekranı: büyük halka, bardak butonları, günün kayıtları (uzun bas → sil), ayarlar formu (hedef, uyanma, uyku, aralık, bardaklar). Bugün ekranına `WaterRing size="sm"` + `CupButtons` eklenir.

- [ ] **Step 1: Failing testler**

```ts
it('shows "750 / 2000 ml" and "%38"', ...)
it('caps at %100 when over goal', ...)
it('CupButtons pressing 300 calls onAdd(300)', ...)
```

- [ ] **Step 2:** FAIL. **Step 3:** Uygula. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(mobile): water tracking`.

### Task 11: Geçmiş, Ayarlar, onboarding, giriş/kayıt

**Files:** Create `app/(tabs)/{history,settings}.tsx`, `app/onboarding.tsx`, `app/auth/{login,register}.tsx`, `src/api/client.ts`, `src/store/session.ts`, `__tests__/apiClient.test.ts`

**Interfaces:**
- Consumes: API uçları (Task 6), `registerSchema`/`loginSchema` (Task 1)
- Produces:
  - `Session { accessToken: string; refreshToken: string; user: { id: string; email: string } }` — `expo-secure-store`'da; `useSession()` zustand store.
  - `api.register(email, password, consent): Promise<Session>`, `api.login(email, password): Promise<Session>`, `api.logout(): Promise<void>`, `api.me(): Promise<{ id; email; locale }>`; 401'de bir kez `/auth/refresh` dener, başarısızsa oturumu temizler. Adres `process.env.EXPO_PUBLIC_API_URL`.
- Geçmiş (M1 basit): son 14 gün; gün başlığı altında doz kayıtları (ilaç, saat, durum) + günün su toplamı. Grafikler M3'te.
- Ayarlar: hesap (giriş/kayıt ya da e-posta + çıkış), su ayarlarına kısayol, dil (yalnız TR), tıbbi tavsiye beyanı, sürüm, `__DEV__`'de "Demo verisi yükle".
- Onboarding: ilk açılışta tanıtım → su hedefi; tamamlandı bayrağı `water_settings.onboarded` (Task 7'de tanımlı; izin adımı M2'de).
- Kayıt formunda KVKK açık rıza onay kutusu zorunlu.

- [ ] **Step 1: Failing testler** (fetch mock)

```ts
it('login stores session', ...)
it('on 401 refreshes once and retries original request', ...)
it('on refresh failure clears session', ...)
```

- [ ] **Step 2:** FAIL. **Step 3:** Uygula. **Step 4:** PASS.
- [ ] **Step 5:** Telefonda (`EXPO_PUBLIC_API_URL=http://<bilgisayar-LAN-IP>:3000`): kayıt ol → Ayarlar'da e-posta görünür → çıkış → giriş.
- [ ] **Step 6:** Commit `feat(mobile): history, settings, onboarding, auth`.

### Task 12: Ön kontrol demosu

**Files:** Create `apps/mobile/.maestro/demo-flow.yaml`, `apps/mobile/src/db/seed-demo.ts`, kök `README.md`

**Interfaces:**
- Produces: `seedDemo(): Promise<void>` — 3 ilaç (günlük 2x tablet; Pzt/Çar/Cum kapsül; 8 saatte bir 5 ml şurup, düşük stoklu) + bugün 2 su kaydı.

- [ ] **Step 1:** Maestro akışı: onboarding geç → ilaç ekle ("Parol", tablet, 1 adet, 08:00 + 20:00, stok 20) → Bugün'de iki kart → ilkine "Aldım" → İlaçlar'da detayda stok 19 → Su'da 300 ml → halka "%15".
- [ ] **Step 2:** `maestro test apps/mobile/.maestro/demo-flow.yaml` (telefon USB'de) → PASS.
- [ ] **Step 3:** README: kurulum (`pnpm i`, `docker compose up -d`, `pnpm --filter api prisma migrate dev`, `pnpm --filter api start:dev`, `pnpm --filter mobile start`), mimari şema, ekran görüntüleri, Swagger adresi.
- [ ] **Step 4:** `pnpm build && pnpm typecheck && pnpm test` → hepsi yeşil; CI yeşil.
- [ ] **Step 5:** Commit `docs: pre-check demo flow and readme`.

---

## Takvim önerisi (tek geliştirici)

| Gün | Görev |
|---|---|
| 18–19 Kas | Task 1–4 |
| 20–21 Kas | Task 5–6 |
| 22–23 Kas | Task 7 |
| 24–25 Kas | Task 8 |
| 26 Kas | Task 9 |
| 27 Kas | Task 10 |
| 28 Kas | Task 11 |
| 29 Kas | Task 12 + tampon |
