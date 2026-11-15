# nfchane — yardım ve bilgi sayfaları

15 Kasım 2026. Supabase kurulumu ve marka adı değişikliği başka sohbetlerde sürerken, üyelikten bağımsız ön yüz hazırlığı yapıldı. Üyelik, veritabanı, sunucu ayarları veya ödeme değiştirilmedi.

## Sayfalar

- `/bilgi/`: sade bağlantı listesi.
- `/bilgi/iletisim/`: mevcut WhatsApp numarası; mesajı kullanıcı gönderir. Yeni kişisel veri formu yok.
- `/bilgi/teslimat-iade/`: Türkiye kapsamı; Sakarya/Kütahya olasılığı. Ücret, firma, süre ve kesin iade koşulu uydurulmadı.
- `/bilgi/gizlilik/`, `/bilgi/kvkk/`, `/bilgi/cerez/`, `/bilgi/mesafeli-satis/`, `/bilgi/on-bilgilendirme/`: nihai hukuki metin değil, hazırlık ve onay bekleyen alanlar. Kabul kutusu veya sözleşme oluşturma yok.

Ana sayfa ve üretilen ürün sayfalarının alt menüsünde yardım merkezi, teslimat/iade ve iletişim bağlantıları bulunur. Mevcut ürün görselleri, boyutlar, fiyatlar, sepet ve satın alma davranışı korunur. Yeni sayfalarda nfchane adı kullanılır; mevcut depodaki eşzamanlı marka değişikliği bu çalışmaya ait değildir.

## Kaynak ve yayın

İçerik: `src/info-pages.js`. Görünüm: `src/info.css`. HTML giriş noktası: `bilgi/index.html`. Vite geliştirme yönlendirmesi ve statik HTML üretimi ortak `scripts/info-html.mjs` kullanır. `npm run build` artık yedi bilgi alt sayfasını da üretir. Domain kökü ve `/nfcshop/` gibi depo önekleri için göreli bağlantılar korunur. JavaScript kapalıyken de içerik ve bağlantılar çalışır. Yeni servis veya bağımlılık eklenmedi.

Bu çalışma yerel olarak hazırlandı ve test edildi; bu sohbetten commit, push veya canlı dağıtım yapılmadı. Diğer sohbetlerin eşzamanlı değişiklikleri topluca commit edilmemeli.

## Doğrulama

- Mevcut 19 test ve yeni 4 test: 23/23 geçti.
- `npm run build` başarılı.
- Üretilmiş 10 sayfadaki 187 yerel bağlantı/varlık hedefi dosya sisteminde bulundu.
- Tarayıcıda yardım merkezinden teslimat sayfasına, oradan iletişime geçiş doğrulandı.
- Teslimat ve KVKK sayfaları 360 px genişlikte yatay taşma olmadan kontrol edildi.
- Nihai metin olmadığı uyarısı görünür. Gerçek WhatsApp mesajı gönderilmedi.

## Gerçek satıştan önce

İşletme unvanı/adres/e-posta, kargo tarifesi ve hazırlık süresi tamamlanmalı. Üyelik ve ödeme bağlandıktan sonra gizlilik/çerez açıklamaları gerçek veri akışına göre güncellenmeli. Hukuk danışmanı onaylı metinler ve siparişe özel ön bilgilendirme/sözleşme sürüm kaydı ayrı geliştirme aşamasıdır. Bu sayfalar hukuki uygunluğun tamamlandığı anlamına gelmez.
