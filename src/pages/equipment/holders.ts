import type { EquipmentOptions } from "../../api/equipment";

export function filterHolders(options: Pick<EquipmentOptions, "users" | "locations">, query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  return [
    ...options.locations.map(location => ({ value: `location:${location.id}`, label: location.name, detail: "Место хранения" })),
    ...options.users.map(user => ({ value: `user:${user.id}`, label: user.name, detail: `@${user.login}` })),
  ].filter(value => `${value.label} ${value.detail}`.toLocaleLowerCase().includes(normalized));
}

export function dateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(/Z$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
