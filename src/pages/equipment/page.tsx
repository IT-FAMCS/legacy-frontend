import { EquipmentDialog } from "./EquipmentDialog";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEquipment, deleteEquipment, EquipmentApiError, getEquipment, getEquipmentOptions, takeEquipment, updateEquipment } from "../../api/equipment";
import type { EquipmentInput, EquipmentItem } from "../../api/equipment";
import { EquipmentTable } from "./EquipmentTable";
import { EquipmentForm } from "./EquipmentForm";
import { EquipmentHistory } from "./EquipmentHistory";
import "./equipment.css";

export function EquipmentPage() {
  const client = useQueryClient();
  const [form, setForm] = useState<{ item: EquipmentItem | null } | null>(null);
  const [history, setHistory] = useState<EquipmentItem | null>(null);
  const [removing,setRemoving] = useState<EquipmentItem|null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const items = useQuery({ queryKey: ["equipment", "items"], queryFn: ({ signal }) => getEquipment(signal), refetchInterval: 30000 });
  const options = useQuery({ queryKey: ["equipment", "options"], queryFn: ({ signal }) => getEquipmentOptions(signal) });
  const refresh = () => client.invalidateQueries({ queryKey: ["equipment"] });
  const fail = (value: Error) => {
    setNotice(""); setError(value.message);
    if (value instanceof EquipmentApiError && value.status === 409) { setForm(null); setRemoving(null); }
    void refresh();
  };
  const take = useMutation({ mutationFn: takeEquipment, onError: fail,
    onSuccess: async item => { setError(""); setNotice(`Вы взяли «${item.name}». Время и держатель обновлены.`); await refresh(); } });
  const save = useMutation({ mutationFn: ({ item, data }: { item: EquipmentItem | null; data: EquipmentInput }) => item ? updateEquipment(item, data) : createEquipment(data),
    onError: fail, onSuccess: async () => { setForm(null); setError(""); setNotice("Предмет сохранён"); await refresh(); } });
  const openForm = (item: EquipmentItem | null) => { setError(""); save.reset(); setForm({ item }); };
  const remove = useMutation({mutationFn:deleteEquipment,onError:fail,onSuccess:async()=>{
    setRemoving(null);setError("");setNotice("Предмет удалён из списка. История сохранена.");await refresh();}});
  const busy = take.isPending || save.isPending || remove.isPending;
  const searchError = items.error || options.error;
  return <section className="equipment-page">
    <div className="equipment-heading"><div><h1>Оборудка</h1><p className="equipment-muted">Аппаратура, её местонахождение и история взятий.</p></div>
      {options.data?.can_manage && <button type="button" className="equipment-button equipment-primary" disabled={busy} onClick={() => openForm(null)}>Добавить предмет</button>}
    </div>
    <p className="equipment-hint">Забрали предмет? Нажмите «Взял предмет» — ваше имя и время запишутся автоматически.</p>
    {notice && <p className="equipment-feedback" role="status">{notice}</p>}
    {error && !form && <p className="equipment-error" role="alert">{error}</p>}
    {(items.isPending || options.isPending) && <p role="status">Загрузка оборудования…</p>}
    {searchError && <p className="equipment-error" role="alert">{searchError.message} <button className="equipment-button" onClick={() => void refresh()}>Повторить</button></p>}
    {items.data && options.data && <div className="equipment-surface">
      {items.data.length ? <EquipmentTable items={items.data} canManage={options.data.can_manage} canDelete={options.data.can_delete} pending={busy}
        onTake={item => { setError(""); setNotice(""); take.mutate(item); }} onEdit={openForm} onHistory={setHistory} onDelete={item=>{setError("");setRemoving(item);}} />
        : <div className="equipment-empty"><h2>Здесь пока нет аппаратуры</h2><p>{options.data.can_manage ? "Добавьте первый предмет, чтобы начать учёт." : "Руководители могут добавить предметы в таблицу."}</p></div>}
    </div>}
    {form && options.data?.can_manage && <EquipmentForm item={form.item} options={options.data} pending={save.isPending} error={error}
      onClose={() => setForm(null)} onSubmit={data => save.mutate({ item: form.item, data })} />}
    {removing && <EquipmentDialog title="Удалить предмет?" onClose={()=>setRemoving(null)} busy={remove.isPending}>
      <p className="equipment-delete-name">{removing.name}</p>
      <p className="equipment-muted">Предмет исчезнет из таблицы и аккаунта держателя. История взятий и передач сохранится.</p>
      {error && <p role="alert">{error}</p>}
      <div className="equipment-actions"><button className="equipment-button equipment-danger" disabled={remove.isPending} onClick={()=>remove.mutate(removing)}>
        {remove.isPending ? "Удаление…":"Удалить предмет"}</button>
        <button className="equipment-button" disabled={remove.isPending} onClick={()=>setRemoving(null)}>Отмена</button></div>
    </EquipmentDialog>}
    {history && <EquipmentHistory item={history} onClose={() => setHistory(null)} />}
  </section>;
}
