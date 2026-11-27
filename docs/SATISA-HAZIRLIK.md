# NFCHane satış belgeleri — iç inceleme taslağı

**Onay bekliyor.** Açılış tarihi işletme hazırlıklarına bağlı. Köşeli parantezler resmî belge veya danışman teyidi gereken alanları gösterir.

## Metin ve yerleşim

| Metin | Yer | Taslak içerik |
| --- | --- | --- |
| İşletme bilgileri | Alt menü ve iletişim | NFCHane mağaza markasıdır. Satıcı [resmî unvan], [yayımlanacak kayıt bilgileri], [adres], [iş telefonu], [destek e-postası] ve [KEP]. |
| Ön bilgilendirme | Sepet özeti ve son ödeme adımı | [Satıcı], [ürün özellikleri ve adet], [vergiler, kargo ve diğer ücretler dahil toplam], [ödeme ve teslimat], [iade taşıyıcısı, cayma kanalı ve örnek form], [uyuşmazlık yolu], [dinamik QR süresi ve koşulları]. |
| Mesafeli satış sözleşmesi | Ödeme öncesi ve sipariş e-postası | [Taraflar], [sipariş anındaki ürünler, toplam, ödeme ve teslimat], [satır bazında cayma ve istisna], [ayıplı mal hakları, iptal/iade, uyuşmazlık]. Ön bilgilendirme teyidi ve sözleşme kabulünü ayrı kaydet. Son düğmede ödeme yükümlülüğü açıkça belirtilir. |
| Teslimat, iptal ve iade | Alt menü, ürün ve sipariş | Tüketici işlemlerinde standart ve kalıcı kişisel baskısız sıfırlanabilir kart için 14 günlük cayma süresi. Kişiye özel kalıcı QR, logo, isim veya tasarım baskısı kalem bazında incelenir. Ayıplı, yanlış, hasarlı veya çalışmayan üründe yasal haklar saklıdır. [Taşıyıcı, masraf, başvuru, sevk ve iade süresi], [ticari alımlar] teyit edilir. |
| KVKK aydınlatması | İletişim, hesap ve siparişte veri alınırken | [Veri sorumlusu], [veri kategorileri, amaçlar ve hukuki sebepler], [toplama, aktarım ve alıcı grupları], [haklar ve başvuru]. Aydınlatma, varsa açık rıza ve ticari ileti izni ayrı süreçlerdir. [Yurt dışı aktarımı] incelenecek. |
| Gizlilik ve çerez | Alt menü | Var olan oturum çerezleri ve sepet depolaması için [adı, amacı, süresi ve sağlayıcısı]. [Erişim, saklama, silme ve başvuru kanalı]. |
| Üyelik | Kayıt formu ve yardım | [Hesap koşulları, e-posta doğrulama, destek ve kapatma], misafir alışverişi, [uyuşmazlık ve koşul değişikliği bildirimi]. |

Vergi levhası, işletme IBAN’ı ve şahsi kimlik bilgileri herkese açık sayfaya konmaz. Yayımlanması gereken ticari kayıt bilgilerini doğrula.

## Sipariş, ödeme ve Mikrogrup

1. Önizleme verilerinden fiyat, KDV veya kargo varsayma. Canlı aşamada güvenilir varyant kaydından seçeneği ve üretim biçimini çöz. NFC/QR veya sabit/dinamik seçimi tek başına cayma istisnası oluşturmaz.
2. Onay anında sunucu toplamı ve onaylı metinleri yeniden hesaplar. Özet değişirse kullanıcı tekrar inceleyip onaylar. Siparişle birlikte metnin tam içeriğini, sürümünü ve onay zamanını kaydet. Aynı kayıt e-posta ekini oluşturur. [Doğrulanmış gönderici ve sağlayıcı] belirlendiğinde saklanabilir belgeyi ilet ve sağlayıcı referansını kaydet. Genel sayfa bağlantısı tek başına teslim sayılmaz.
3. PayTR işlemi, sunucuda kaydedilmiş işlem kimliği ve tutar ile eşleştirilir. Başlangıç varsayımı TRY ve taksitsiz kart. İmzayı ve tahsilat tutarını doğrula. Tarayıcı dönüşü ödeme kanıtı sayılmaz. Başarılı bildirim, ödeme ve e-posta kuyruğu tek veritabanı işleminde işlenir. Aynı bildirim tekrar gelince ikinci işlem oluşturulmaz. [Test hesabı ve sağlayıcı yapılandırması] tamamlandıktan sonra gerçek simülasyon yapılır.
4. Doğrulanmış gerçek ödeme sonrası alıcının e-Fatura statüsünü Mikrogrup e-Portal’da teyit et. Fatura adresi, satış bedeli, KDV, ödeme şekli ve tarihi, mağaza adresi, taşıyıcı unvanı ve gereken vergi bilgisi, sevk tarihi, belge numarası ve tarihini kontrol et. Ödeme komisyonu ayrıca izlenir. TCKN, yükümlülük ve alan gereksinimi doğrulanana kadar istenmez.
5. Satış öncesi [resmî satıcı belgeleri ve muhasebecinin belirlediği 47.78.04 faaliyet kaydının teyidi], [ürün KDV’si], [KEP ve ETBİS], [PayTR], [kargo ve dinamik QR şartları], [avukat onaylı metinler], [e-posta teslimi] ve [muhasebeciyle Mikrogrup alanları] tamamlanır.

## Resmî kaynaklar

- [Ticaret Bakanlığı — Mesafeli Sözleşmeler Yönetmeliği](https://tuketici.ticaret.gov.tr/data/5e819a8e13b876a1b04c7a4a/Mesafeli%20S%C3%B6zle%C5%9Fmeler%20Y%C3%B6netmeli%C4%9Fi.pdf)
- [Resmî Gazete — 24 Mayıs 2025 değişikliği](https://www.resmigazete.gov.tr/eskiler/2025/05/20250524-2.htm)
- [KVKK — Aydınlatma ve açık rızanın ayrı düzenlenmesi](https://www.kvkk.gov.tr/Icerik/8710/veri-sorumlulari-tarafindan-acik-riza-ve-aydinlatma-metinlerinin-ayri-ayri-duzenlenmesi-gerektigi-hakkinda-kisisel-verileri-koruma-kurulunun-18-02-2026-tarihli-ve-2026-347-sayili-ilke-kararina-iliskin-kamuoyu-duyurusu)
- [GİB — e-Arşiv Teknik Kılavuzu](https://ebelge.gib.gov.tr/dosyalar/kilavuzlar/e-Arsiv_Teknik_Kilavuzu_V.1.18.pdf)
- [PayTR — iFrame API ödeme bildirimi](https://dev.paytr.com/iframe-api/iframe-api-2-adim)
