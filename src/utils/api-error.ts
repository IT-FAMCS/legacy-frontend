export function extractErrorMessage(errorData: unknown): string {
  if (typeof errorData === "string") {
    return errorData;
  }

  if (!errorData || typeof errorData !== "object") {
    return "Неизвестная ошибка";
  }

  const data = errorData as Record<string, unknown>;

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((err) => {
        if (!err || typeof err !== "object") return "Неверное значение";
        const errRecord = err as Record<string, unknown>;
        const loc = Array.isArray(errRecord.loc)
          ? errRecord.loc.slice(1).join(".")
          : "Поле";
        const msg = typeof errRecord.msg === "string" ? errRecord.msg : "Неверное значение";
        return `${loc || "Поле"}: ${msg}`;
      })
      .join("; ");
  }

  if (data.detail && typeof data.detail === "object") {
    try {
      return JSON.stringify(data.detail);
    } catch {
      return "Ошибка запроса";
    }
  }

  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;

  try {
    return JSON.stringify(data);
  } catch {
    return "Ошибка запроса";
  }
}

export async function readErrorResponse(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => null);
    return extractErrorMessage(data) || `HTTP ${res.status}`;
  }

  const text = await res.text().catch(() => "");
  if (!text) return `HTTP ${res.status}`;

  try {
    return extractErrorMessage(JSON.parse(text)) || `HTTP ${res.status}`;
  } catch {
    return text;
  }
}
