import type { ContactForm } from "../utils/account-contact";

export function AccountContactFields({ phone, education_format, onChange }: ContactForm & {
  onChange: (value: ContactForm) => void;
}) {
  const style = { padding: "8px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" };
  const labelStyle = { display: "flex", flexDirection: "column" as const, gap: "4px" };
  return <>
    <label style={labelStyle}>Телефон
      <input type="tel" name="phone" maxLength={40} value={phone} style={style}
        onChange={e => onChange({ phone: e.target.value, education_format })} />
    </label>
    <label style={labelStyle}>Форма обучения
      <select name="education_format" value={education_format} style={style}
        onChange={e => onChange({ phone, education_format: e.target.value })}>
        <option value="">Не указан</option>
        <option value="бюджет">Бюджет</option>
        <option value="платное">Платное</option>
      </select>
    </label>
  </>;
}
