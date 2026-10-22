// Backend-only signed Cloudinary upload. Never include API secrets in browser code.
const MAX_IMAGE_BYTES = 3_000_000;
const PRESET = 'guangyuan-brand-cover';

export function inspectImage(file) {
  if (!(file instanceof File) || file.size === 0) return '請選擇有效的圖片';
  if (file.size > MAX_IMAGE_BYTES) return '封面圖片不能超過 3MB';
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return '只接受 JPG、PNG、WebP 圖片';
  return null;
}

export async function uploadCover(file, env) {
  const error = inspectImage(file);
  if (error) throw new Error(error);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const jpeg = bytes.length >= 3 && bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff;
  const png = bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  if (!(file.type==='image/jpeg'&&jpeg || file.type==='image/png'&&png || file.type==='image/webp'&&webp)) {
    throw new Error('圖片內容與格式不符');
  }
  const cloud = env.CLOUDINARY_CLOUD_NAME;
  if (!cloud || !/^[a-zA-Z0-9_-]+$/.test(cloud) || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('圖片上傳服務尚未完成設定');
  }
  const timestamp = String(Math.floor(Date.now()/1000));
  const text = `timestamp=${timestamp}&upload_preset=${PRESET}${env.CLOUDINARY_API_SECRET}`;
  const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  const signature = [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const body = new FormData();
  body.append('file', new Blob([bytes],{type:file.type}), 'brand-cover');
  body.append('timestamp',timestamp);
  body.append('upload_preset',PRESET);
  body.append('api_key',env.CLOUDINARY_API_KEY);
  body.append('signature',signature);
  const result = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {method:'POST',body});
  if (!result.ok) throw new Error('圖片儲存失敗，請稍後重試');
  const data = await result.json();
  const url = data.secure_url;
  if (typeof url !== 'string' || !url.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`) || url.length > 500) {
    throw new Error('圖片儲存回傳資料無效');
  }
  return url;
}
