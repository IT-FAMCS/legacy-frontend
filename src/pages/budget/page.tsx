import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "../../stores/user";
import { BudgetApiError, getBudget, getPendingBudgetRequests, createBudgetEntry, updateBudgetEntry, updateBudgetRequestAmount } from "../../api/budget";
import type { Budget, BudgetEntry, BudgetEntryInput, BudgetRequest } from "../../api/budget";
import "./budget.css";

const months = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const byn = (value: string) => new Intl.NumberFormat("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value))+" BYN";
const date = (value: string) => new Intl.DateTimeFormat("ru-RU",{dateStyle:"short",timeStyle:"short",timeZone:"Europe/Moscow"}).format(new Date(value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value) ? value : value+"Z"));
const localInput = (value?: string) => {
  const utc=value ? new Date(value.endsWith("Z") ? value : value+"Z") : new Date();
  return new Date(utc.getTime()+3*3600000).toISOString().slice(0,16);
};

export function BudgetLedger({data,onEdit}: {data:Budget;onEdit:(entry:BudgetEntry)=>void}) {
  return <><div className="budget-balances">{(["cash","card"] as const).map(account=><article key={account}>
    <span>{account==="cash" ? "Наличные" : "На карте"}</span><strong className={Number(data.balances[account])<0 ? "budget-negative" : ""}>{byn(data.balances[account])}</strong>
  </article>)}</div>
  {!data.years.length && <div className="budget-empty">Операций пока нет. Начальный баланс — 0,00 BYN.</div>}
  {data.years.map(year=><section key={year.year} className="budget-year"><h2>{year.year}</h2>{year.months.map(month=><section key={month.month} className="budget-month"><h3>{months[month.month-1]}</h3>
    <div className="budget-scroll"><table><thead><tr><th>Дата</th><th>Операция</th><th>Счёт</th><th>Описание</th><th>Сумма</th><th>Изменение</th></tr></thead><tbody>
    {month.entries.map(entry=><tr key={entry.id}><td>{date(entry.operation_at)}</td><td>{entry.direction==="income" ? "Приход" : "Расход"}</td><td>{entry.account==="cash" ? "Наличные" : "Карта"}</td>
      <td className="budget-description">{entry.description}{entry.request_id && <small>Заявка №{entry.request_id}</small>}</td><td className={entry.direction==="expense" ? "budget-negative" : "budget-positive"}>{entry.direction==="expense" ? "−" : "+"}{byn(entry.amount)}</td>
      <td><button onClick={()=>onEdit(entry)} aria-label={`Изменить операцию ${entry.id}`}>Изменить</button><small>Пользователь №{entry.updated_by}<br/>{date(entry.updated_at)}</small></td></tr>)}
    </tbody></table></div></section>)}</section>)}</>;
}

export function BudgetRequests({requests,onEdit}: {requests:BudgetRequest[];onEdit:(request:BudgetRequest)=>void}) {
  return <><p className="budget-muted">Решения по заявкам принимаются казначеями в Telegram.</p>{!requests.length && <div className="budget-empty">Необработанных заявок нет.</div>}
  {requests.map(row=><article className="budget-request" key={row.id}><div className="budget-request-title"><h2>№{row.id} · {row.request_type==="reimbursement" ? "Возврат денег" : "Пополнение"}</h2><span>Ожидает обработки · {date(row.created_at)}</span></div>
    <p><strong>{row.applicant_name}</strong> · {row.departments.join(", ") || "Отдел не указан"}</p><p className="budget-description">{row.description}</p>
    <p>Сумма: <strong>{byn(row.amount)}</strong> · При подаче: {byn(row.submitted_amount)}</p>{row.payout_details && <p className="budget-description">Реквизиты: {row.payout_details}</p>}
    {!!row.amount_changes.length && <details><summary>История исправлений ({row.amount_changes.length})</summary><ul>{row.amount_changes.map((change,i)=><li key={i}>{byn(change.old_amount)} → {byn(change.new_amount)} · пользователь №{change.editor_id} · {date(change.created_at)}</li>)}</ul></details>}
    <button onClick={()=>onEdit(row)}>Изменить сумму</button></article>)}</>;
}

export function BudgetPage() {
  const allowed=useUserStore(s=>s.user?.can_view_budget===true);
  const client=useQueryClient();
  const [tab,setTab]=useState<"ledger"|"requests">("ledger");
  const [form,setForm]=useState<{entry:BudgetEntry|null}|null>(null);
  const [request,setRequest]=useState<BudgetRequest|null>(null);
  const [notice,setNotice]=useState("");
  const budget=useQuery({queryKey:["budget","ledger"],queryFn:({signal})=>getBudget({signal}),enabled:allowed,refetchInterval:30000});
  const requests=useQuery({queryKey:["budget","requests"],queryFn:({signal})=>getPendingBudgetRequests({signal}),enabled:allowed,refetchInterval:15000});
  const refresh=()=>client.invalidateQueries({queryKey:["budget"]});
  const save=useMutation({mutationFn:({entry,payload}:{entry:BudgetEntry|null;payload:BudgetEntryInput})=>entry ? updateBudgetEntry({id:entry.id,payload}) : createBudgetEntry(payload),
    onSuccess:async()=>{setForm(null);setNotice("Операция сохранена. Баланс пересчитан.");await refresh();}});
  const correct=useMutation({mutationFn:updateBudgetRequestAmount,onSuccess:async()=>{setRequest(null);setNotice("Сумма исправлена. Казначеи получат обновлённые данные.");await refresh();},onError:()=>void refresh()});
  const forbidden=[budget.error,requests.error,save.error,correct.error].some(error=>error instanceof BudgetApiError && error.status===403);
  useEffect(()=>{if(forbidden) useUserStore.setState(state=>({user:{...state.user,can_view_budget:false}}));},[forbidden]);
  if (!allowed || forbidden) return <section className="budget-page"><h1>Бюджет</h1><p>Доступ только для администратора, председателя, заместителей и казначеев.</p></section>;
  return <section className="budget-page"><div className="budget-heading"><div><h1>Бюджет</h1><p className="budget-muted">Средства актива · белорусские рубли</p></div><button className="budget-primary" onClick={()=>{save.reset();setForm({entry:null});}}>Добавить операцию</button></div>
    {notice && <p role="status">{notice}</p>}
    <div className="budget-tabs" role="tablist" aria-label="Раздел бюджета"><button role="tab" aria-selected={tab==="ledger"} onClick={()=>setTab("ledger")}>Операции</button><button role="tab" aria-selected={tab==="requests"} onClick={()=>setTab("requests")}>Заявки ({requests.data?.length ?? 0})</button></div>
    {(budget.error || requests.error) && <p role="alert">{budget.error?.message || requests.error?.message} <button onClick={()=>void refresh()}>Повторить</button></p>}
    {budget.isPending && <p role="status">Загрузка бюджета…</p>}
    {tab==="ledger" && budget.data && <BudgetLedger data={budget.data} onEdit={entry=>{save.reset();setForm({entry});}}/>}
    {tab==="requests" && (requests.isPending ? <p>Загрузка заявок…</p> : <BudgetRequests requests={requests.data || []} onEdit={row=>{correct.reset();setRequest(row);}}/>)}
    {form && <div className="budget-overlay"><div role="dialog" aria-modal="true" aria-labelledby="budget-form-title" className="budget-dialog"><h2 id="budget-form-title">{form.entry ? "Изменить операцию" : "Новая операция"}</h2>
      <form onSubmit={event=>{event.preventDefault();const values=new FormData(event.currentTarget);save.mutate({entry:form.entry,payload:{direction:values.get("direction") as BudgetEntryInput["direction"],account:values.get("account") as BudgetEntryInput["account"],amount:String(values.get("amount")).replace(",","."),description:String(values.get("description")),operation_at:new Date(String(values.get("operation_at"))+":00+03:00").toISOString()}});}}>
        <label>Операция<select name="direction" defaultValue={form.entry?.direction || "expense"}><option value="expense">Расход</option><option value="income">Приход</option></select></label>
        <label>Счёт<select name="account" defaultValue={form.entry?.account || "cash"}><option value="cash">Наличные</option><option value="card">Карта</option></select></label>
        <label>Сумма, BYN<input name="amount" inputMode="decimal" required pattern="[0-9]+([.,][0-9]{1,2})?" defaultValue={form.entry?.amount || ""}/></label>
        <label>Дата и время (Москва)<input type="datetime-local" name="operation_at" required defaultValue={localInput(form.entry?.operation_at)}/></label>
        <label>Описание<textarea name="description" required maxLength={2000} defaultValue={form.entry?.description || ""}/></label>
        {save.error && <p role="alert">{save.error.message}</p>}<div className="budget-actions"><button type="button" disabled={save.isPending} onClick={()=>setForm(null)}>Отмена</button><button className="budget-primary" disabled={save.isPending}>Сохранить</button></div>
      </form></div></div>}
    {request && <div className="budget-overlay"><div role="dialog" aria-modal="true" aria-labelledby="budget-amount-title" className="budget-dialog"><h2 id="budget-amount-title">Сумма заявки №{request.id}</h2><form onSubmit={event=>{event.preventDefault();correct.mutate({id:request.id,amount:String(new FormData(event.currentTarget).get("amount")).replace(",",".")});}}>
      <label>Сумма, BYN<input name="amount" inputMode="decimal" required pattern="[0-9]+([.,][0-9]{1,2})?" defaultValue={request.amount}/></label>{correct.error && <p role="alert">{correct.error.message}</p>}
      <div className="budget-actions"><button type="button" disabled={correct.isPending} onClick={()=>setRequest(null)}>Отмена</button><button className="budget-primary" disabled={correct.isPending}>Сохранить</button></div></form></div></div>}
  </section>;
}
