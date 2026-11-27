import '@fontsource-variable/manrope';
import './style.css';
import './readability.css';
import './preparation.css';
import './brand.css';
export const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export async function api(path,{method='GET',data}={}){
  const response=await fetch(path,{method,credentials:'same-origin',headers:data?{'Content-Type':'application/json'}:{},...(data?{body:JSON.stringify(data)}:{})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'İşlem tamamlanamadı.');return result;
}
export const money=minor=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(minor/100);
export const date=value=>value?new Intl.DateTimeFormat('tr-TR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';
export function message(element,value,error=false){element.textContent=value;element.dataset.error=String(error);element.hidden=!value;}
