# NFCHane — Supabase başlangıç altyapısı

15 Kasım 2026. Mevcut Vite/JavaScript site korunur. Satış, tahsilat, sipariş kabulü ve dosya yükleme açılmaz. Ücretsiz Supabase ve Cloudflare planları kullanılır; yeni ücretli hizmet yoktur.

## Mimari ve maliyet tercihi

Ürün metinleri yayın hazırlanırken Supabase Data API üzerinden yalnızca okunur. `scripts/sync-supabase-catalog.mjs` yedi ürünü doğrulayıp `src/catalog-snapshot.json` dosyasına yazar; Vite aynı veriden ana sayfayı, ürün sayfalarını ve tarayıcı kodunu derler. Her ziyaretçiden veritabanı isteği oluşmaz. Katalog Supabase'te değiştiğinde yeniden yayın gerekir; otomatik/anlık içerik paneli henüz yoktur.

Bağlantı yoksa yerel geliştirme mevcut paketli katalogla çalışır. Bağlantı ayarları varsa fakat sunucu yanıtı veya katalog geçersizse derleme başarısız olur: mevcut canlı yayın korunur, hata gövdesi ve anahtarlar günlüğe yazılmaz. Görseller mevcut Cloudflare varlıklarında kalır; Supabase Storage yükleme ve ek görsel trafiği oluşturulmaz. Bu düzen Supabase'in ücretsiz proje duraklama riskini ortadan kaldırmaz; yapay etkinlik üretilmez. Duraklamada son yayımlanmış statik site çalışır, yeni katalog derlemesi proje açılana kadar başarısız olabilir.

## Ürünler

`public.products`: mevcut kimlik ve slug, ad/açıklama, kategori, tasarım metinleri, tema/simge, görsel yolu ve QR/NFC görsel eşlemeleri; kuruş cinsinden nullable fiyat, TRY, boyutlar, şeffaf malzeme, 3 mm, okutma/bağlantı yöntemleri, menü hizmetleri, görünürlük ve sıralama.

- Yedi mevcut ürün seed ile eklenir; seed tekrar çalıştırıldığında yönetici düzenlemelerinin üzerine yazmaz.
- Fiyatlar `NULL`; `is_purchasable` yalnız `false` olabilir. Gelecekte fiyat girilse bile önizleme fiyatları göstermez, ödeme açılmaz.
- Şimdilik siteye alınan değişebilir alanlar ad, açıklama, etiket, başlık ve alt metindir. Yeni ürün/slug, görsel veya seçenek eklemek mevcut yönlendirme/tasarım kodunun da düzenlenmesini gerektirir. Bilinmeyen/kısmi katalog yayımlanmaz.
- Mevcut HTML şablonları için düz metin doğrulaması yapılır; HTML ve öznitelik metakarakterleri reddedilir. Zengin metin editörü değildir.

## Sipariş ve kişisel bilgiler

Tüm müşteri verisi `private` şemasında kalır. Bu şema Data API'ye açılmaz; `anon` ve `authenticated` rollerinin şema/tablo yetkisi yoktur. Bütün tablolarda RLS açık; tarayıcıya sipariş okuma/yazma politikası eklenmez.

- `orders`: benzersiz istek anahtarı, isteğe bağlı Auth kullanıcı kimliği (misafir için NULL), ad/e-posta/telefon, Türkiye teslimat adresi kopyası, bireysel/kurumsal fatura bilgileri, durum, kuruş tutarları, hukuki metin sürümleri ve tarihler.
- `order_items`: ürün adı/görsel/fiyat kopyası, boyut, malzeme, 3 mm, yöntem, bağlantı türü, menü hizmeti, adet ve kişiselleştirme JSON'u. QR/NFC hedefi, işletme adı ve ürün türüne özel bilgiler burada ileride doğrulanmış olarak saklanabilir. Bunlar public ürün tablosuna konmaz.
- `order_status_events`: durum geçişi ve yetkili işlem geçmişi.
- `shipments`: manuel kargo firması, takip numarası ve durum; gelecekte sağlayıcı adaptörü eklenebilir.
- `invoices`: e-Fatura/e-Arşiv türü, numara, tarih ve korumalı belge yolu. Otomatik fatura yok.
- `admin_members`: gelecekte sunucu tarafından denetlenecek yönetici rolü. Otomatik rol verilmez; şu anda boş.
- `schema_migrations`: uygulanmış altyapı sürümü.

Sipariş durumları: awaiting_payment, paid, preparing, shipped, delivered, cancelled, refunded. Mevcut şemada başlık/kalem tutarlarının aynı işlemde eşleştirilmesi, ödeme doğrulaması ve geçerli durum geçişlerinin yürütülmesi için satış öncesi sunucu işlemleri zorunludur. Tabloların bulunması sipariş akışının hazır olduğu anlamına gelmez.

## Yönetim

İlk aşamada yalnızca Supabase proje sahibinin giriş yaptığı Table Editor/SQL Editor yönetim sağlar. Ürünlerin metinleri güvenle düzenlenebilir; yeniden yayın sonrası sitede görünür. Ayrı site yönetim paneli henüz yoktur. Yeni yönetici daveti, parola, servis anahtarı veya kamuya açık yönetim uç noktası oluşturulmaz.

Sonraki aşamada Cloudflare Worker + Supabase Auth doğrulaması + özel yönetici rolü + MFA ile ayrı panel kurulmalı. Tarayıcıda rol saklamak yetkilendirme değildir. Ayrı hesaplar ve sipariş erişimleri RLS/sunucu tarafında denetlenmeli.

## Misafir ve üyelikli sipariş — sonraki aşama

En son kullanıcı kararı misafir siparişine izin verecek şekilde önceki üyelik zorunluluğunun önündedir. İsteğe bağlı `customer_user_id` her ikisini de destekler.

1. Müşteriden seçilen ürün/yöntem/boyut/adet, ilgili ürünün hedefi ve kişiselleştirmesi, iletişim ve Türkiye adresi alınır. Bireysel/kurumsal fatura alanları muhasebecinin doğruladığı gerekliliklere göre gösterilir; gereksiz kimlik verisi istenmez.
2. Form ve Worker aynı kuralları uygular: tür/uzunluk sınırları, gerekli alanlar, güvenli http/https bağlantıları, NFC-only/static, menü hizmeti, adres ülkesi ve adet sınırı. IBAN ve diğer ürüne özel bilgiler kendi kurallarıyla doğrulanır. Genel JSON'u doğrulamadan kaydetmek kabul edilmez.
3. Worker fiyat/indirim/kargo kurallarını kendisi okur; kullanıcıdan gelen toplamı kabul etmez. Eksik fiyat veya kargo tarifesinde sipariş/ödeme engellenir. Tek işlem ve benzersiz istek anahtarı yinelenen siparişi önler. Kötüye kullanım için oran sınırlaması gerekir.
4. Misafir takibi sipariş numarası/e-posta kombinasyonuyla herkese açık arama değildir. E-postaya gönderilecek, rastgele en az 256 bit, süreli ve iptal edilebilir erişim anahtarının yalnız hash'i özel alanda saklanmalı. URL anahtarı log/analiz/referrer'a sızmamalı; aynı origin güvenli oturuma çevrilmeli. E-posta doğrulaması ve gönderim hizmeti hazırlanmadan bu akış açılmaz.
5. Üyelikli müşteri için doğrulanmış kullanıcı kimliğiyle yalnız kendine ait siparişler döndürülür. Misafir siparişi kullanıcıya yalnız e-posta benzerliğiyle otomatik bağlanmaz; sahiplik doğrulanır.

## Anahtarlar ve doğrulama

`SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` yalnız yerelde `.env.local`, Cloudflare'da Builds değişkenleridir. Publishable anahtar gizli değildir ve sadece RLS/grant yetkilerini kullanabilir; yine de bu uygulamada tarayıcı paketine veya depoya eklenmez. `sb_secret_`, legacy `service_role`, veritabanı parolası veya yönetim token'ı bu bağlantıda kullanılmaz. Senkronizasyon kodu publishable dışındaki anahtarları reddeder.

- Migration: `supabase/migrations/202611150001_preview_foundation.sql`.
- Ek adres kısıtı: `supabase/migrations/202611150002_shipping_country_guard.sql`; Türkiye ülke alanı JSON null/boş olamaz.
- Seed üretimi: `node scripts/generate-supabase-seed.mjs`; çıktı `supabase/seed.sql`.
- Gerçek veritabanı güvenlik testi: `supabase/tests/security.sql`; geçici değişiklikleri ROLLBACK ile geri alır.
- Testler: anon/authenticated rolünde özel sipariş okuma ve katalog değiştirme reddi, gizli ürün filtresi, yönetici yetkisi yükseltme reddi, negatif fiyat ve satış açma engeli.
- Tarayıcıya ulaşan dosyalarda, staged Git dosyalarında ve yayın günlüğünde gizli anahtar bulunmadığı ayrıca kontrol edilir.

## Uygulama sonucu

Her iki migration gerçek nfchane projesine uygulandı, yedi ürün kaydedildi. Güvenlik sorgusu anon/authenticated erişim reddini, gizli ürün filtresini, geçici misafir siparişini, Türkiye adres kısıtını ve NFC-only/static kuralını doğrular; test kayıtları ROLLBACK ile kalıcı bırakılmaz. HTTP üzerinden orders/order_items/admin_members erişimleri 404, private şema isteği 406 ile reddedildi. Genel katalog yedi ürünü, NULL fiyatları ve kapalı satın alma durumunu döndürdü.

Yerel ve yayın kopyasında 26 test ve Supabase bağlantılı derleme geçti. Cloudflare Builds değişkenleri kaydedildi ve GitHub main dalına gönderilen ilk entegrasyon otomatik yayımlandı. Canlı Google ürün sayfası, NFC seçimi, doğru fotoğraflı sepet ve kapalı ödeme kontrol edildi. Yeni hesap veya sipariş alma arayüzü açılmadı.

Kaynaklar: https://supabase.com/docs/guides/api/securing-your-api ; https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/getting-started/api-keys .
