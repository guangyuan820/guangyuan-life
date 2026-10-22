import {json,validate,err} from '../_lib/util.js';
import {checkOrigin,limit,clientKey,verifyTurnstile} from '../_lib/security.js';
import {inspectImage,uploadCover} from '../_lib/cloudinary.js';

export async function onRequestPost({request,env}) {
  const bad = checkOrigin(request); if (bad) return bad;
  try {
    const type = (request.headers.get('content-type')||'').toLowerCase();
    const multipart = type.startsWith('multipart/form-data;');
    if (!multipart && !type.startsWith('application/json')) return json({error:'不支援的資料格式'},415);
    const maxBody = multipart ? 3_500_000 : 16_000;
    if (Number(request.headers.get('content-length')||0) > maxBody) return json({error:'申請資料或圖片太大'},413);
    if (!await limit(env,clientKey(request,'apply'),5,3600)) return json({error:'申請次數過多，請稍後再試'},429);
    const raw = await readLimitedBody(request,maxBody);
    if(raw===null) return json({error:'申請資料或圖片太大'},413);
    let b, file;
    if(multipart) {
      // Parse only a size-limited multipart payload; never trust client-supplied MIME alone.
      const copy = new Request(request.url,{method:'POST',headers:{'content-type':request.headers.get('content-type')},body:raw});
      let fd; try {fd=await copy.formData()}catch{return json({error:'上傳表單格式錯誤'},400)}
      b=Object.fromEntries([...fd.entries()].filter(([k,v])=>typeof v==='string'));
      b.consent=b.consent==='true';
      file=fd.get('cover_image');
      if(file instanceof File && file.size===0) file=null;
    } else {
      try{b=JSON.parse(new TextDecoder().decode(raw))}catch{return json({error:'輸入格式錯誤'},400)}
    }
    if(!b || typeof b!=='object' || Array.isArray(b)) return json({error:'輸入格式錯誤'},400);
    if(b.honeypot) return json({ok:true});
    if(!env.TURNSTILE_SITE_KEY||!env.TURNSTILE_SECRET) return json({error:'管理者尚未完成驗證設定'},503);
    if(!await verifyTurnstile(b.turnstileToken,env,request)) return json({error:'人機驗證失敗，請重新驗證'},400);
    const {row,error}=validate(b); if(error)return json({error},400);
    if(file) {
      const imageError = inspectImage(file);
      if(imageError) return json({error:imageError},400);
      try {row.cover_url=await uploadCover(file,env)}
      catch(e){return json({error:e.message||'圖片上傳失敗'},e.message==='圖片內容與格式不符'?400:503)}
    }
    const id=crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO brands (id,name,category,city,district,description,services,cover_url,website,instagram,line_url,phone,address,contact_name,contact_email,consent,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,'pending')`).bind(id,row.name,row.category,row.city,row.district,row.description,row.services,row.cover_url,row.website,row.instagram,row.line_url,row.phone,row.address,row.contact_name,row.contact_email).run();
    return json({ok:true,message:'申請已送出，將由光緣審核。'},201);
  } catch(e){return err(e)}
}

async function readLimitedBody(request,maxBytes){
  if(!request.body)return new Uint8Array();
  const reader=request.body.getReader();let size=0;const chunks=[];
  try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();return null}chunks.push(value)}}
  finally{reader.releaseLock()}
  const bytes=new Uint8Array(size);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.byteLength}return bytes;
}
