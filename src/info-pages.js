// Public preview information only: no customer records or unapproved contract text.
export const infoPages = {
  iletisim: {
    title: 'İletişim', label: 'Birlikte netleştirelim.',
    intro: 'Kart seçimi, menü tasarımı ve adetli alım hakkında bize yazabilirsiniz.',
    sections: [
      ['WhatsApp ile görüşün', 'İletişim numaramız +90 551 195 63 12. Bağlantı WhatsApp’ı açar; mesajı kontrol edip kendiniz gönderirsiniz.'],
      ['Daha hızlı yardımcı olabilmemiz için', 'İlgilendiğiniz kartı, yaklaşık adedi ve hazır bir bağlantınız olup olmadığını belirtmeniz yeterli. Özel tasarım düşünüyorsanız ihtiyacınızı kısaca anlatabilirsiniz.'],
      ['İşletme iletişim bilgileri', 'Satıcı unvanı, işletme adresi ve destek e-posta adresi satış başlamadan önce bu sayfaya eklenecek. Yanıt süresi henüz belirlenmedi.'],
    ],
  },
  'teslimat-iade': {
    title: 'Teslimat ve iade', label: 'Siparişten önce bilmeniz gerekenler.',
    intro: 'Kargo ve üretim koşulları hazırlanıyor. Şu anda sipariş veya ödeme alınmıyor.',
    sections: [
      ['Gönderim kapsamı', 'Başlangıçta yalnızca Türkiye’ye gönderim planlanıyor. Gönderiler Sakarya veya Kütahya’dan çıkabilir.'],
      ['Kargo ücreti ve teslim süresi', 'Kargo firması, ücret ve hazırlık süresi henüz belirlenmedi. Bu bilgiler satış başlamadan önce açıklanacak; kargo bedeli ödeme öncesinde gösterilecek. Şu an ücretsiz kargo veya belirli bir teslim günü taahhüdü yok.'],
      ['Size özel tasarım', 'Kişiselleştirme gerektiren ürünlerde son tasarımın üretimden önce onayınıza sunulması planlanıyor. Tasarım hazırlığı ile kargo süresi ayrı ayrı belirtilecek.'],
      ['İptal, iade ve hasarlı ürün', 'Başvuru kanalı, süreç ve ürün türüne göre uygulanacak koşullar işletme ve hukuk danışmanı onayından sonra yayımlanacak. Bu sayfa henüz kesinleşmiş iade politikası değildir.'],
    ],
  },
  gizlilik: {
    title: 'Gizlilik politikası', label: 'Bilgileriniz hakkında açık bilgi.', legal: true,
    intro: 'Üyelik ve sipariş sistemi kurulurken veri işleme süreçleri de netleştiriliyor. Bu sayfa hazırlık durumunu gösterir; nihai politika değildir.',
    sections: [
      ['Mevcut önizleme', 'Mevcut önizleme sepeti seçimlerinizi tarayıcınızın oturum alanında tutar. Bu seçimler gerçek sipariş oluşturmaz. WhatsApp bağlantısı kullanıldığında WhatsApp’ın kendi hizmet ve gizlilik koşulları geçerlidir.'],
      ['Üyelik ve sipariş bilgileri', 'Üyelik, adres, sipariş ve fatura bilgilerinin hangi amaçlarla, kimlerle ve ne kadar süreyle işleneceği gerçek altyapı ve işletme süreçlerine göre açıklanacak.'],
      ['Yayımdan önce tamamlanacak', 'Veri sorumlusu bilgileri, kullanılan hizmet sağlayıcılar, saklama süreleri, aktarım süreçleri ve başvuru kanalı işletme ve hukuk danışmanı tarafından doğrulanacak.'],
    ],
  },
  kvkk: {
    title: 'KVKK aydınlatma metni', label: 'Veri işleme süreçleri netleşiyor.', legal: true,
    intro: 'Veri sorumlusuna ve gerçek işleyişe özel aydınlatma metni hazırlanacak. Şu an onaylanmış bir hukuki metin yayımlanmıyor.',
    sections: [
      ['Veri sorumlusu', 'İşletmenin ticari unvanı, adresi ve kişisel veri başvuru kanalı henüz bu sayfaya eklenmedi.'],
      ['Açıklanacak süreçler', 'Üyelik, iletişim, sipariş, teslimat ve faturalandırma için işlenen veri kategorileri, amaçlar, hukuki sebepler, toplama yöntemleri ve alıcı grupları gerçek sisteme göre belirtilecek.'],
      ['Danışman onayı gereken alanlar', 'İlgili kişi hakları ve başvuru yöntemi, saklama ve silme kuralları ile yurt dışı hizmet sağlayıcılarının kullanımı hukuk danışmanıyla değerlendirilecek.'],
    ],
  },
  cerez: {
    title: 'Çerez ve tarayıcı depolama', label: 'Tarayıcınızda neler tutuluyor?', legal: true,
    intro: 'Mevcut önizlemenin tarayıcı depolamasını ve üyelikle birlikte tamamlanacak bilgilendirmeyi burada açıklıyoruz.',
    sections: [
      ['Önizleme sepeti', 'Sepet seçimleri sessionStorage içinde nfc-preview-cart anahtarıyla tutulur. Sayfalar arasında seçimlerinizi korur; gerçek sipariş veya ödeme kaydı değildir. Çerezden farklı bir tarayıcı depolama yöntemidir.'],
      ['Üyelik oturumu', 'Üyelik bağlantısı tamamlandığında oturum için kullanılan çerezlerin adı, amacı ve süresi bu sayfaya eklenecek.'],
      ['İsteğe bağlı teknolojiler', 'Analiz veya reklam teknolojisi eklenirse kapsamı ayrıca açıklanacak ve gerekli tercih yönetimi hazırlanacak. Bu sayfada çalışmayan bir “tercihler kaydedildi” düğmesi bulunmaz.'],
    ],
  },
  'mesafeli-satis': {
    title: 'Mesafeli satış sözleşmesi', label: 'Satış koşulları hazırlanıyor.', legal: true,
    intro: 'Satıcı bilgileri ve satış süreçleri kesinleşmeden sözleşme tamamlanmış gibi sunulmuyor. Mevcut önizlemede sözleşme kabulü veya satış yapılmaz.',
    sections: [
      ['İşletme bilgileri', 'Satıcının unvanı, adresi ve iletişim bilgileri doğrulanacak.'],
      ['Siparişe özel bilgiler', 'Ürün ve kişiselleştirme bilgileri, adet, toplam bedel, vergiler, kargo ücreti, ödeme ve teslimat bilgileri gerçek siparişten alınacak.'],
      ['Onay bekleyen koşullar', 'Cayma, iptal, iade, kişiye özel ürünler ve uyuşmazlık süreçleri hukuk danışmanı tarafından değerlendirilecek. Onaylanan metnin sürümü siparişle birlikte saklanacak.'],
    ],
  },
  'on-bilgilendirme': {
    title: 'Ön bilgilendirme formu', label: 'Ödeme öncesinde tüm ayrıntılar.', legal: true,
    intro: 'Satış açıldığında bu form seçtiğiniz ürün ve teslimat bilgileriyle hazırlanacak. Şu an gerçek siparişe ait bir form değildir.',
    sections: [
      ['Ürün ve bedel', 'Ürünün temel özellikleri, seçilen seçenekler, adet ve vergiler dahil bedel sipariş verilerinden gösterilecek.'],
      ['Teslimat ve diğer giderler', 'Kargo bedeli, varsa diğer giderler, ödeme yöntemi ve teslimata ilişkin bilgiler ödeme tamamlanmadan önce açıklanacak.'],
      ['Satıştan önce onaylanacak', 'Satıcı bilgileri, cayma ve iade koşulları dahil nihai içerik işletme ve hukuk danışmanı onayından sonra kullanılacak.'],
    ],
  },
};

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function infoPageFromPath(pathname) {
  const match = pathname.match(/(?:^|\/)bilgi(?:\/([a-z-]+))?\/(?:index\.html)?$/);
  if (!match) return null;
  return !match[1] ? 'index' : Object.hasOwn(infoPages, match[1]) ? match[1] : null;
}

export function renderInfoContent(slug = 'index') {
  if (slug === 'index') return `<section class="info-intro"><p class="eyebrow">YARDIM VE BİLGİLENDİRME</p><h1>Aradığınız bilgi,<br>tek bir yerde.</h1><p>Kartlar hakkında konuşalım. Teslimat ve satış koşullarının hazırlık durumunu da buradan inceleyebilirsiniz.</p></section><div class="info-list">${Object.entries(infoPages).map(([key, page]) => `<a class="info-list-link" href="./${key}/"><span><strong>${page.title}</strong><small>${page.legal ? 'Metin hazırlığı · Onay bekliyor' : key === 'iletisim' ? 'WhatsApp ve iletişim bilgileri' : 'Kargo, üretim ve iade hazırlıkları'}</small></span><span aria-hidden="true">↗</span></a>`).join('')}</div>`;
  const page = infoPages[slug];
  if (!page) throw new Error('Bilinmeyen bilgi sayfası');
  return `<nav class="info-breadcrumb" aria-label="Sayfa yolu"><a href="../">Yardım ve bilgi</a><span aria-hidden="true">/</span><span aria-current="page">${page.title}</span></nav><article class="info-article"><header class="info-intro"><p class="eyebrow">${page.legal ? 'METİN HAZIRLIĞI · ONAY BEKLİYOR' : 'YARDIM VE BİLGİLENDİRME'}</p><h1>${page.title}</h1><p class="info-lead">${page.label}</p><p>${page.intro}</p></header>${page.legal ? '<aside class="info-notice"><strong>Henüz yürürlükte olan bir metin değil.</strong><p>İşletme bilgileri ve gerekli danışman onayları tamamlandıktan sonra nihai metin yayımlanacak.</p></aside>' : ''}<div class="info-sections">${page.sections.map(([title, body]) => `<section><h2>${esc(title)}</h2><p>${esc(body)}</p></section>`).join('')}</div>${slug === 'iletisim' ? '<a class="button primary info-contact" href="https://wa.me/905511956312" target="_blank" rel="noopener noreferrer">WhatsApp’ta görüşün <span aria-hidden="true">↗</span><span class="info-sr-only"> (yeni sekmede açılır)</span></a><p class="info-small">Lütfen kart bilgisi, şifre veya kimlik belgesi göndermeyin.</p>' : '<a class="text-link info-contact" href="../iletisim/">Sorunuz mu var? Bizimle görüşün <span aria-hidden="true">→</span></a>'}</article>`;
}
