# NFCHane yönetim ve sipariş hazırlığı — 15 Kasım 2026

## Ekranlar

- `/yonetim/`: yetkili e-postaya PKCE giriş bağlantısı; sipariş özeti/son 100 kayıt/durum filtresi/detay ve geçmiş, ürün metni/temel fiyat düzenleme, son siparişlerdeki müşteri listesi, manuel kargo ve fatura kaydı.
- `/hesabim/`: giriş, kayıt, parola yenileme ve belirgin “Üye olmadan devam et”. E-posta hizmeti ve nihai veri işleme metinleri hazır olana kadar müşteri kayıt/giriş API'si `CUSTOMER_AUTH_ENABLED=false` ile kapalıdır. Ekranlar hazırlanmış, başarı taklidi yapılmaz. Yönetici e-postası proje ekibinde olduğundan Supabase'in mevcut sınırlı e-posta hizmetiyle test edilebilir; genel müşteri gönderimi değildir.
- `/siparis/`: seçili her ürün için işletme adı, uygun hedef/IBAN/menü notları, iletişim, Türkiye adresi ve bireysel/kurumsal fatura alanları. `/siparis/?misafir=1` hesap açmadan devam yoludur. Yalnız giriş yapmış yönetici test kaydı gönderebilir.
- `/siparis-takibi/`: rastgele takip anahtarı, SHA-256 özel depolama, 30 gün süre ve şimdilik yönetici zorunluluğu. Sonuçta adres/e-posta/fatura bilgisi verilmez. Anahtar URL fragmentinden okunup adres çubuğundan temizlenir.

## Güvenlik ve sunucu

`worker/index.js` /api/* isteklerini işler; geri kalan statik dosyalar ASSETS tarafından sunulur. wrangler.jsonc ve mevcut Cloudflare build/deploy komutu kullanılır. Statik ziyaretler Worker çalıştırmak zorunda değildir. Yeni ücretli servis veya bağımlılık yoktur.

- Supabase publishable key + kullanıcı JWT'si; servis/secret anahtarı kullanılmaz.
- E-posta hesabı kullanıcı tarafından onaylandı; gerçek adres yalnız özel allowlist ve Cloudflare runtime değişkeninde saklanır, kaynak depoya eklenmez.
- Yönetici yetkisi doğrulanmış Auth kullanıcı kimliği ve gerçek auth.users e-postasıyla denetlenir. Tarayıcı rolü veya JWT içindeki kullanıcı tarafından değiştirilebilir metadata esas alınmaz. public.admin_* RPC'ler SECURITY DEFINER olsa da her işlemde özel kimlik kontrolü yapar; anon execute yetkisi yoktur.
- public.customer_orders yalnız doğrulanmış auth.uid() sahibinin kayıtlarını döndürür. Misafir kayıtları sırf e-posta eşleşmesiyle hesaba bağlanmaz.
- HttpOnly/Secure/SameSite=Lax ve __Host- önekli oturum çerezleri; PKCE, sabit izinli geri dönüş adresi, aynı origin kontrolü, JSON ve 48 KB sınırı, hassas yanıtlarda no-store/no-referrer.
- Ortak `worker/validation.js` hem formda hem Worker'da çalışır. Tutar/rol/user_id gibi istemci alanları kabul edilmez. NFC-only/static, sabit 10 cm, adet, URL, IBAN checksum, fatura ve iletişim alanları doğrulanır.
- private.orders yalnız is_test=true kabul eder. Gerçek /api/orders ve /api/payments koşulsuz 423 döndürür. Fiyat girilmesi veya ortam bayrağı bunları açmaz. Kargo kesinleşmediği için pricing_complete=false; test kalemlerinin fiyatı veritabanından kopyalanır, toplam ödenecek bedel diye sunulmaz.
- Benzersiz request_key, transaction advisory lock ve payload fingerprint aynı işlemi tek kayda indirir. Farklı içerikle tekrar 409 olur. Durum ve yönetim hareketleri özel audit tablolarına yazılır; kişisel form verisi günlüklenmez.

## Ayarlar

Cloudflare runtime: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ADMIN_LOGIN_EMAIL. Kaynaktaki APP_ORIGIN mevcut Cloudflare adresidir. keep_vars runtime değerlerini sonraki yayında korur. CUSTOMER_AUTH_ENABLED varsayılan false kalır; doğru müşteri e-posta hizmeti ve hukuki metinler olmadan açılmamalı. Domain değişiminde APP_ORIGIN ve Supabase Site URL/redirect allowlist birlikte güncellenir.

Supabase redirect: `https://nfchane.colves.workers.dev/api/auth/callback`. Giriş e-postası aynı tarayıcıda açılmalı; PKCE başka tarayıcıdaki bağlantıyı kabul etmez. Yönetici ilk e-posta girişini kendi tamamlar; asistan parola veya e-postadaki giriş anahtarını okumaz.

## Tasarım dayanakları

Mevcut tasarım ana referanstır. NN/g hiyerarşi/renk tutarlılığı, Baymard açık maliyet ve belirgin misafir devamı; proje kitap notlarındaki açık mesaj/gerçek kanıt ilkeleri korunur. Kayıt zorlanmaz, sahte satış/ödeme onayı yoktur. Dört kısa form grubu, mobil tek sütun ve 44 px hedefler; 140–180 ms durum/tab geçişleri, odakta hafif vurgu, işlem bekleme geri bildirimi. prefers-reduced-motion hareketleri kapatır. Kitapların tam metinleri okunmuş sayılmaz; önceki araştırma notları esas alınır.

## Test ve sonraki adımlar

Node doğrulama/API testleri ve SQL rollback testleri: anon/nonadmin erişim reddi, e-posta iddiası taklidi, idempotency, veritabanı fiyatı, test durum/kargo/takip, üye sipariş sahipliği. Geçici Auth/test siparişleri kalıcı bırakılmaz. Worker dry-run ve Vite build ayrıca kontrol edilir.

Satış öncesi: gerçek fiyat/kargo tarifesi, PayTR hesap/test anahtarları ve ödeme bildirimleri, müşteri SMTP, onaylı işletme/hukuki metinler, gerçek sipariş aktivasyonuna özel migration ve yedekleme/geri dönüş kontrolü gerekir. E-posta gönderimli genel misafir takibi, dosya yükleme, otomatik kargo/fatura ve çoklu ürün fiyat kuralları bu sürümde aktif değildir. Bu hazırlık sistemi tek başına canlı satışa uygunluk onayı değildir.
