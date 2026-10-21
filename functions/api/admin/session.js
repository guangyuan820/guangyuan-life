import {json,isAdmin} from '../../_lib/util.js';
export async function onRequestGet({request,env}){return json({authenticated:await isAdmin(request,env)})}
