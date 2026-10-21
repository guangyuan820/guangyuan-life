import {json} from '../../_lib/util.js';
export function onRequestPost(){return json({ok:true},200,{'Set-Cookie':'gy_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'})}
