import { apiFetch } from "../utils/api-fetch";
import { readErrorResponse } from "../utils/api-error";
export type DataPolicy={version:string;configured:boolean;operator:string;address:string;contact:string;processors:string;retention:string;sections:string[];rights:string[]};
export type DataStatus={policy:DataPolicy;service:boolean;saved_details:boolean};
export type SavedPayout={id:number;label:string;details:string};
async function request<T>(path:string,init:RequestInit={}):Promise<T>{
  const token=localStorage.getItem("jwt_token");
  const response=await apiFetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api${path}`,{...init,cache:"no-store",credentials:"include",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})}});
  if(!response.ok)throw new Error((await readErrorResponse(response)) || `HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
export const getDataStatus=()=>request<DataStatus>("/personal-data/me");
export const acceptDataConsent=(scope:"service"|"saved_details",version:string)=>request<{ok:boolean}>("/personal-data/consents",{method:"POST",body:JSON.stringify({scope,version})});
export const revokeDataConsent=(scope:"service"|"saved_details")=>request<{ok:boolean}>(`/personal-data/consents/${scope}`,{method:"DELETE"});
export const getSavedPayouts=()=>request<SavedPayout[]>("/payout-details");
export const addSavedPayout=(payload:{label:string;details:string})=>request<SavedPayout>("/payout-details",{method:"POST",body:JSON.stringify(payload)});
export const deleteSavedPayout=(id:number)=>request<{ok:boolean}>(`/payout-details/${id}`,{method:"DELETE"});
