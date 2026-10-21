import {json} from '../_lib/util.js';
export function onRequestGet({env}){return json({turnstileSiteKey:env.TURNSTILE_SITE_KEY||''})}
