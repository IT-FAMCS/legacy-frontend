import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { previewBudgetImport, commitBudgetImport } from "../../api/budget";
import type { Treasurer } from "../../api/budget";
import { TreasurerSelect } from "./treasurers";
export function BudgetImportButton({allowed,onClick}:{allowed:boolean;onClick:()=>void}) {
  return allowed ? <button onClick={onClick}>Импорт Google Sheets</button> : null;
}
export function BudgetImportDialog({people,onClose,onDone}:{people:Treasurer[];onClose:()=>void;onDone:(count:number)=>Promise<void>}) {
  const [selection,setSelection]=useState({account:"",holder:""});
  const [committed,setCommitted]=useState(false);
  const preview=useMutation({mutationFn:previewBudgetImport});
  const commit=useMutation({mutationFn:commitBudgetImport,onSuccess:async result=>{setCommitted(true);await onDone(result.created_count);}});
  const pending=preview.isPending || commit.isPending || committed;
  return <div className="budget-overlay"><div role="dialog" aria-modal="true" aria-labelledby="budget-import-title" className="budget-dialog budget-import-dialog"><h2 id="budget-import-title">Импорт Google Sheets</h2>
    <p>Таблица должна быть доступна по ссылке для чтения. «Статья» станет описанием, «Доход» — плюсом, «Расход» — минусом. Будут прочитаны все листы с операциями.</p>
    {!preview.data ? <form onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);setSelection({account:form.get("account")==="cash" ? "Наличные" : "Карта",holder:people.find(person=>person.user_id===Number(form.get("treasurer_id")))?.name || "Не указан"});preview.mutate({url:String(form.get("url")),account:form.get("account") as "cash"|"card",treasurer_id:form.get("treasurer_id") ? Number(form.get("treasurer_id")) : null,...(form.get("fallback_month") ? {fallback_month:String(form.get("fallback_month"))} : {})});}}>
      <label>Ссылка на таблицу<input name="url" type="url" required placeholder="https://docs.google.com/spreadsheets/d/…"/></label>
      <label>Счёт для всех импортируемых операций<select name="account" required defaultValue=""><option value="" disabled>Выберите счёт</option><option value="cash">Наличные</option><option value="card">Карта</option></select></label>
      <TreasurerSelect people={people}/><label>Месяц для листов без даты и месяца в названии<input type="month" name="fallback_month"/></label>
      {preview.error && <p role="alert">{preview.error.message}</p>}<div className="budget-actions"><button type="button" disabled={pending} onClick={onClose}>Отмена</button><button disabled={pending}>Прочитать таблицу</button></div>
    </form> : <><p>Счёт: {selection.account}. Казначей: {selection.holder}.</p><p>Новых операций: {preview.data.new_count}; уже загружено: {preview.data.skipped_count}; конфликтов: {preview.data.conflict_count}.</p><p>Доход: +{preview.data.income_total} BYN · Расход: −{preview.data.expense_total} BYN</p>
      <p>Если точной даты нет, используется первое число месяца из названия листа (московское время). Один счёт и выбранный казначей применяются ко всем строкам. Пустой казначей влияет только на общий бюджет.</p>
      {!!preview.data.skipped_sheets.length && <p>Листы без операций пропущены: {preview.data.skipped_sheets.join(", ")}</p>}
      {!!preview.data.conflict_count && <p role="alert">Ранее импортированные строки изменились. Для повторного импорта восстановите исходные строки в Google-таблице. Изменения в бюджете внесите вручную.</p>}
      <div className="budget-scroll"><table><thead><tr><th>Лист / строка</th><th>Дата</th><th>Описание</th><th>Сумма, BYN</th><th>Статус</th></tr></thead><tbody>{preview.data.rows.map((row,index)=><tr key={index}><td>{row.sheet} / {row.source_row}</td><td>{new Intl.DateTimeFormat("ru-RU",{timeZone:"Europe/Moscow"}).format(new Date(row.operation_at+"Z"))}{row.approximate_date ? " (месяц)" : ""}</td><td>{row.description}</td><td>{row.direction==="income" ? "+" : "−"}{row.amount}</td><td>{row.status==="new" ? "Новая" : row.status==="skipped" ? "Уже загружена" : "Конфликт"}</td></tr>)}</tbody></table></div>
      {commit.error && <p role="alert">{commit.error.message}</p>}<div className="budget-actions"><button disabled={pending} onClick={()=>{preview.reset();commit.reset();}}>Назад</button><button disabled={pending} onClick={onClose}>Закрыть</button><button className="budget-primary" disabled={pending || preview.data.conflict_count>0 || !preview.data.new_count} onClick={()=>commit.mutate(preview.data!.id)}>Импортировать {preview.data.new_count} операций</button></div></>}
  </div></div>;
}
