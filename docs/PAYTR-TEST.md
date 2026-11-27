# NFCHane PayTR test kurulumu

NFCHane yönetimindeki PayTR testi örnek bir misafir işlemi açar. Tutar sunucuda 10,00 TL test bedeli olarak belirlenir. PayTR isteği daima test modu ve taksitsiz TRY kart ödemesiyle imzalanır. Test kaydı mağaza siparişlerinden ayrı saklanır; hazırlama, fatura ve kargo başlatmaz.

1. PayTR Mağaza Paneli → Destek & Kurulum → Entegrasyon Bilgileri ekranından mağaza numarası, mağaza anahtarı ve mağaza tuzu alınır.
2. Cloudflare → Workers & Pages → nfchane → Settings → Variables and Secrets bölümünde `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT` ve sahibi tarafından seçilen `PAYTR_TEST_BUYER_EMAIL` eklenir. Anahtar ve tuz **Secret** türünde kaydedilir. Test için yalnız işletmenin yetkili test e-posta adresi kullanılır. Anahtarları Git, tarayıcı kodu veya sohbet üzerinden paylaşmayın.
3. PayTR Mağaza Paneli → Destek & Kurulum → Ayarlar → Bildirim URL alanı `https://nfchane.com/api/paytr/test/callback` ile eşleştirilir. Bu uç yalnız NFCHane test referanslarını kabul eder.
4. [NFCHane yönetiminde](https://nfchane.com/yonetim/) **PayTR testi** bölümünden yeni test başlatılır. PayTR ekranının test modunu gösterdiği kontrol edilir ve sağlayıcının hazır test kartı kullanılır. İşlem sonrasında **Sonucu kontrol et** düğmesiyle imzalı bildirim sonucu okunur. Tarayıcı dönüşü ödeme durumu sayılmaz.

Bildirim imzası doğrulandıktan sonra aynı referansa ait ilk geçerli sonuç kaydedilir. Tekrar gelen aynı sonuç `OK` alır. Farklı sonuç, yanlış tutar ve test modu uyuşmazlığında kayıt değişmez. Test kayıtları 30 gün sonra silinir. Gerçek mağaza ödeme ve sipariş uçları kilitlidir.

PayTR ön incelemesi için İletişim, Hakkımızda, resmî satıcı adresi, teslimat, kargo, satış ve iptal/iade metinleri kontrol edilir. Kamuya açık örnek menü ve IBAN gösterimi gibi demo içeriklerinin inceleme öncesi kaldırılması veya PayTR ile netleştirilmesi gerekir. Gerçek ürün tanıtımları ve eğitici rehberler bu test altyapısının parçası değildir.

[PayTR iFrame API 1. Adım](https://dev.paytr.com/iframe-api/iframe-api-1-adim) · [PayTR iFrame API 2. Adım](https://dev.paytr.com/iframe-api/iframe-api-2-adim)
