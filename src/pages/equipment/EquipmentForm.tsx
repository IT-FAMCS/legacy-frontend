import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEquipmentLocation } from "../../api/equipment";
import type { EquipmentInput, EquipmentItem, EquipmentOptions } from "../../api/equipment";
import { EquipmentDialog } from "./EquipmentDialog";
import { dateInputValue, filterHolders } from "./holders";

export function EquipmentForm({ item, options, pending, error, onSubmit, onClose }: {
  item: EquipmentItem | null; options: EquipmentOptions; pending: boolean; error: string;
  onSubmit: (input: EquipmentInput) => void; onClose: () => void;
}) {
  const id = useId();
  const client = useQueryClient();
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [holder, setHolder] = useState(item?.holder_user ? `user:${item.holder_user.id}` : `location:${item?.location?.id || options.default_location_id}`);
  const [query, setQuery] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [date, setDate] = useState(dateInputValue(item?.taken_at || null));
  const [localError, setLocalError] = useState("");
  const createLocation = useMutation({
    mutationFn: createEquipmentLocation,
    onSuccess: async location => {
      client.setQueryData<EquipmentOptions>(["equipment", "options"], previous => previous
        ? { ...previous, locations: [...previous.locations, location] } : previous);
      setHolder(`location:${location.id}`); setDate(""); setQuery(""); setNewLocation("");
      await client.invalidateQueries({ queryKey: ["equipment", "options"] });
    },
  });
  const busy = pending || createLocation.isPending;
  const choices = filterHolders(options, query);
  const selected = filterHolders(options, "").find(value => value.value === holder);
  const unavailable = item?.holder_user && holder === `user:${item.holder_user.id}` && !selected;
  const submit = (event: React.FormEvent) => {
    event.preventDefault(); setLocalError("");
    if (!name.trim()) { setLocalError("Укажите название предмета"); return; }
    const [kind, rawId] = holder.split(":");
    const input: EquipmentInput = { name: name.trim(), description: description.trim(),
      holder_user_id: kind === "user" ? Number(rawId) : null,
      location_id: kind === "location" ? Number(rawId) : null };
    if (kind === "user" && date && (date !== dateInputValue(item?.taken_at || null) || input.holder_user_id !== item?.holder_user?.id)) {
      input.taken_at = new Date(date).toISOString();
    }
    // An inactive existing holder remains visible; detail-only edits must not reassign them.
    if (unavailable) {
      const details = { name: input.name, description: input.description };
      onSubmit(details);
      return;
    }
    onSubmit(input);
  };
  return <EquipmentDialog title={item ? `Редактировать: ${item.name}` : "Добавить предмет"} onClose={onClose} busy={busy}>
    <form className="equipment-form" onSubmit={submit}>
      <label htmlFor={`${id}-name`}>Название</label>
      <input id={`${id}-name`} autoFocus required maxLength={200} value={name} disabled={busy} onChange={event => setName(event.target.value)} />
      <label htmlFor={`${id}-description`}>Описание</label>
      <textarea id={`${id}-description`} maxLength={5000} rows={3} value={description} disabled={busy} onChange={event => setDescription(event.target.value)} />
      <fieldset disabled={busy}>
        <legend>У кого / где находится</legend>
        <p className="equipment-selected">Выбрано: <strong>{selected?.label || item?.holder_user?.name || "—"}</strong>
          {unavailable && <span> (пользователь неактивен — выберите нового держателя для передачи)</span>}</p>
        <label htmlFor={`${id}-search`}>Поиск пользователя или места</label>
        <input id={`${id}-search`} type="search" placeholder="Имя, логин или место хранения" value={query} onChange={event => setQuery(event.target.value)} />
        <div className="equipment-holder-options" role="group" aria-label="Выберите держателя">
          {choices.map(choice => <button type="button" key={choice.value} className="equipment-holder-choice"
            aria-pressed={holder === choice.value} onClick={() => { if (holder !== choice.value) setDate(""); setHolder(choice.value); }}>
            <span>{choice.label}</span><small>{choice.detail}</small>
          </button>)}
          {!choices.length && <p>Ничего не найдено. Можно добавить новое место хранения ниже.</p>}
        </div>
        <label htmlFor={`${id}-location`}>Новое место хранения</label>
        <div className="equipment-inline"><input id={`${id}-location`} placeholder="Например, на складе" maxLength={120} value={newLocation} onChange={event => setNewLocation(event.target.value)} />
          <button type="button" className="equipment-button" disabled={!newLocation.trim() || busy}
            onClick={() => createLocation.mutate(newLocation.trim())}>Добавить место</button></div>
        {createLocation.error && <p role="alert">{createLocation.error.message}</p>}
      </fieldset>
      {holder.startsWith("user:") && !unavailable && <>
        <label htmlFor={`${id}-date`}>Дата и время взятия</label>
        <input id={`${id}-date`} type="datetime-local" step="1" value={date} disabled={busy} onChange={event => setDate(event.target.value)} />
        <small className="equipment-muted">В вашем часовом поясе. При передаче без даты запишется текущее время.</small>
      </>}
      {(localError || error) && <p role="alert">{localError || error}</p>}
      <div className="equipment-actions"><button type="submit" className="equipment-button equipment-primary" disabled={busy}>{pending ? "Сохранение…" : "Сохранить"}</button>
        <button type="button" className="equipment-button" disabled={busy} onClick={onClose}>Отмена</button></div>
    </form>
  </EquipmentDialog>;
}
