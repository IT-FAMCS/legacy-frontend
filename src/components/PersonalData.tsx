import { usePersonalDataStatus } from "../hooks/use-personal-data";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptDataConsent, revokeDataConsent } from "../api/personal-data";
import type { DataPolicy } from "../api/personal-data";
import { useUserStore } from "../stores/user";
import "./personal-data.css";

export function DataContact({contact}:{contact?:string}){
  if(!contact)return <span>Контакт не указан</span>;
  const href=/^https:\/\//i.test(contact) || /^\/(?!\/)/.test(contact) ? contact : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? `mailto:${contact}` : undefined;
  return href ? <a href={href} target="_blank" rel="noreferrer">{contact.endsWith("/user/admin") ? "Аккаунт администратора" : contact}</a> : <span>{contact}</span>;
}

export function PolicyText({policy}:{policy:DataPolicy}){
  const emphasize=(text:string)=>text.split(/(?<=[.!?])\s+/).map((part,i)=>{
    if(/добровольн|не отправляйте|отозвать|удален|удалён|удалени|отказ|за пределами|риски|вправе/i.test(part))return <strong key={i}><u>{part}</u>{" "}</strong>;
    const colon=part.indexOf(": ");
    return colon>=0 ? <span key={i}><strong><u>{part.slice(0,colon+1)}</u></strong>{part.slice(colon+1)}{" "}</span> : <span key={i}>{part}{" "}</span>;
  });
  return <div className="personal-data-policy"><h2>Условия обработки персональных данных</h2>
    {!policy.configured && <p role="alert">Оператор ещё не заполнил сведения об обработке данных. Обратитесь к администратору.</p>}
    <p>{policy.operator && <><strong><u>Оператор:</u></strong> {policy.operator}<br/></>}{policy.address && <><strong><u>Адрес:</u></strong> {policy.address}<br/></>}<strong><u>Контакт для обращений:</u></strong> <DataContact contact={policy.contact}/></p>
    {policy.sections.map((text,i)=><p key={i}>{emphasize(text)}</p>)}
    <p><strong><u>Место обработки и уполномоченные лица:</u></strong> {emphasize(policy.processors || "Не указаны")}</p>
    <p><strong><u>Срок согласия и хранения:</u></strong> {emphasize(policy.retention || "Не указан")}</p>
    <section aria-label="Ваши права"><h3><strong><u>Ваши права и последствия согласия</u></strong></h3>{policy.rights.map((text,i)=><p key={i}>{emphasize(text)}</p>)}</section>
    <small>Версия условий: {policy.version.slice(0,12)}</small>
  </div>;
}

export function ConsentGate({children}:{children:React.ReactNode}){
  const client=useQueryClient();
  const status=usePersonalDataStatus();
  const [checkedVersion,setCheckedVersion]=useState<string|null>(null);
  const checked=checkedVersion===status.data?.policy.version;
  const accept=useMutation({mutationFn:()=>acceptDataConsent("service",status.data!.policy.version),onSuccess:async()=>{setCheckedVersion(null);await client.invalidateQueries({queryKey:["personal-data"]});},onError:()=>{setCheckedVersion(null);void status.refetch();}});
  if(status.isPending)return <p role="status">Проверяем согласие на обработку данных…</p>;
  if(status.isError)return <main className="personal-data"><p role="alert">{status.error.message}</p><button onClick={()=>void status.refetch()}>Повторить</button><button onClick={()=>{useUserStore.getState().logout();window.location.assign("/login");}}>Выйти</button></main>;
  if(status.data.service)return <>{children}</>;
  return <main className="personal-data"><PolicyText policy={status.data.policy}/><form onSubmit={event=>{event.preventDefault();if(checked)accept.mutate();}}>
    <label><input type="checkbox" checked={checked} onChange={event=>setCheckedVersion(event.target.checked ? status.data.policy.version : null)} required disabled={!status.data.policy.configured}/> Я ознакомился с условиями и своими правами и согласен на обработку персональных данных для работы в «Наследии».</label>
    {accept.error && <p role="alert">{accept.error.message}</p>}
    <div className="personal-data-actions"><button disabled={!checked || !status.data.policy.configured || accept.isPending}>Согласиться и продолжить</button><button type="button" onClick={()=>{useUserStore.getState().logout();client.clear();window.location.assign("/login");}}>Отказаться и выйти</button></div>
  </form></main>;
}

export function PersonalDataControls(){
  const client=useQueryClient();
  const status=usePersonalDataStatus();
  const [confirm,setConfirm]=useState(false);
  const revoke=useMutation({mutationFn:()=>revokeDataConsent("service"),onSuccess:()=>{useUserStore.getState().logout();client.clear();window.location.assign("/login");}});
  return <section className="personal-data"><h2>Персональные данные</h2>
    {status.data && <details><summary>Условия обработки и ваши права</summary><PolicyText policy={status.data.policy}/></details>}
    {status.error && <p role="alert">{status.error.message}</p>}
    <p>Отзыв основного согласия удалит сохранённые реквизиты и завершит сеанс. Для удаления остальных данных или получения информации об их обработке обратитесь к оператору: <DataContact contact={status.data?.policy.contact}/>.</p>
    {confirm?<><p>Отозвать согласие и выйти?</p><button disabled={revoke.isPending} onClick={()=>revoke.mutate()}>Подтвердить отзыв</button><button disabled={revoke.isPending} onClick={()=>setConfirm(false)}>Отмена</button></>:<button onClick={()=>setConfirm(true)}>Отозвать основное согласие</button>}
    {revoke.error && <p role="alert">{revoke.error.message}</p>}
  </section>;
}
