# İlaç ve Su Takip Uygulaması — Tasarım Dokümanı

Tarih: 2026-11-18 · Durum: **onaylandı** (2026-11-18)

**Ekip ve cihaz [karar: kullanıcı]:** tek geliştirici; yalnızca Android telefon var, Apple Developer hesabı yok. → Teslime kadar hedef ve doğrulama platformu **Android**. Kod Expo ile çapraz platform kalır ve iOS kısıtlarına (64 bildirim limiti) göre yazılır, ancak iOS'ta test ve yayın mezuniyet sonrasına ertelenir.

> İşaretler: **[karar: kullanıcı]** = kullanıcının söylediği/seçtiği. **[öneri]** = tasarımcının kararı, itiraz edilebilir. **[builder]** = uygulayıcıya bırakıldı.

---

## 1. Amaç ve neden

Kullanıcının ilaçlarını belirlediği zamanlarda hatırlatan, her dozun durumunu kaydeden, stoktan kalan gün sayısını hesaplayıp reçete yenileme uyarısı veren; ayrıca uyanık olduğu saatlerde belirli aralıklarla su içmeyi hatırlatıp günlük ml hedefini takip eden bir mobil uygulama.

Proje aynı anda üç iş görecek **[karar: kullanıcı]**:
1. Bitirme projesi — jüri **veritabanı ve backend** bekliyor; teknoloji serbest.
2. Portföy — kod kalitesi, test, mimari gösterilebilir olmalı.
3. İleride App Store / Google Play'de yayın — gerçek cihazda güvenilir çalışmalı.

**Başarı:** Gerçek bir iPhone ve Android telefonda, uygulama kapalıyken bile hatırlatmalar zamanında geliyor; doz kayıtları ve stok doğru; internet yokken tam çalışıyor; hesap açan kullanıcının verisi backend'e senkronize oluyor ve ikinci cihazda geri geliyor.

## 2. Hedefler, hedef dışı, anti-hedefler

**Hedefler (v1)**
- İlaç yönetimi: ekle/düzenle/arşivle, plan (her gün / belirli günler / X saatte bir), saatler.
- Yerel bildirimle hatırlatma; bildirimden "Aldım / Ertele / Atla".
- Doz geçmişi: alındı / atlandı / ertelendi / kaçırıldı + alınma zamanı.
- Stok takibi, kalan gün hesabı, reçete yenileme hatırlatması.
- Su takibi: bardak boyutlarıyla hızlı kayıt, günlük hedef, uyanma–uyku arası aralıklı hatırlatma.
- Bugün ekranı, geçmiş/istatistik (uyum yüzdesi, su grafiği).
- Hesap (opsiyonel) + backend senkronizasyonu + hesap silme.
- Türkçe ve İngilizce **[öneri]** (mağaza hedefi için).

**Hedef dışı (v1)** **[öneri]**
- Bakıcı/yakın takibi (başkasının dozlarını izleme).
- İlaç veritabanı, etkileşim kontrolü, barkod/prospektüs okuma.
- Apple Health / Google Health Connect entegrasyonu.
- Web paneli.
- Sunucudan gönderilen push bildirimleri (tüm hatırlatmalar yerel; v2 adayı).

**Anti-hedefler** (çalışsa bile başarısızlık sayılır)
- Hatırlatmanın internete bağlı olması.
- Bildirimin sessizce gelmemesi (iOS 64 limiti, Android pil optimizasyonu) ve kullanıcının bunu fark etmemesi.
- Doz/stok verisinin iki cihaz arasında senkronizasyonda kaybolması veya çift düşmesi.
- Tıbbi tavsiye veriyormuş gibi görünmesi (doz önerisi vb.).

## 3. Kısıtlar

- **iOS:** Bir uygulama en fazla **64** bekleyen yerel bildirim planlayabilir. → Kayan pencere planlayıcı (bkz. §7).
- **Android 12+:** Tam zamanlı alarm için `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM`; Android 13+ `POST_NOTIFICATIONS` izni. Üretici pil optimizasyonları (Xiaomi, Samsung vb.) bildirimi geciktirebilir → onboarding'de pil optimizasyonu muafiyeti rehberi. Google Play'in exact alarm politikasına uygunluğu **[builder]** doğrulayacak.
- **Bildirime dokunulmazsa kod çalışmaz.** "Kaçırıldı" durumu uygulama açıldığında geriye dönük hesaplanır.
- **Sağlık verisi (KVKK özel nitelikli veri):** Buluta yalnızca açık rızayla gider; aydınlatma metni + gizlilik politikası; hesap ve veri silme zorunlu (App Store kuralı da).
- **Offline-first:** Uygulama hesapsız ve internetsiz tam çalışır.
- **Saat dilimi:** İlaç saatleri "duvar saati" olarak saklanır (08:00 her yerde 08:00) **[öneri]**; seyahatte cihaz saat dilimini izler.

## 4. Yaklaşımlar

| | Yaklaşım | Artı | Eksi |
|---|---|---|---|
| **A** ✅ | React Native (Expo) + TypeScript; kendi backend: NestJS + PostgreSQL + Prisma | Tek dil, ortak tipler/iş mantığı; jüriye kendi API'si; Expo ile kolay mağaza yayını | Sunucu barındırma kendinde |
| B | Flutter + ASP.NET Core / Spring Boot + PostgreSQL | Çok iyi mobil performans | İki dil, modeller iki kez yazılır |
| C | Expo + Supabase | En hızlı | Backend büyük ölçüde hazır servis; "backend'i sen mi yazdın" sorusunda zayıf |

Veri konumu seçenekleri: yalnız cihaz / **cihaz öncelikli + senkronizasyon** / bulut öncelikli.

**Seçilen: A** **[karar: kullanıcı]**, veri modeli **cihaz öncelikli + bulut senkronizasyonu** **[karar: kullanıcı — jüri backend istiyor]**, aşamalı: önce offline çekirdek, sonra senkron.

## 5. Mimari

```
monorepo (pnpm workspaces)
├─ apps/mobile     Expo (React Native, TS)
├─ apps/api        NestJS (TS) + Prisma + PostgreSQL
└─ packages/shared Zod şemaları, tipler, saf iş mantığı (plan → doz zamanları, kalan gün, kaçırıldı tespiti)
```

`packages/shared` hem mobil hem API'de aynı doğrulama ve hesaplamayı kullanır — tek doğruluk kaynağı ve en yoğun test edilen paket.

### Mobil teknoloji seçimi **[öneri]**
| İş | Kütüphane |
|---|---|
| Çatı | Expo SDK (güncel kararlı), TypeScript strict, expo-router |
| Yerel DB | expo-sqlite + Drizzle ORM (migration + `useLiveQuery`) |
| Bildirim | expo-notifications (kategoriler/aksiyonlar, Android kanalları) |
| Arka plan | expo-background-task (bildirim penceresini tazelemek için, best-effort) |
| Form/doğrulama | react-hook-form + Zod (shared) |
| Uygulama durumu | Zustand (yalnız UI/oturum durumu; veri DB'de) |
| Ağ | fetch + TanStack Query (yalnız hesap/senkron çağrıları) |
| Güvenli depolama | expo-secure-store (token) |
| i18n | i18next + expo-localization |
| Grafik | victory-native veya react-native-gifted-charts **[builder]** |
| Test | Jest + React Native Testing Library; Maestro (E2E akışlar) |
| Build/yayın | EAS Build + EAS Submit |

### Backend teknoloji seçimi **[öneri]**
| İş | Seçim |
|---|---|
| Çatı | NestJS (TS) |
| DB | PostgreSQL 16 + Prisma |
| Kimlik | E-posta + şifre; argon2 hash; JWT access (15 dk) + refresh token rotasyonu (DB'de hash'li) |
| Doğrulama | Zod (shared) – nestjs-zod |
| Doküman | Swagger/OpenAPI |
| Güvenlik | Helmet, rate limit (@nestjs/throttler) |
| Test | Jest + Supertest; gerçek Postgres (Testcontainers veya docker compose) |
| Lokal geliştirme | docker compose (api + postgres) |
| Barındırma | Render/Railway (API) + Neon/Railway Postgres **[builder: maliyet/ücretsiz katmana göre]** |
| CI | GitHub Actions: lint, typecheck, test (shared + api + mobile) |

## 6. Veri modeli

Tüm senkronize tablolar: `id` (istemcide üretilen UUID v7), `user_id` (sunucuda), `created_at`, `updated_at`, `deleted_at` (soft delete — senkron için).

**Medication (ilaç)**
- `name`, `form` (tablet, kapsül, şurup, damla, iğne, krem, diğer)
- `dose_amount` + `dose_unit`: **her alımda stoktan düşen miktar** (ör. 1 tablet, 5 ml, 10 damla) **[öneri: "doz" bu anlamda]**
- `strength` (opsiyonel serbest metin, ör. "500 mg")
- `color` (UI rengi), `notes`
- `start_date`, `end_date` (opsiyonel; boşsa süresiz)
- `stock_quantity` + `stock_set_at` (bkz. stok hesabı)
- `refill_threshold_days` (varsayılan 7) **[öneri]**
- `archived_at`

**Schedule (plan)** — bir ilacın birden çok planı olabilir
- `medication_id`, `type`: `daily` | `weekdays` | `interval`
- `times`: `["08:00","20:00"]` (daily/weekdays)
- `weekdays`: ISO gün listesi (weekdays)
- `interval_hours` + `anchor_time` (interval; ör. 8 saat, 08:00 → 08,16,00)
- İlaç hatırlatmalarında sessiz saat yok **[öneri]**; gece dozu kullanıcı istediyse çalar.

**DoseLog (doz kaydı)**
- `medication_id`, `scheduled_at` (UTC an), `status`: `taken` | `skipped` | `snoozed` | `missed`, `taken_at`, `snoozed_until`
- **Benzersiz anahtar:** (`medication_id`, `scheduled_at`) — iki cihazdan gelen aynı doz birleşir, çift kayıt olmaz.
- Kayıtsız geçmiş zamanlar "bekliyor" sayılır; **planlanan zamandan 60 dk sonra** **[öneri]** uygulama açılışında `missed` olarak yazılır. `missed` sonradan `taken`'a çevrilebilir.
- Plandan bağımsız "ekstra doz" `scheduled_at = taken_at` ile kaydedilebilir **[öneri]**.

**WaterLog**: `amount_ml`, `logged_at`.

**WaterSettings** (kullanıcı başına bir): `daily_goal_ml`, `wake_time`, `sleep_time`, `interval_minutes`, `cup_sizes_ml` (ör. [200, 300, 500]), `enabled`.
- Varsayılan hedef: 2000 ml **[öneri]**.

**Sunucu tarafı ekstra**: `User` (email, password_hash, locale, consent_at), `RefreshToken`, `Device` (ileride push için).

### Stok hesabı (çakışmaya dayanıklı) **[öneri]**
Stok tek sayı olarak azaltılmaz; **türetilir**:

```
güncel_stok = stock_quantity − Σ dose_amount (status = taken, taken_at > stock_set_at)
```

Kullanıcı "kutu aldım / stoğu güncelle" dediğinde `stock_quantity` ve `stock_set_at` yeniden yazılır. Böylece iki cihazda alınan dozlar senkronda doğru birleşir; "geri al" sadece kaydın durumunu değiştirir. Stok 0'ın altına düşmez, uyarı gösterilir.

**Kalan gün** = `floor(güncel_stok / (dose_amount × günlük_ortalama_doz_sayısı))`. Günlük ortalama aktif planlardan hesaplanır (weekdays: haftalık/7; interval: 24/interval_hours). `end_date` varsa "tedavi bitimine kadar gerekli miktar" da gösterilir.

## 7. Bildirim motoru (en kritik parça)

**Kayan pencere planlayıcı** — `packages/shared` içinde saf fonksiyon + mobilde ince adaptör:
1. Aktif ilaç planlarından ve su ayarlarından gelecek olayları üret.
2. Sırala; **ilaçlar önce**, su sonra. Toplam **≤ 60** (iOS limitine pay) **[öneri]**, en fazla ~3 gün ileri.
3. Tüm planlı bildirimleri iptal et, yenilerini planla (deterministik id: `med:{id}:{iso}` / `water:{iso}`).
4. Tetikleyiciler: uygulama ön plana geldiğinde, ilaç/plan/su ayarı değiştiğinde, bildirim aksiyonunda, arka plan görevinde (best-effort), senkron sonrası.
5. Pencerenin son bildirimi "Hatırlatmaların devam etmesi için uygulamayı açın" olur **[öneri]**.

**İlaç bildirimi**
- Android: yüksek önemli ayrı kanal ("İlaç hatırlatmaları"); su için ayrı düşük önemli kanal.
- Aksiyonlar: **Aldım** (taken), **10 dk ertele** (snoozed + tek seferlik yeni bildirim), **Atla** (skipped).
- iOS'ta uygulama kapalıyken aksiyonun arka planda işlenmesi Expo'da kısıtlı olabilir; **[builder]** doğrular, çalışmazsa aksiyon uygulamayı açıp kaydı yazar.

**Su bildirimi**
- Yalnızca `wake_time`–`sleep_time` arası, `interval_minutes` aralıkla.
- Günlük hedef tamamlandıysa o günün kalan su bildirimleri iptal edilir.
- Aksiyon: "+{varsayılan bardak} ml".

**Reçete yenileme bildirimi**
- Kalan gün ≤ `refill_threshold_days` olduğunda yerel bildirim (günde en fazla bir kez, 10:00 **[öneri]**). Her stok/doz değişiminde yeniden hesaplanır.
- `end_date` stok bitiminden önceyse uyarı gönderilmez.

**İzinler / onboarding**: bildirim izni, Android exact alarm izni, pil optimizasyonu rehberi; izin reddedilirse Bugün ekranında kalıcı uyarı bandı.

## 8. Senkronizasyon

- Hesapsız (misafir) mod tam çalışır. Kayıt/girişte yerel veri sunucuya yüklenir.
- Yerel değişiklikler `dirty` işaretli; senkron:
  - `POST /sync/push` — değişen satırlar (upsert, soft delete dahil).
  - `GET /sync/pull?since=<cursor>` — sunucu `updated_at` (sunucu saati) > cursor olan satırlar.
- Çakışma: satır bazında **son yazan kazanır** (sunucu zaman damgası). DoseLog benzersiz anahtarla birleşir; stok türetildiği için kaybolmaz. İstisna: DoseLog'da kullanıcı kararı (`taken`/`skipped`) her zaman otomatik `missed`'i ezer **[öneri]**.
- Barındırma bölgesi: AB (ör. Frankfurt) **[öneri]**. Mezuniyete kadar yalnızca demo/test verisi; gerçek kullanıcı verisi öncesi KVKK yurt dışı aktarım rızası, veri sorumlusu bilgisi ve gizlilik politikası F6'da tamamlanır **[öneri]**.
- Tetikleyiciler: ön plana gelince, değişiklikten ~5 sn sonra (debounce), elle "şimdi senkronize et".
- Senkron hatası uygulamayı bloklamaz; Ayarlar'da son senkron zamanı görünür.

## 9. API (özet)

```
POST   /auth/register      POST /auth/login     POST /auth/refresh    POST /auth/logout
GET    /me                 PATCH /me            DELETE /me            (hesap + tüm veri silme)
GET    /me/export          (JSON veri dışa aktarma — KVKK)
POST   /sync/push          GET  /sync/pull?since=
GET    /stats/adherence?from=&to=   GET /stats/water?from=&to=
GET    /health
```
Her sorgu `user_id` ile kapsamlanır (servis katmanında zorunlu filtre + e2e testi).

**Jüri için backend görünürlüğü [öneri]:** okul özel bir şey istemediği için admin/web panel yok; bunun yerine istatistik uçları sunucuda hesaplanır, Swagger dokümanı yayında olur ve `docs/` altına ER diyagramı + veri modeli açıklaması eklenir.

## 10. Ekranlar

```
[Sekme] Bugün   İlaçlar   Su   Geçmiş   Ayarlar
```
- **Bugün:** saat sıralı doz kartları (tek dokunuşla işaretle) + su ilerleme halkası + bardak butonları + düşük stok uyarıları.
- **İlaçlar:** liste (renk, kalan gün rozeti) → detay (planlar, stok, geçmiş) → ekle/düzenle (adımlı form: bilgiler → plan → stok).
- **Su:** büyük ilerleme göstergesi, bardak butonları, günün kayıtları (sil/düzenle).
- **Geçmiş:** takvim görünümü, ilaç bazlı uyum yüzdesi, haftalık su grafiği.
- **Ayarlar:** su ayarları, bildirim/izin durumu, dil, hesap (giriş/kayıt/çıkış/sil), veri dışa aktar, gizlilik politikası, "tıbbi tavsiye değildir" beyanı.
- **Onboarding:** tanıtım → izinler → su hedefi.

Görsel tasarım **[builder]**; sistem yazı boyutu, karanlık mod ve erişilebilirlik etiketleri desteklenecek.

## 11. Güvenlik ve gizlilik

- Şifre argon2; refresh token DB'de hash'li, rotasyon + yeniden kullanım tespiti.
- HTTPS zorunlu; rate limit (özellikle login).
- Kayıtta KVKK aydınlatma + sağlık verisi için açık rıza onayı; `consent_at` saklanır.
- Hesap silme uygulama içinden (App Store şartı); sunucuda hard delete.
- Yerel DB şifreleme (SQLCipher) **[builder]**.
- Loglarda sağlık verisi yazılmaz.

## 12. Test stratejisi

- **packages/shared (en yoğun):** plan → olay üretimi (daily/weekdays/interval, ay/yıl sınırı, DST, end_date), kalan gün, kaçırıldı tespiti, bildirim penceresi seçimi (60 limit, ilaç önceliği, su hedefi dolunca kesme), türetilmiş stok.
- **API:** auth akışları, kullanıcı izolasyonu, sync push/pull + çakışma, hesap silme — gerçek Postgres ile.
- **Mobil:** kritik bileşen testleri; Maestro ile "ilaç ekle → Bugün'de görünür → aldım → stok düşer".
- **Manuel cihaz testi:** uygulama kapalıyken bildirim, yeniden başlatma sonrası, Doze modu, saat dilimi değişimi.

## 13. Takvim ve aşamalar

Tarihler **[karar: kullanıcı]**: **30.11.2026 ön kontrol** (arayüz + bazı basit sistemler), **28.12.2026 son teslim**. Aşama içerikleri **[öneri]**.

| Kilometre taşı | Tarih | İçerik | Bitti sayılır |
|---|---|---|---|
| M0 Kurulum | 18–20 Kas | Monorepo, lint/TS/CI, Expo + NestJS iskeleti, docker compose, Prisma şeması + ilk migration | CI yeşil; API `/health` ve DB çalışıyor |
| **M1 Ön kontrol** | 21–30 Kas | Tüm ekranların arayüzü (5 sekme + ekle/düzenle formu + onboarding); yerel DB; ilaç/plan CRUD; Bugün ekranında doz işaretleme; türetilmiş stok + kalan gün; su kaydı + hedef ilerlemesi; backend'de register/login | Jüriye canlı demo: ilaç ekle → Bugün'de gör → aldım → stok düşer; su ekle; hesap aç |
| M2 Çekirdek | 1–14 Ara | Bildirim motoru (ilaç + su + reçete), bildirim aksiyonları, kaçırıldı tespiti, gerçek cihaz testleri; backend sync push/pull | Uygulama kapalıyken hatırlatma geliyor; iki cihaz arası senkron |
| M3 Tamamlama | 15–24 Ara | Geçmiş/istatistik (sunucu uçları dahil), hesap silme/dışa aktarma, i18n (TR/EN), deploy (AB bölgesi), Swagger + ER diyagramı + README | Canlı API; tüm hedefler çalışıyor |
| Tampon | 25–28 Ara | Hata düzeltme, sunum, demo verisi | Teslim |
| Mezuniyet sonrası | — | Mağaza yayını: EAS Submit, TestFlight/Play iç test, KVKK metinleri, gizlilik politikası, SQLCipher | Mağazada |

Süre sıkışırsa kesilme sırası **[öneri]**: önce i18n (yalnız TR kalır), sonra Geçmiş ekranındaki grafikler (liste kalır), sonra bildirim aksiyonları (dokununca uygulama açılır). Bildirim motoru ve sync kesilmez — biri projenin özü, diğeri backend şartı.

## 14. Uygulayıcıya bırakılanlar

Grafik kütüphanesi, barındırma sağlayıcısı, görsel tasarım dili, SQLCipher, Play exact-alarm politikası doğrulaması, iOS arka plan aksiyon davranışı, klasör iç yapısı ve isimlendirme.
