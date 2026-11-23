import { useMutation } from "@tanstack/react-query";
import type { Treasurer } from "../../api/budget";
import { BudgetApiError, setTreasurerBalance } from "../../api/budget";
import { useState } from "react";
const byn=(value:string)=>new Intl.NumberFormat("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value))+" BYN";
export function TreasurerSelect({people,value}:{people:Treasurer[];value?:number|null}) {
  return <label>Казначей<select name="treasurer_id" defaultValue={value ?? ""}><option value="">Не указан</option>{value != null && !people.some(person=>person.user_id===value) && <option value={value}>Пользователь №{value}</option>}{people.filter(person=>person.can_select!==false || person.user_id===value).map(person=><option key={person.user_id} value={person.user_id}>{person.name}{!person.is_treasurer ? " (другой держатель средств)" : ""}</option>)}</select></label>;
}
export function Treasurers({people,onRefresh}:{people:Treasurer[];onRefresh:()=>Promise<unknown>}) {
  const [editing,setEditing]=useState<{person:Treasurer;account:"cash"|"card"}|null>(null);
  const [notice,setNotice]=useState("");
  const save=useMutation({mutationFn:setTreasurerBalance,onSuccess:async()=>{setEditing(null);await onRefresh();},onError:error=>{if(error instanceof BudgetApiError && error.status===409){setEditing(null);setNotice("Остаток изменился. Данные обновлены; откройте установку суммы заново.");}void onRefresh();}});
  return <>{notice && <p role="status">{notice}</p>}<p className="budget-muted">Остатки учитывают казначея операции. Ручная установка меняет личный остаток; следующие операции прибавляются к нему. Общий бюджет рассчитывается по операциям, поэтому личные остатки после ручных установок могут отличаться от него.</p>
    {!people.length && <p>Казначеи пока не назначены.</p>}
    <div className="budget-treasurers">{people.map(person=><article className="budget-request" key={person.user_id}><h2><a href={`/user/${encodeURIComponent(person.login)}`}>{person.name}</a></h2>{!person.is_treasurer && <small>Другой держатель средств</small>}
      {(["cash","card"] as const).map(account=><div key={account} className="budget-custody-row"><span>{account==="cash" ? "Наличные" : "Карта"}</span><strong className={Number(person.balances[account])<0 ? "budget-negative" : ""}>{byn(person.balances[account])}</strong>{person.can_edit && <button onClick={()=>{save.reset();setEditing({person,account});}}>Установить {account==="cash" ? "наличные" : "карту"}</button>}</div>)}
    </article>)}</div>
    {editing && <div className="budget-overlay"><div className="budget-dialog" role="dialog" aria-modal="true" aria-label="Установить остаток"><h2>{editing.person.name}: {editing.account==="cash" ? "наличные" : "карта"}</h2><form onSubmit={event=>{event.preventDefault();save.mutate({id:editing.person.user_id,account:editing.account,amount:String(new FormData(event.currentTarget).get("amount")).replace(",","."),expected_balance:editing.person.balances[editing.account]});}}>
      <label>Текущий остаток, BYN<input autoFocus name="amount" required inputMode="decimal" pattern="-?[0-9]+([.,][0-9]{1,2})?" defaultValue={editing.person.balances[editing.account]}/></label>
      {save.error && <p role="alert">{save.error.message}</p>}<div className="budget-actions"><button type="button" disabled={save.isPending} onClick={()=>setEditing(null)}>Отмена</button><button disabled={save.isPending}>Установить</button></div>
    </form></div></div>}
  </>;
}
