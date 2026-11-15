import {api,esc,date,message} from './preparation.js';
import {statusLabels} from '../worker/validation.js';
const form=document.querySelector('#tracking-form'),notice=document.querySelector('#tracking-message');
const fragment=new URLSearchParams(location.hash.slice(1));
if(fragment.has('token')){form.elements.token.value=fragment.get('token');history.replaceState(null,'',location.pathname);}
form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button');button.disabled=true;button.setAttribute('aria-busy','true');
  try{const data=await api('/api/tracking',{method:'POST',data:{token:form.elements.token.value.trim()}});const panel=document.querySelector('#tracking-result');panel.hidden=false;panel.innerHTML=`<h2>${esc(statusLabels[data.status])}</h2><p class="prep-small">Test kaydı · ${date(data.created_at)} · ${esc(data.id.slice(0,8))}</p><div style="margin-top:20px">${data.items.map(i=>`<p>${esc(i.name)} · ${i.quantity} adet</p>`).join('')}</div>${data.shipment?.tracking_number?`<p style="margin-top:20px">${esc(data.shipment.carrier)} · ${esc(data.shipment.tracking_number)}</p>`:'<p class="prep-small" style="margin-top:20px">Kargo bilgisi henüz girilmedi.</p>'}`;message(notice,'');}catch(error){document.querySelector('#tracking-result').hidden=true;message(notice,error.message,true);}finally{button.disabled=false;button.removeAttribute('aria-busy');}
});
