import { Link } from "react-router";
import type { EquipmentItem } from "../../api/equipment";
import { formatDateTime } from "../../utils/date";

export function EquipmentTable({ items, canManage, pending, onTake, onEdit, onHistory }: {
  items: EquipmentItem[]; canManage: boolean; pending: boolean;
  onTake: (item: EquipmentItem) => void; onEdit: (item: EquipmentItem) => void;
  onHistory: (item: EquipmentItem) => void;
}) {
  return <div className="equipment-table-scroll"><table className="equipment-table">
    <caption className="equipment-sr-only">Аппаратура и её текущее местонахождение</caption>
    <thead><tr><th scope="col">Название</th><th scope="col">Описание</th><th scope="col">У кого / где</th>
      <th scope="col">Когда взят</th><th scope="col">Действия</th></tr></thead>
    <tbody>{items.map(item => <tr key={item.id}>
      <th scope="row">{item.name}</th><td className="equipment-description">{item.description || "—"}</td>
      <td>{item.holder_user
        ? <Link to={`/user/${encodeURIComponent(item.holder_user.login)}`}>{item.holder_user.name}</Link>
        : <span className="equipment-location-label">{item.location?.name || "—"}</span>}</td>
      <td>{item.taken_at ? formatDateTime(item.taken_at) : "Ещё не взят"}</td>
      <td><div className="equipment-actions">
        <button type="button" className="equipment-button equipment-primary" disabled={pending} onClick={() => onTake(item)}>Взял предмет</button>
        <button type="button" className="equipment-button" onClick={() => onHistory(item)} aria-label={`История: ${item.name}`}>История</button>
        {canManage && <button type="button" className="equipment-button" disabled={pending} onClick={() => onEdit(item)}>Редактировать</button>}
      </div></td>
    </tr>)}</tbody>
  </table></div>;
}
