export function getErrorMessage(error: unknown): string {
  if (!error) return "Неизвестная ошибка";
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) return error.message;

  const value = error as Record<string, any>;
  const candidates = [
    value?.detail,
    value?.message,
    value?.error,
    value?.response?.data?.detail,
    value?.response?.data?.message,
    value?.data?.detail,
    value?.data?.message,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "string") return candidate;
    if (Array.isArray(candidate)) return candidate.map(getErrorMessage).join("; ");
    if (typeof candidate === "object") {
      const nested = getErrorMessage(candidate);
      if (nested !== "Неизвестная ошибка") return nested;
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
