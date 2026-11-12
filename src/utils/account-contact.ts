export type EducationFormat = "бюджет" | "платное";
export type ContactForm = { phone: string; education_format: string };

export function contactPayload(value: ContactForm) {
  return {
    phone: value.phone.trim() || null,
    education_format: (value.education_format || null) as EducationFormat | null,
  };
}

export function contactError(phone: string): string | null {
  const value = phone.trim();
  if (!value) return null;
  const digits = value.replace(/\D/g, "").length;
  return value.length > 40 || !/^[+0-9 ()-]+$/.test(value) || digits < 7 || digits > 15
    ? "Телефон: от 7 до 15 цифр, допустимы +, пробелы, скобки и дефисы."
    : null;
}
