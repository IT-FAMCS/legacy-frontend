import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getEquipment } from "../api/equipment";
import { formatDateTime } from "../utils/date";
import "./account-panels.css";

export function ProfileEquipment({userId}: {userId:number}) {
  const query=useQuery({queryKey:["equipment","items"],queryFn:({signal})=>getEquipment(signal),staleTime:0});
  const items=query.data?.filter(item=>item.holder_user?.id === userId) || [];
  if (query.isPending) return <p role="status">Загрузка оборудования…</p>;
  if (query.error) return <p role="alert">Не удалось загрузить оборудование: {query.error.message}</p>;
  if (!items.length) return null;
  return <section className="account-section" aria-label="Оборудование у пользователя">
    <div className="account-section-heading"><div><h3>Оборудование</h3><p>Сейчас находится у пользователя</p></div><Link to="/equipment">Вся оборудка →</Link></div>
    <ul className="profile-equipment-list">{items.map(item=><li key={item.id}><div><Link to="/equipment"><strong>{item.name}</strong></Link>
      {item.description && <p>{item.description}</p>}</div><span>Взято {formatDateTime(item.taken_at)}</span></li>)}</ul>
  </section>;
}
