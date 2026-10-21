import {json,validate,err} from '../_lib/util.js';
import {checkOrigin,limit,clientKey,verifyTurnstile} from '../_lib/security.js';
export async function onRequestPost({request,env}){const bad=checkOrigin(request);if(bad)return bad;try{if(Number(request.headers.get('content-length')||0)>16000)return json({error:'資料太長'},413);if(!await limit(env,clientKey(request,'apply'),5,3600))return json({error:'申請次數過多，請稍後再試'},429);const raw=await readLimitedBody(request,16000);if(raw===null)return json({error:'資料太長'},413);let b;try{b=JSON.parse(raw)}catch{return json({error:'輸入格式錯誤'},400)}if(b.honeypot)return json({ok:true});if(!env.TURNSTILE_SITE_KEY||!env.TURNSTILE_SECRET)return json({error:'管理者尚未完成驗證設定'},503);if(!await verifyTurnstile(b.turnstileToken,env,request))return json({error:'人機驗證失敗，請重新驗證'},400);const {row,error}=validate(b);if(error)return json({error},400);const id=crypto.randomUUID();await env.DB.prepare(`INSERT INTO brands (id,name,category,city,district,description,services,cover_url,website,instagram,line_url,phone,address,contact_name,contact_email,consent,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,'pending')`).bind(id,row.name,row.category,row.city,row.district,row.description,row.services,row.cover_url,row.website,row.instagram,row.line_url,row.phone,row.address,row.contact_name,row.contact_email).run();return json({ok:true,message:'申請已送出，將由光緣審核。'},201)}catch(e){return err(e)}}

// Read at most maxBytes+1 so missing Content-Length cannot bypass the limit.
async function readLimitedBody(request,maxBytes){
  if(!request.body)return '';
  const reader=request.body.getReader();let size=0;const chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();return null;}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.byteLength;}
  return new TextDecoder().decode(bytes);
}
