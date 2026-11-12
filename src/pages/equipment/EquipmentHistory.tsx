import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getEquipmentHistory } from "../../api/equipment";
import type { EquipmentEvent, EquipmentItem } from "../../api/equipment";
import { formatDateTime } from "../../utils/date";
import { EquipmentDialog } from "./EquipmentDialog";

const labels = { created: "Добавление предмета", taken: "Взятие предмета", assigned: "Ручное изменение" };
export function EquipmentHistoryContent({ events }: { events: EquipmentEvent[] }) {
  if (!events.length) return <p>История пока пуста.</p>;
  return <div className="equipment-table-scroll"><table className="equipment-table equipment-history-table">
    <caption className="equipment-sr-only">История перемещений, новые записи сверху</caption>
    <thead><tr><th scope="col">Когда записано</th><th scope="col">Действие</th><th scope="col">У кого / где</th>
      <th scope="col">Дата взятия</th><th scope="col">Кто записал</th></tr></thead>
    <tbody>{events.map(event => <tr key={event.id}>
      <td>{formatDateTime(event.recorded_at)}</td><td>{labels[event.action]}</td>
      <td>{event.holder_login ? <Link to={`/user/${encodeURIComponent(event.holder_login)}`}>{event.holder_name}</Link> : event.holder_name}</td>
      <td>{formatDateTime(event.taken_at, "—")}</td>
      <td><Link to={`/user/${encodeURIComponent(event.actor_login)}`}>{event.actor_name}</Link></td>
    </tr>)}</tbody>
  </table></div>;
}

export function EquipmentHistory({ item, onClose }: { item: EquipmentItem; onClose: () => void }) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["equipment", "history", item.id],
    queryFn: ({ signal }) => getEquipmentHistory(item.id, signal), staleTime: 0,
  });
  return <EquipmentDialog title={`История: ${item.name}`} onClose={onClose}>
    <p className="equipment-muted">Все взятия, передачи и исправления даты. Новые записи сверху.</p>
    {isPending && <p role="status">Загрузка истории…</p>}
    {error && <p role="alert">{error.message} <button className="equipment-button" onClick={() => void refetch()}>Повторить</button></p>}
    {data && <EquipmentHistoryContent events={data} />}
  </EquipmentDialog>;
}
