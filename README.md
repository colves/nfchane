# NFCHane

NFC ve QR kartları için Türkçe, mobil uyumlu **tasarım ve arayüz geliştirme önizlemesi**. Bu sürümde ticari işlem, sipariş veya ödeme alınmaz. Güncel yayın https://nfchane.colves.workers.dev/ adresindedir. Eski https://colves.github.io/nfcshop/ yönlendirmesi basılı QR bağlantıları için korunmalıdır.

## Çalıştırma

Node.js 20.19+ veya 22.12+ gerekir.

```sh
npm ci
npm run dev
```

Yerel adres: http://127.0.0.1:5174/

```sh
npm test
npm run build
npm run build:pages
```

`build` çıktısı `dist/` klasöründedir; Cloudflare GitHub `main` dalından derleyip bu çıktıyı yayımlar. Eski `build:pages` komutu yalnız arşiv önizlemesi içindir; eski QR yönlendirmesinin üzerine bu çıktıyı yayımlamayın. Göreli dosya yolları alt dizinleri de destekler. Derleme çıktıları elle düzenlenmez.

## Supabase başlangıç bağlantısı

Ürün kataloğu yayın hazırlanırken Supabase'ten okunur; ziyaretçi başına veritabanı isteği yoktur. `.env.example` dosyasındaki iki genel bağlantı ayarını yerelde `.env.local`, Cloudflare'da Builds değişkenleri olarak tanımlayın. Gizli veya service-role anahtarı kullanmayın. Ayarlar yoksa paketli katalog kullanılır; ayarlar mevcutken geçersiz yanıt yeni yayını engeller. Ürün metni değişiklikleri yeniden derlemede görünür. Satın alma ve fiyat gösterimi kapalı kalır.

Sipariş/kişisel bilgi tabloları tarayıcıya kapalı özel şemadadır. Üyelikli ve misafir siparişleri için veri temeli hazırdır; sipariş kabulü, yönetim paneli ve ödeme henüz uygulanmamıştır. Şema, erişim kuralları ve sonraki aşamalar: [Supabase altyapısı](docs/SUPABASE-ALTYAPI.md).

## Hazır olanlar
- Yedi ürün, kategori filtreleri ve her ürün için ayrı HTML adresi (`urun/google-yorum-karti/`). Eski ürün hash bağlantıları yeni sayfaya yönlenir.
- QR+NFC, yalnız NFC, yalnız QR; sabit/değiştirilebilir bağlantı seçimi ve adet.
- 5×5–15×15cm boyut seçimi, şeffaf/beyaz pleksi seçimi; varyantları ayrı tutan ve sekme oturumunda korunan önizleme sepeti.
- Menünün dört türü; PDF/web tasarımında teklif iletişimi akışı.
- Kapalı satın alma düğmeleri ve “Fiyat henüz girilmedi” gösterimi. Ödeme alanı yoktur.
- Klavye, native dialog odak yönetimi, Escape, mobil menü, reduced-motion ve responsive yerleşim.
- Temsili kartlar ve örnek QR. Gerçek fotoğraflar ve ürün tasarımları bekleniyor.

## İçerik ve yapı
- `src/shop.js`: ürünler, seçenekler, sepet kuralları. Fiyatlar bilinçli olarak `null`.
- `src/main.js`: etkileşimler ve temsili kartlar; gerçek yönlendirme veya ödeme servisi değildir.
- `ornek/iban/index.html`, `src/account-demo.js`: kart okutulunca açılacak hesap sayfasının gerçek hesap içermeyen bağımsız örneği.
- `src/product-pages.js`: hizmete özel sayfa içerikleri; derlemede yedi bağımsız sayfa üretilir.
- `src/style.css`: tasarım sistemi ve ekran boyutlarına uyarlamalar.
- [Kaynaklar ve tasarım kararları](docs/TASARIM-KARARLARI.md)
- [Tamamlanacak bilgiler ve satışa geçiş](docs/TAMAMLANACAKLAR.md)

## Önemli sınırlar
WhatsApp düğmesi ürün seçimini içeren mesaj taslağına yönlendirir; mesajı ziyaretçi kendisi gönderir. Fiyat, müşteri yorumu veya sipariş başarısı uydurulmaz. PDF yükleme/bağlantı toplama ve ödeme, gerçek sunucu ile ticari koşullar hazırlanınca eklenmelidir. Dinamik bağlantı hizmeti için kendi kalıcı alan adı kullanılmalıdır.

Manrope açık lisanslı yazı tipi yerel derlemeye dahildir; font CDN isteği yapılmaz. Yedek Arial/sans-serif vardır. Analitik, reklam pikseli ve takip çerezi eklenmedi.
