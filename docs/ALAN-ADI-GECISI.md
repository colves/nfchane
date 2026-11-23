# NFCHane alan adı geçişi — 23 Kasım 2026

Birincil adres `https://nfchane.com/`. Yeni site veya Worker oluşturulmadı; alan adı mevcut `nfchane` Worker'ına Custom Domain olarak bağlandı. Wrangler routes tanımı sonraki yayınlarda bu bağlantıyı korur. Workers.dev erişimi açık kalır.

## Cloudflare

- `www` için proxied CNAME → `nfchane.com`.
- Ücretsiz Single Redirect: `http*://www.nfchane.com/*` → `https://nfchane.com/${2}`, 301, preserve query string açık. HTTP ve HTTPS, ürün yolu ve çoklu sorgu ile doğrulandı.
- Always Use HTTPS açık; ücretsiz Universal SSL aktif. Ücretli ACM veya başka bir plan açılmadı.
- APP_ORIGIN yeni kök adres; LEGACY_APP_ORIGIN eski workers.dev adresi. Giriş isteği ve PKCE callback aynı hostta kalır; cross-origin POST reddedilir. Yeni alan adında eski hostun çerezi bulunmadığından yeniden giriş gerekir. Çerezler domainler arasında taşınmaz.
- Statik sayfalarda canonical yeni alan adına yönelir; noindex/nofollow önizleme kararı korunur. Logo bağlantıları göreli köke gider; gerçek bölüm bağlantıları korunur.

## Supabase

- Ücretsiz proje duraklatılmış bulundu, mevcut verilerle Resume edildi; Healthy ve 7 ürünle build doğrulandı.
- Auth Site URL `https://nfchane.com`; tam callback izinleri yeni ve eski host için `/api/auth/callback` olarak korunur. Wildcard izin açılmaz.
- Mevcut yönetici Auth kaydı doğrulandı. Allow new users to sign up kapalı; e-posta doğrulama açık. Yönetici OTP `create_user:false` kullanır; yeni hesap yaratmaz. CUSTOMER_AUTH_ENABLED false, gerçek sipariş ve ödeme kilitleri korunur.
- Genel müşteri SMTP bu geçişin parçası değildir ve henüz kurulmadı. Dahili e-posta gönderim sınırı sürer.

## Savunma düzeltmeleri

- Ürün title/meta açıklaması bağlama uygun kaçış ve literal replace callback kullanır.
- Statik varlıklarda `_headers` ile nosniff, DENY, CSP eklenir. Mevcut satır içi stiller için yalnız style-src unsafe-inline gerekir; script-src self, frame/object kapalı, form/connect aynı origin. PayTR henüz kapalı; gelecekte iFrame açılırken CSP yeniden değerlendirilmeli.
- Yönetici girişine Worker Rate Limiting binding eklendi: e-posta SHA-256 anahtarıyla konum başına yaklaşık 1 istek/60 saniye; iki hostname aynı sayacı kullanır. Gizli e-posta sayaca yazılmaz. Bu küresel kesin kota değildir, dağıtık kötüye kullanımı tek başına engellemez; Supabase'in kendi kotaları da korunur. Ücretsiz Worker planı değişmez.

## Eski QR uyumu ve sınırlar

Eski `https://colves.github.io/nfcshop/` sayfası halen workers.dev adresine gider; o adres ve ürünleri çalışır. Eski basılı QR görselleri ve Pages yönlendirmesi değiştirilmedi. Domain değişikliği gerçek dinamik QR hizmeti kurmaz.

DNS/HTTPS, www yolu/sorgusu, ana sayfa, ürün ve hesap/yönetici kabukları kontrol edilir. Mobil kontrol tarayıcı emülasyonudur; gerçek mobil operatör bağlantısı ölçülmüş sayılmaz. E-posta bağlantısının gerçek giriş sonucunu hesap sahibi doğrular; asistan bağlantı/kod okumaz.

Geri dönüş: önceki Worker sürümü yayımlanabilir; workers.dev ve eski callback izni yerinde kalır. Veritabanı şeması bu geçişte değiştirilmez. Ücretsiz Supabase tekrar uyursa yönetim/derleme etkilenebilir; otomatik yapay trafik veya ücretli plan açılmadı.
