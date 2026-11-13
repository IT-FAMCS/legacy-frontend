import { apiFetch } from '../utils/api-fetch';
import { readErrorResponse } from '../utils/api-error';
export type ZonePerson = { id:number; name:string; login:string; telegram:string|null; active:boolean };
export type Zone = { id:number; title:string; people_required:number; lead_user_id:number|null; lead:ZonePerson|null; helper_ids:number[]; helpers:ZonePerson[]; filled:number; closed:boolean; version:number };
export type ZoneBoard = { card:{id:number;title:string}; version:number; zones:Zone[]; total:number; closed:number; open:number; can_edit:boolean; users:ZonePerson[] };
export type ZoneInput = Pick<Zone,'title'|'people_required'|'lead_user_id'|'helper_ids'>;
export type ZoneHistory = { id:number; zone_id:number; actor_name:string; action:'create'|'update'|'clear'|'delete'; created_at:string; before:Zone|null; after:Zone|null };
const BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/api/cards`;
async function request<T>(cardId:number,path='',method='GET',body?:unknown,signal?:AbortSignal):Promise<T> {
  const token=localStorage.getItem('jwt_token');
  const response=await apiFetch(`${BASE}/${cardId}/responsibility-zones${path}`,{method,signal,
    headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  if(!response.ok)throw new Error((await readErrorResponse(response)) || `Ошибка ${response.status}`);
  return response.json();
}
export const getZones=(cardId:number,signal?:AbortSignal)=>request<ZoneBoard>(cardId,'','GET',undefined,signal);
export const createZone=(cardId:number,value:ZoneInput,boardVersion:number)=>request<ZoneBoard>(cardId,'','POST',{...value,board_version:boardVersion});
export const updateZone=(cardId:number,zone:Zone,value:ZoneInput,boardVersion:number)=>request<ZoneBoard>(cardId,`/${zone.id}`,'PATCH',{...value,version:zone.version,board_version:boardVersion});
export const deleteZone=(cardId:number,zone:Zone,boardVersion:number)=>request<ZoneBoard>(cardId,`/${zone.id}`,'DELETE',{version:zone.version,board_version:boardVersion});
export const clearZones=(cardId:number,boardVersion:number)=>request<ZoneBoard>(cardId,'/clear','POST',{board_version:boardVersion});
export const getZoneHistory=(cardId:number,signal?:AbortSignal)=>request<ZoneHistory[]>(cardId,'/history','GET',undefined,signal);
export function telegramContactUrl(value:string|null):string|undefined {
  if(!value)return undefined;
  const match=/^(?:@|https:\/\/t\.me\/)?([A-Za-z0-9_]{5,32})$/.exec(value.trim());
  return match?`https://t.me/${match[1]}`:undefined;
}
