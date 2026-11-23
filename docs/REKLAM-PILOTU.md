# Google Yorum Kartı reklam pilotu

Doğrudan hedef sayfa `https://nfchane.com/urun/google-yorum-karti/`. Örnek bağlantı `https://nfchane.com/urun/google-yorum-karti/?utm_source=google&utm_medium=cpc&utm_campaign=google-yorum-pilot`. Parametrelerde kişisel veri kullanmayın. Canonical adres kampanya parametrelerini içermez. Eski Worker adresi ve www, yol ile sorguyu korur. Eski `#urun/google` rotası da sorguyu ürün sayfasına taşır.

Mevcut NFCHane tipografisi, yeşil düğmesi ve onaylı ürün fotoğrafı kullanılır. Mobilde başlık, kartın işlevi, okutma seçenekleri ve seçeneklere geçiş fotoğrafla birlikte öne alınır. Aynı fotoğraf ürün seçimiyle güncellenir. Önizlemede gerçek fiyat, kargo ve satın alma gösterilmez.

| Olay | Kaynak ve koşul | Durum |
| --- | --- | --- |
| Ürün görüntüleme | Doğrudan Google Yorum Kartı sayfasının ilk açılışı | Yerel `product_view`, preview |
| Sepete ekleme | Geçerli seçim sepete başarıyla eklendiğinde | Yerel `cart_add`, preview |
| Ödemeye başlama | Gerçek sipariş ve tutar sunucuda doğrulandıktan sonra, ödeme oturumu başarıyla oluşturulduğunda | Satış açılışına bağlı |
| Satın alma | PayTR bildiriminin imzası, sipariş kimliği ve tutarı sunucuda doğrulanıp ödeme ilk kez onaylandı olarak kaydedildiğinde | PayTR ve gerçek sipariş altyapısına bağlı |

Yerel olaylar `nfchane:storefront` olarak yalnızca sayfa içinde oluşur. Olaylarda ürün kimliği, önizleme durumu ve sepete ekleme için yöntem ile adet vardır. Olaylar saklanmaz ve ağ üzerinden gönderilmez. Mevcut önizleme sepeti kendi oturum depolamasını kullanır. Analitik etiketi veya reklam pikseli eklenmedi. Sağlayıcı seçilene ve tercih koşulları tamamlanana kadar UTM yalnızca URL'de taşınır. Ödeme dönüş ekranı ve test siparişleri satın alma kaynağı olarak kullanılmaz. Sunucu satın alma kaydında tekrarlı bildirimler aynı sipariş için tek olaya indirilmeli.

Satış açılırken

1. Ürün fiyatını, kargoyu, tahmini teslimatı, QR güncelleme koşullarını ve satıcı bilgilerini doğrulayın.
2. Mobilde doğrudan ürün bağlantısından gerçek sepet ve ödeme akışını deneyin. Satış açıldığında ürün seçiminin ardından net bir satın alma eylemi gösterin.
3. Analitik sağlayıcısı ve çerez tercihleri onaylanınca kampanya ölçümünü bağlayın. Önizleme olaylarını reklam dönüşümlerinden çıkarın.
4. Başarılı, başarısız ve tekrarlanan ödeme bildirimlerini kontrol edin. Gerçek satın almanın bir kez sayıldığını doğrulayın ve reklamı bundan sonra başlatın.
