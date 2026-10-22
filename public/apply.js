const f=document.querySelector('#application');
const msg=document.querySelector('#message');
const btn=document.querySelector('#send');
const picker=document.querySelector('#coverImage');
const preview=document.querySelector('#coverPreview');
let previewUrl=null;
function clearPreview(){if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;preview.hidden=true;preview.removeAttribute('src')}
picker.addEventListener('change',()=>{
  clearPreview();const file=picker.files?.[0];if(!file)return;
  if(file.size>3_000_000 || !['image/jpeg','image/png','image/webp'].includes(file.type)){
    picker.value='';msg.className='notice';msg.textContent='請選擇不超過 3MB 的 JPG、PNG 或 WebP 圖片';return;
  }
  previewUrl=URL.createObjectURL(file);preview.src=previewUrl;preview.hidden=false;
  msg.textContent='';
});
f.addEventListener('submit',async e=>{
  e.preventDefault();btn.disabled=true;btn.textContent='送出中，照片上傳可能需要一些時間…';
  const data=new FormData(f);
  data.set('turnstileToken',window.turnstile?.getResponse?.()||'');
  data.set('consent',String(f.elements.consent.checked));
  try{
    const r=await fetch('/api/apply',{method:'POST',body:data});
    const x=await r.json();if(!r.ok)throw Error(x.error||'送出失敗');
    msg.className='notice';msg.textContent='申請已成功送出！審核完成後，店家資訊才會公開上架。';
    f.reset();clearPreview();window.turnstile?.reset?.();
  }catch(error){msg.className='notice';msg.textContent=error.message;window.turnstile?.reset?.()}
  finally{btn.disabled=false;btn.textContent='送出品牌刊登申請 ↗'}
});
