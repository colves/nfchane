import {api,esc,money} from './preparation.js';

const labels = {
  creating:'Test ekranı hazırlanıyor.',
  pending:'İmzalı PayTR bildirimi bekleniyor.',
  success:'Başarılı test bildirimi doğrulandı.',
  failed:'Başarısız test bildirimi doğrulandı.',
  expired:'Test oturumunun süresi doldu.',
  unavailable:'PayTR test ekranı açılamadı.',
};

export async function showPaytrTest(container) {
  const {ready} = await api('/api/admin/paytr-test');
  container.innerHTML = `<section class="prep-panel">
    <h2>PayTR misafir ödeme testi</h2>
    <p class="prep-small">Örnek bir kart ve test bedeli kullanılır. Gerçek sipariş, fatura veya tahsilat oluşturulmaz. PayTR ekranında yalnız hazır test kartını kullanın.</p>
    ${ready?`<div class="prep-actions">
      <button class="button primary" type="button" data-test-start>Yeni test başlat</button>
      <button class="button outline" type="button" data-test-status disabled>Sonucu kontrol et</button>
    </div><p class="prep-paytr-status" role="status"></p><div class="prep-paytr-frame"></div>`
      :'<p class="prep-note">PayTR test bağlantısı için Worker sırları ve test e-postası gerekiyor.</p>'}
  </section>`;
  if (!ready) return;
  const start = container.querySelector('[data-test-start]');
  const refresh = container.querySelector('[data-test-status]');
  const status = container.querySelector('.prep-paytr-status');
  const frameHost = container.querySelector('.prep-paytr-frame');
  let reference = sessionStorage.getItem('nfchane-paytr-test');
  let busy = false;

  async function run(work) {
    if (busy) return;
    busy = true;
    start.disabled = refresh.disabled = true;
    try {
      const data = await work();
      reference = data.reference;
      sessionStorage.setItem('nfchane-paytr-test',reference);
      status.textContent = `${labels[data.status]} ${money(data.amountMinor)} · ${reference}`;
      const iframe = frameHost.querySelector('iframe');
      if (!data.iframeUrl) iframe?.remove();
      else if (!iframe) {
        frameHost.innerHTML = `<iframe src="${esc(data.iframeUrl)}" title="PayTR test ödeme ekranı" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
      }
    } catch (error) {
      status.textContent = error.message;
    } finally {
      start.disabled = false;
      refresh.disabled = !reference;
      busy = false;
    }
  }

  const read = () => run(()=>api('/api/admin/paytr-test/'+encodeURIComponent(reference)));
  start.addEventListener('click',()=>{
    frameHost.replaceChildren();
    status.textContent = labels.creating;
    void run(()=>api('/api/admin/paytr-test/start',{method:'POST',data:{requestKey:crypto.randomUUID()}}));
  });
  refresh.addEventListener('click', read);
  if (reference) await read();
}
