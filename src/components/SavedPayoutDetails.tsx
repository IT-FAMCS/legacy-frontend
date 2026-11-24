import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptDataConsent, addSavedPayout, deleteSavedPayout, getSavedPayouts, revokeDataConsent } from "../api/personal-data";
import { useUserStore } from "../stores/user";
import { PolicyText } from "./PersonalData";
import { usePersonalDataStatus } from "../hooks/use-personal-data";
export function SavedPayoutDetails(){
  const client=useQueryClient();
  const uid=useUserStore(state=>state.user?.id);
  const status=usePersonalDataStatus();
  const rows=useQuery({queryKey:["saved-payouts",uid],queryFn:getSavedPayouts,enabled:status.data?.saved_details===true,staleTime:0,refetchOnWindowFocus:"always",refetchInterval:15000});
  useEffect(()=>{if(status.data?.saved_details===false)client.setQueryData(["saved-payouts",uid],[]);},[client,uid,status.data?.saved_details]);
  const [checkedVersion,setCheckedVersion]=useState<string|null>(null);
  const checked=checkedVersion===status.data?.policy.version;
  const [formKey,setFormKey]=useState(0);
  const [removing,setRemoving]=useState<number|null>(null);
  const refresh=async()=>{await Promise.all([client.invalidateQueries({queryKey:["saved-payouts"]}),client.invalidateQueries({queryKey:["personal-data"]})]);};
  const accept=useMutation({mutationFn:()=>acceptDataConsent("saved_details",status.data!.policy.version),onSuccess:refresh,onError:()=>void status.refetch()});
  const add=useMutation({mutationFn:addSavedPayout,onSuccess:async()=>{setFormKey(k=>k+1);await refresh();}});
  const remove=useMutation({mutationFn:deleteSavedPayout,onSuccess:async()=>{setRemoving(null);await refresh();}});
  const revoke=useMutation({mutationFn:()=>revokeDataConsent("saved_details"),onSuccess:async()=>{setCheckedVersion(null);await refresh();}});
  const busy=accept.isPending||add.isPending||remove.isPending||revoke.isPending;
  return <section className="personal-data"><h2>Сохранённые реквизиты ({rows.data?.length ?? 0}/3)</h2>
    <p>Белинвест — номер карты, другие банки — ЕРИП/номер счёта. Не указывайте CVV/CVC, PIN, коды подтверждения и пароли.</p>
    <p>Реквизиты доступны вам на сайте и в боте. В заявке можно выбрать сохранённые или ввести новые без сохранения.</p>
    {status.isPending||(status.data?.saved_details && rows.isPending)?<p role="status">Загрузка…</p>:status.error||rows.error?<p role="alert">{status.error?.message||rows.error?.message} <button onClick={()=>{void status.refetch();void rows.refetch();}}>Повторить</button></p>:!status.data?.saved_details?<>
      {status.data && <details><summary>Условия сохранения реквизитов</summary><PolicyText policy={status.data.policy}/></details>}
      <label><input type="checkbox" checked={checked} onChange={e=>setCheckedVersion(e.target.checked ? status.data!.policy.version : null)}/> Согласен на добровольное хранение до 3 реквизитов для повторного использования в заявках. Могу удалить записи или отозвать это согласие.</label>
      <button disabled={!checked||busy||!status.data?.policy.configured} onClick={()=>accept.mutate()}>Разрешить сохранение реквизитов</button>
    </>:<>
      <ul>{rows.data?.map(row=><li key={row.id}><strong>{row.label}</strong><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{row.details}</p>{removing===row.id?<><span>Удалить эти реквизиты?</span><button disabled={busy} onClick={()=>remove.mutate(row.id)}>Подтвердить удаление</button><button disabled={busy} onClick={()=>setRemoving(null)}>Отмена</button></>:<button disabled={busy} onClick={()=>setRemoving(row.id)}>Удалить</button>}</li>)}</ul>
      {(rows.data?.length ?? 0)<3?<form key={formKey} onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);add.mutate({label:String(data.get("label")),details:String(data.get("details"))});}}>
        <label>Название<input name="label" required maxLength={60} placeholder="Например, Белинвест"/></label>
        <label>Реквизиты<textarea name="details" required maxLength={500}/></label><button disabled={busy}>Сохранить реквизиты</button>
      </form>:<p>Сохранено максимум 3 реквизита. Чтобы добавить новые, удалите ненужные.</p>}
      <button disabled={busy} onClick={()=>{if(window.confirm("Отозвать согласие и удалить все сохранённые реквизиты?"))revoke.mutate();}}>Отозвать согласие на хранение реквизитов</button>
    </>}
    {[accept.error,add.error,remove.error,revoke.error].filter(Boolean).map((error,i)=><p role="alert" key={i}>{error!.message}</p>)}
  </section>;
}
