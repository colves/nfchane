// Public preview information only: no customer records or unapproved contract text.
const returnTerms = [
  ['Sabit bağlantılı, özel baskılı kartlar', 'Bu kartları siparişte verdiğiniz bağlantı veya tasarıma göre özel olarak basarız. Bu şekilde hazırlanan kartlarda Mesafeli Sözleşmeler Yönetmeliği’nin 15/1-b maddesi uyarınca cayma hakkı istisnası uygulanır.'],
  ['Dinamik kartlarda cayma hakkı', 'Dinamik kart için teslimden önce veya kartı sizin ya da belirlediğiniz kişinin teslim aldığı tarihten itibaren 14 gün içinde, gerekçe göstermeden ve cezai şart ödemeden cayabilirsiniz. Karma siparişlerde her karta kendi koşulu uygulanır.'],
  ['Dinamik kartın geri gönderimi', 'Tüketici olarak cayma bildiriminizi ilettikten sonra kartı 14 gün içinde geri gönderin. Ön bilgilendirmede belirtilen taşıyıcıyla yapılan iadede gönderim masrafını satıcı karşılar. İade için taşıyıcı belirtilmemişse seçtiğiniz kargoyla gönderimin masrafı da size ait değildir.'],
  ['Ayıplı ürünler', 'Her iki modelde de ayıplı mala ilişkin yasal haklarınız saklıdır. Doğru ilettiğiniz bağlantının yanlış basılması, teslimde kırık pleksi veya vaat edildiği gibi çalışmayan NFC buna örnektir. Kanundaki koşullara göre sözleşmeden dönme, bedelde indirim, ücretsiz onarım veya ayıpsız ürünle değişim talep edebilirsiniz.'],
];

export const infoPages = {
  'google-yorum-karti-nasil-kullanilir': {
    title: 'Google yorum kartı nasıl kullanılır?',
    label: 'Yorum bağlantısını hazırlamadan kartı yerleştirmeye kadar.',
    intro: 'Google yorum kartı, müşterinizin işletmenizin yorum sayfasına NFC veya QR ile ulaşmasını sağlar. Yorum yazıp yazmama kararı müşterinize aittir.',
    guideProduct: ['google-yorum-karti', 'Google Yorum Kartı'],
    sections: [
      ['Doğru işletme bağlantısını kullanın', 'Google İşletme Profilinizden yorum isteme bağlantısını kopyalayın. Birden fazla şubeniz varsa, linkin doğru şubeyi açtığını başka bir telefondan kontrol edin.'],
      ['NFC ve QR’ı farklı telefonlarla deneyin', 'NFC destekli telefonda kartı telefonun üst veya arka bölümüne yaklaştırın. QR için kamerayı koda tutup çıkan bağlantıyı açın. Kartı aydınlık ve kolay erişilen bir yere yerleştirin.'],
      ['Müşteriden deneyimini paylaşmasını isteyin', 'Kasada veya çıkışta isteyen müşteriye kartı gösterin. Belirli bir puan istemeden deneyimini kendi sözleriyle paylaşmasına alan bırakın.'],
    ],
  },
  'qr-menu-karti-nasil-kullanilir': {
    title: 'QR menü kartı nasıl kullanılır?',
    label: 'Menünüzü telefondan açılacak şekilde hazırlayın.',
    intro: 'Dijital menü kartı, müşterinin masadan QR kodla veya NFC ile menüye ulaşmasını sağlar. Hazır bir web menüsü veya erişime açık bir PDF bağlantısı kullanılabilir.',
    guideProduct: ['dijital-menu-karti', 'Dijital Menü Kartı'],
    sections: [
      ['Menüyü mobilde kontrol edin', 'Bağlantıyı oturum açmamış bir telefonda açın. Menü giriş istemeden yüklenmeli. Kategoriler ve fiyatlar yakınlaştırmaya gerek kalmadan okunabilmeli.'],
      ['Menü değişikliklerini planlayın', 'Basılı QR kod sabit bir URL içerir. Menü içeriğini aynı adreste güncelleyebiliyorsanız kartı değiştirmek gerekmez. Adres değişecekse yönlendirme seçeneğinin koşullarını kartı hazırlamadan önce netleştirin.'],
      ['Masadaki son yerinde deneyin', 'Kodu müşterinin oturduğu açıdan okutun. Parlama ve düşük ışık taramayı zorlaştırıyorsa kartın konumunu düzeltin. NFC de varsa onu ayrı deneyin.'],
    ],
  },
  'isletme-bilgileri': {
    title: 'İşletme bilgileri', label: 'Marka ve yasal satıcı bilgileri.', legal: true,
    intro: 'NFCHane mağaza markasıdır. Satıcı bilgileri resmî belgelerle doğrulandıktan sonra burada yayımlanacak.',
    sections: [
      ['Satıcı ve iletişim', 'Resmî unvan, işletme adresi, kayıt bilgileri ve KEP adresi satış öncesinde eklenecek. Kartlar hakkında mevcut iletişim kanalımızdan bilgi alabilirsiniz.'],
      ['Mağazanın durumu', 'Mağaza önizlemededir. Bu aşamada sipariş veya ödeme alınmaz.'],
    ],
  },
  uyelik: {
    title: 'Üyelik koşulları', label: 'Hesap kullanımı ve misafir alışverişi.', legal: true,
    intro: 'Hesap açma, e-posta doğrulama ve hesap kapatma koşulları yayına hazırlanmaktadır.',
    sections: [
      ['Misafir olarak devam', 'Sipariş formunu hesap açmadan inceleyebilirsiniz.'],
      ['Hesap yönetimi', 'Hesap güvenliği, değişiklik ve kapatma başvuruları ile üyeliğin kişisel verilere etkisi yayımdan önce açıklanacak.'],
    ],
  },
  hakkimizda: {
    title: 'Hakkımızda', label: 'İşletmeler için NFC ve QR kartları.',
    intro: 'NFCHane, işletmelerin müşterilerini yorum sayfasına, dijital menüye ve diğer bağlantılarına yönlendirmesini sağlayan kartlar hazırlıyor.',
    sections: [
      ['Kartlar nasıl çalışır?', 'Telefonu NFC kartına yaklaştırarak veya QR kodu okutarak kartta tanımlı bağlantıyı açabilirsiniz.'],
      ['Mağazanın durumu', 'Ürünleri önizleyebilir ve kart seçenekleri hakkında bize yazabilirsiniz. Satış ve ödeme hazırlıkları sürüyor.'],
    ],
  },
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
      ['Kargo ücreti ve teslim süresi', 'Kargo firması, ücret ve hazırlık süresi henüz belirlenmedi. Kartın baskı ve hazırlık süresi ile kargoya verildikten sonraki tahmini taşıma süresi ayrı belirtilecek. Kargo bedelini ve ödenecek toplamı sipariş onayından önce göreceksiniz. Şu an ücretsiz kargo veya belirli bir teslim günü taahhüdü yok.'],
      ['Kartla ödeme', 'Mağaza şu anda önizlemededir. Satış açıldığında kartla tek çekim ödeme için PayTR kullanılması planlanıyor. Kart bilgilerinizi yalnız ödeme ekranına girin. Sipariş notuna veya WhatsApp mesajına kart numarası ya da güvenlik kodu yazmayın.'],
      ['Size özel tasarım', 'Kişiselleştirme gerektiren ürünlerde son tasarımın üretimden önce onayınıza sunulması planlanıyor. Tasarım hazırlığı ile kargo süresi ayrı ayrı belirtilecek.'],
      ...returnTerms,
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
    title: 'KVKK aydınlatma metni', label: 'İletişim, kişiselleştirme ve siparişlerde kullanılan bilgiler.', legal: true,
    intro: 'Bu taslak, bugün açık olan iletişim kanalını ve satış açıldığında sipariş için kullanılacak bilgileri açıklar.',
    sections: [
      ['Veri sorumlusu', 'İşletmenin ticari unvanı, adresi ve kişisel veri başvuru kanalı henüz bu sayfaya eklenmedi.'],
      ['Sorularınız ve destek talepleriniz', 'WhatsApp üzerinden bize yazdığınızda telefon numaranız, profilinizde görünen adınız ve mesajda paylaşmayı seçtiğiniz bilgiler bize ulaşır. Ürün veya teklif talebinizi yanıtlamak için gereken bilgiler, sözleşmenin kurulmasıyla doğrudan ilgili olduğu ölçüde KVKK madde 5/2-c kapsamında işlenir.'],
      ['Sipariş ve kişiselleştirme', 'Satış açıldığında sipariş formundan alınan ad, iletişim bilgileri, adres, ürün seçimi ve baskı içeriği kartı hazırlamak ve teslim etmek için kullanılır (KVKK madde 5/2-c). IBAN kartında kart üzerine yansıtılmasını istediğiniz hesap sahibi adı ve IBAN da kişiselleştirme içeriğidir. Basılan veya bağlantıyla açılan bilgileri kartı okutan kişiler görebilir.'],
      ['Ödeme, fatura ve başvurular', 'Ödeme sonucunu siparişle eşleştirmek için işlem referansı ve tutar kullanılır. Fatura için gereken kimlik, adres ve vergi bilgileri yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir (madde 5/2-ç). Bir talebin veya uyuşmazlığın belgelenmesi için gereken kayıtlar bir hakkın kurulması, kullanılması veya korunması amacıyla işlenebilir (madde 5/2-e).'],
      ['Bilgiler kimlere ulaşır?', 'Planlanan satış sürecinde baskı hizmetini veren işletmeye basılacak içerik, taşıyıcıya teslimat ve iletişim bilgileri, ödeme kuruluşuna işlem için gereken bilgiler, muhasebe hizmeti verene fatura bilgileri iletilir. Site ve veri tabanı altyapısında Cloudflare ve Supabase kullanılır. Yurt dışına aktarımın kapsamı ve hukuki dayanağı nihai metinde açıklanacaktır.'],
      ['Haklarınız ve başvuru', 'KVKK madde 11 uyarınca verilerinizin işlenip işlenmediğini, amacını ve yurt içinde veya dışında aktarıldığı kişileri öğrenebilir, yanlış verilerin düzeltilmesini ve kanuni şartlarda silinmesini veya yok edilmesini isteyebilirsiniz. Bu işlemlerin alıcılara bildirilmesini, yalnız otomatik analizden doğan aleyhinize bir sonuca itiraz etmeyi ve hukuka aykırı işleme nedeniyle uğradığınız zararın giderilmesini talep edebilirsiniz. Resmî başvuru adresi doğrulandığında burada yayımlanacaktır.'],
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
    title: 'Mesafeli satış sözleşmesi', label: 'NFC ve QR kartları için tüketici satış koşulları.', legal: true,
    intro: 'Satıcı bilgileri ve satış süreçleri kesinleşmeden sözleşme tamamlanmış gibi sunulmuyor. Mevcut önizlemede sözleşme kabulü veya satış yapılmaz.',
    sections: [
      ['Taraflar ve kapsam', 'Bu koşullar, NFCHane mağazasından tüketici olarak satın aldığınız kartların hazırlanmasını ve teslimini kapsar. NFCHane mağazanın markasıdır. Satıcının resmî unvanı, adresi ve iletişim bilgileri satış açılmadan önce yayımlanacaktır.'],
      ['Ürün, bedel ve ödeme', 'Okutma yöntemi, bağlantı türü, adet ve kişiselleştirme bilgileri sipariş özetinde belirtilir. Vergiler dâhil ürün bedelini, kargo ücretini ve ödenecek toplamı siparişi onaylamadan önce görürsünüz.'],
      ['İşletme adına alım', 'Bir kafenin masaları için menü kartı alması gibi ticari veya mesleki amaçlı siparişlerde, bu sayfadaki tüketiciye özgü yasal cayma hükümleri kendiliğinden uygulanmaz. İşletme siparişine sunulan iade koşulları siparişten önce ayrıca belirtilir.'],
      ['Hazırlık ve teslimat', 'Satıcı kartları siparişinizdeki özelliklere göre hazırlar ve bildirilen süre içinde belirttiğiniz adrese teslim eder. Sipariş öncesinde kartın hazırlanıp kargoya verilme süresi ile taşıyıcının tahmini teslim süresi ayrı gösterilir.'],
      ...returnTerms,
      ['Cayma bildirimi ve geri ödeme', 'Cayma kararınızı süre içinde satıcıya yazılı olarak veya e-posta gibi saklanabilir bir yolla bildirebilirsiniz. Sipariş numaranızı ve hangi kartı iade ettiğinizi belirtmeniz işlemi kolaylaştırır. İade adresi ve taşıyıcı sipariş öncesinde bildirilecektir. Geri ödeme süresi, belirtilen taşıyıcıya kartı verdiğiniz gün, farklı bir taşıyıcı kullandıysanız kartın satıcıya ulaştığı gün başlar. Teslimden önce cayarsanız süre bildiriminizle başlar. Cayma kapsamındaki ödemeler, uygulanabilir teslimat giderleriyle birlikte 14 gün içinde kullandığınız ödeme aracına uygun şekilde, tek seferde ve masrafsız iade edilir.'],
      ['Uyuşmazlık başvuruları', 'Uyuşmazlık hâlinde, geçerli parasal sınıra göre yerleşim yerinizdeki veya işlemin yapıldığı yerdeki tüketici hakem heyetine ya da ilgili dava şartları çerçevesinde tüketici mahkemesine başvurabilirsiniz.'],
    ],
  },
  'on-bilgilendirme': {
    title: 'Ön bilgilendirme formu', label: 'Ödeme öncesinde tüm ayrıntılar.', legal: true,
    intro: 'Satış açıldığında bu form seçtiğiniz ürün ve teslimat bilgileriyle hazırlanacak. Şu an gerçek siparişe ait bir form değildir.',
    sections: [
      ['Ürün ve bedel', 'Ürünün temel özellikleri, seçilen seçenekler, adet ve vergiler dahil bedel sipariş verilerinden gösterilecek.'],
      ['Teslimat ve diğer giderler', 'Kargo bedeli, varsa diğer giderler, ödeme yöntemi ve teslimata ilişkin bilgiler ödeme tamamlanmadan önce açıklanacak.'],
      ...returnTerms,
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
    if (slug === 'index') {
    const groups = [
      { title: 'Kart kullanım rehberleri', id: 'rehberler', keys: Object.keys(infoPages).filter(key => infoPages[key].guideProduct) },
      { title: 'Mağaza ve destek', id: 'destek', keys: ['iletisim', 'teslimat-iade', 'hakkimizda'] },
      { title: 'İşletme ve yasal bilgiler', id: 'yasal-bilgiler', keys: Object.keys(infoPages).filter(key => infoPages[key].legal) },
    ];
    return `<header class="info-intro"><h1>Yardım ve bilgi</h1></header>${groups.map(group =>
      `<section class="info-group" id="${group.id}"><h2>${group.title}</h2><div class="info-list">${group.keys.map(key => {
        const page = infoPages[key];
        return `<a class="info-list-link" href="./${key}/"><span><strong>${page.title}</strong><small>${page.legal ? 'Taslak · Onay bekliyor' : page.label}</small></span><span aria-hidden="true">→</span></a>`;
      }).join('')}</div></section>`
    ).join('')}`;
  }
  const page = infoPages[slug];
  if (!page) throw new Error('Bilinmeyen bilgi sayfası');
  return `<nav class="info-breadcrumb" aria-label="Sayfa yolu"><a href="../">Yardım ve bilgi</a><span aria-hidden="true">/</span><span aria-current="page">${page.title}</span></nav><article class="info-article"><header class="info-intro"><p class="eyebrow">${page.legal ? 'METİN HAZIRLIĞI · ONAY BEKLİYOR' : 'YARDIM VE BİLGİLENDİRME'}</p><h1>${page.title}</h1><p class="info-lead">${page.label}</p><p>${page.intro}</p></header>${page.legal ? '<aside class="info-notice"><strong>Henüz yürürlükte olan bir metin değil.</strong><p>İşletme bilgileri ve gerekli danışman onayları tamamlandıktan sonra nihai metin yayımlanacak.</p></aside>' : ''}<div class="info-sections">${page.sections.map(([title, body]) => `<section><h2>${esc(title)}</h2><p>${esc(body)}</p></section>`).join('')}</div>${page.guideProduct ? `<a class="text-link info-contact" href="../urun/${page.guideProduct[0]}/">${page.guideProduct[1]} seçeneklerini inceleyin</a>` : ''}${slug === 'iletisim' ? '<a class="button primary info-contact" href="https://wa.me/905511956312" target="_blank" rel="noopener noreferrer">WhatsApp’ta görüşün <span aria-hidden="true">↗</span><span class="info-sr-only"> (yeni sekmede açılır)</span></a><p class="info-small">Lütfen kart bilgisi, şifre veya kimlik belgesi göndermeyin.</p>' : '<a class="text-link info-contact" href="../iletisim/">Sorunuz mu var? Bizimle görüşün <span aria-hidden="true">→</span></a>'}</article>`;
}
