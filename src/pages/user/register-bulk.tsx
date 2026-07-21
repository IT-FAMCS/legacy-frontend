import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getPositions, getDepartments, getUsers, registerUsersBulk, type BulkUserRegisterData } from "../../api/user";
import { useErrorStore } from "../../stores/error";
import { useCanRegisterUsers } from "../../hooks/use-permissions";
import Button from "../../components/Button";
import { ErrorBanner } from "../../components/ErrorBanner";
import { parseCsv, downloadCsv } from "../../utils/csv";

type ColumnDef = { key: string; label: string; required: boolean };

const COLUMNS: ColumnDef[] = [
  { key: "login", label: "Логин", required: true },
  { key: "password", label: "Пароль", required: true },
  { key: "last_name", label: "Фамилия", required: true },
  { key: "first_name", label: "Имя", required: true },
  { key: "middle_name", label: "Отчество", required: false },
  { key: "position", label: "Должность", required: true },
  { key: "department", label: "Отделы (через ;)", required: false },
  { key: "course", label: "Курс", required: false },
  { key: "group", label: "Группа", required: false },
  { key: "birth_date", label: "Дата рождения (ГГГГ-ММ-ДД)", required: false },
  { key: "telegram", label: "Telegram", required: false },
];

const EXAMPLE_ROWS = [
  ["ivanov", "Passw0rd1", "Иванов", "Иван", "Иванович", "участник", "IT", "2", "ИТ-21", "2004-05-14", "@ivanov"],
  ["petrova", "Passw0rd2", "Петрова", "Мария", "", "участник", "IT;SMM", "1", "ИТ-11", "", ""],
];

type ParsedRow = {
  rowNumber: number;
  errors: string[];
  login: string;
  fullName: string;
  positionLabel: string;
  departmentLabel: string;
  course: string;
  group: string;
  birthDateLabel: string;
  telegram: string;
  resolved?: BulkUserRegisterData;
};

type Department = { id: number; name: string };

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

export function RegisterBulkPage() {
  const navigate = useNavigate();
  const error = useErrorStore((s) => s.error);
  const success = useErrorStore((s) => s.success);
  const setError = useErrorStore((s) => s.setError);
  const setSuccess = useErrorStore((s) => s.setSuccess);
  const canRegisterUsers = useCanRegisterUsers();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [createdCredentials, setCreatedCredentials] = useState<{ login: string; password: string; fullName: string }[] | null>(null);

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: ({ signal }) => getPositions({ signal }),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: ({ signal }) => getDepartments({ signal }),
  });

  const { data: existingUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: ({ signal }) => getUsers({ signal }),
  });

  const handleDownloadTemplate = () => {
    downloadCsv("шаблон_массовой_регистрации.csv", [
      COLUMNS.map((c) => c.label),
      ...EXAMPLE_ROWS,
    ]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileError(null);
    setCreatedCredentials(null);

    const text = await file.text();
    const csvRows = parseCsv(text);

    if (csvRows.length === 0) {
      setFileError("Файл пуст");
      setRows([]);
      return;
    }

    const header = csvRows[0].map(normalizeHeader);
    const columnIndex: Record<string, number> = {};
    for (const col of COLUMNS) {
      const idx = header.indexOf(normalizeHeader(col.label));
      if (idx !== -1) columnIndex[col.key] = idx;
    }

    const missingRequired = COLUMNS.filter((c) => c.required && !(c.key in columnIndex));
    if (missingRequired.length > 0) {
      setFileError(
        `В файле не найдены обязательные колонки: ${missingRequired.map((c) => `«${c.label}»`).join(", ")}. Скачайте пример и сверьте заголовки.`
      );
      setRows([]);
      return;
    }

    const existingLogins = new Set(existingUsers.map((u: { login: string }) => u.login));
    const dataRows = csvRows.slice(1);
    const loginCounts: Record<string, number> = {};
    for (const raw of dataRows) {
      const login = (raw[columnIndex.login] || "").trim();
      if (login) loginCounts[login] = (loginCounts[login] || 0) + 1;
    }

    const parsed: ParsedRow[] = dataRows.map((raw, i) => {
      const get = (key: string) => (columnIndex[key] !== undefined ? (raw[columnIndex[key]] || "").trim() : "");
      const errors: string[] = [];

      const login = get("login");
      const password = get("password");
      const lastName = get("last_name");
      const firstName = get("first_name");
      const middleName = get("middle_name");
      const positionRaw = get("position");
      const departmentRaw = get("department");
      const course = get("course");
      const group = get("group");
      const birthDate = get("birth_date");
      const telegram = get("telegram");

      if (!login) errors.push("не указан логин");
      else if (login.length < 3 || login.length > 50) errors.push("логин должен быть от 3 до 50 символов");
      else if (loginCounts[login] > 1) errors.push("логин повторяется в файле");
      else if (existingLogins.has(login)) errors.push("такой логин уже существует");

      if (!password) errors.push("не указан пароль");
      else if (password.length < 6) errors.push("пароль короче 6 символов");

      if (!lastName) errors.push("не указана фамилия");
      if (!firstName) errors.push("не указано имя");

      let matchedPosition: { id: number; name: string } | undefined;
      if (!positionRaw) {
        errors.push("не указана должность");
      } else {
        matchedPosition = positions.find((p) => normalizeHeader(p.name) === normalizeHeader(positionRaw));
        if (!matchedPosition) errors.push(`неизвестная должность «${positionRaw}»`);
      }

      const departmentIds: number[] = [];
      const departmentNames: string[] = [];
      if (departmentRaw) {
        for (const piece of departmentRaw.split(";")) {
          const name = piece.trim();
          if (!name) continue;
          const match = departments.find((d: Department) => normalizeHeader(d.name) === normalizeHeader(name));
          if (!match) {
            errors.push(`неизвестный отдел «${name}»`);
          } else {
            departmentIds.push(match.id);
            departmentNames.push(match.name);
          }
        }
      }

      let birthDateIso: string | undefined;
      if (birthDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
          errors.push("дата рождения должна быть в формате ГГГГ-ММ-ДД");
        } else {
          birthDateIso = `${birthDate}T00:00:00`;
        }
      }

      const resolved: BulkUserRegisterData | undefined =
        errors.length === 0
          ? {
              login,
              password,
              first_name: firstName,
              last_name: lastName,
              middle_name: middleName || undefined,
              position: matchedPosition!.name,
              department_ids: departmentIds.length > 0 ? departmentIds : undefined,
              course: course || undefined,
              group: group || undefined,
              birth_date: birthDateIso,
              telegram: telegram || undefined,
            }
          : undefined;

      return {
        rowNumber: i + 2, // +1 for header row, +1 for 1-based display
        errors,
        login: login || "—",
        fullName: [lastName, firstName, middleName].filter(Boolean).join(" ") || "—",
        positionLabel: matchedPosition?.name || positionRaw || "—",
        departmentLabel: departmentNames.join(", ") || "—",
        course: course || "—",
        group: group || "—",
        birthDateLabel: birthDate || "—",
        telegram: telegram || "—",
        resolved,
      };
    });

    setRows(parsed);
  };

  const validRows = rows.filter((r) => r.errors.length === 0);
  const hasErrors = rows.length > 0 && rows.some((r) => r.errors.length > 0);

  const bulkMutation = useMutation({
    mutationFn: () => registerUsersBulk({ users: validRows.map((r) => r.resolved!) }),
    onSuccess: () => {
      setCreatedCredentials(
        validRows.map((r) => ({ login: r.login, password: r.resolved!.password, fullName: r.fullName }))
      );
      setSuccess(`Зарегистрировано аккаунтов: ${validRows.length}`);
      setRows([]);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при массовой регистрации");
    },
  });

  const handleDownloadCredentials = () => {
    if (!createdCredentials) return;
    downloadCsv("новые_аккаунты.csv", [
      ["Логин", "Пароль", "ФИО"],
      ...createdCredentials.map((c) => [c.login, c.password, c.fullName]),
    ]);
  };

  if (!canRegisterUsers) {
    return (
      <>
        <ErrorBanner error={error} success={success} onClose={() => { setError(null); setSuccess(null); }} />
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "safe center",
          minHeight: "calc(100vh - var(--header-height))",
          padding: "20px",
          boxSizing: "border-box",
        }}>
          <h2 style={{ marginBottom: "24px", fontSize: "2rem", color: "#f44336" }}>Доступ запрещён</h2>
          <p style={{ fontSize: "1.2rem", color: "#666" }}>У вас нет прав для регистрации пользователей</p>
          <Button label="На главную" fillColor style={{ border: "none", marginTop: "20px" }} onClick={() => navigate("/home")} />
        </div>
      </>
    );
  }

  return (
    <>
      <ErrorBanner error={error} success={success} onClose={() => { setError(null); setSuccess(null); }} />
      <div style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "20px",
        maxWidth: "1100px",
        margin: "0 auto",
        marginTop: "var(--header-height)",
        paddingBottom: "40px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "2rem" }}>Массовая регистрация из файла</h2>
          <Button label="← Обычная регистрация" fillColor style={{ border: "none" }} onClick={() => navigate("/register")} />
        </div>

        <div style={{ backgroundColor: "var(--color-alabaster-grey)", borderRadius: "10px", padding: "24px", marginBottom: "20px" }}>
          <p style={{ marginBottom: "12px" }}>
            Загрузите CSV-файл с новыми аккаунтами. Первая строка — заголовки колонок
            (ровно как в примере ниже), дальше — по одной строке на аккаунт.
            Несколько отделов у одного человека — через «;» внутри ячейки.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <Button label="Скачать пример файла" fillColor style={{ border: "none" }} onClick={handleDownloadTemplate} />
            <label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <Button
                label={fileName ? `Файл: ${fileName}` : "Выбрать CSV-файл"}
                fillColor
                style={{ border: "none", backgroundColor: "#4CAF50" }}
                onClick={() => fileInputRef.current?.click()}
              />
            </label>
          </div>
          {fileError && (
            <p style={{ color: "#f44336", marginTop: "12px" }}>{fileError}</p>
          )}
        </div>

        <div style={{ backgroundColor: "var(--color-alabaster-grey)", borderRadius: "10px", padding: "24px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "12px" }}>Пример формата файла</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "#686ACF", color: "white" }}>
                  {COLUMNS.map((c) => (
                    <th key={c.key} style={{ padding: "8px", textAlign: "left", whiteSpace: "nowrap" }}>
                      {c.label}{c.required && " *"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_ROWS.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #ccc" }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: "8px", whiteSpace: "nowrap" }}>{cell || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>* — обязательные колонки</p>
        </div>

        {rows.length > 0 && (
          <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "24px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "12px" }}>
              Проверка загруженного файла ({validRows.length} из {rows.length} готовы к регистрации)
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#686ACF", color: "white" }}>
                    <th style={{ padding: "8px", textAlign: "left" }}>№</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Логин</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>ФИО</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Должность</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Отделы</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.rowNumber} style={{ borderBottom: "1px solid #ccc", backgroundColor: row.errors.length > 0 ? "#fdecea" : undefined }}>
                      <td style={{ padding: "8px" }}>{row.rowNumber}</td>
                      <td style={{ padding: "8px" }}>{row.login}</td>
                      <td style={{ padding: "8px" }}>{row.fullName}</td>
                      <td style={{ padding: "8px" }}>{row.positionLabel}</td>
                      <td style={{ padding: "8px" }}>{row.departmentLabel}</td>
                      <td style={{ padding: "8px", color: row.errors.length > 0 ? "#f44336" : "#4CAF50" }}>
                        {row.errors.length > 0 ? row.errors.join("; ") : "OK"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasErrors && (
              <p style={{ color: "#f44336", marginTop: "12px" }}>
                Исправьте ошибки в файле и загрузите его заново — регистрация возможна только когда все строки корректны.
              </p>
            )}

            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <Button
                label={bulkMutation.isPending ? "Регистрация..." : `Зарегистрировать всех (${rows.length})`}
                fillColor
                style={{ border: "none", backgroundColor: "#4CAF50" }}
                onClick={() => bulkMutation.mutate()}
                disabled={hasErrors || bulkMutation.isPending}
              />
            </div>
          </div>
        )}

        {createdCredentials && (
          <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "24px" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "12px" }}>Готово: {createdCredentials.length} аккаунтов</h3>
            <p style={{ marginBottom: "12px", color: "#666" }}>
              Логины и пароли не хранятся в открытом виде на сервере — скачайте их сейчас, повторно посмотреть не получится.
            </p>
            <Button label="Скачать логины и пароли (CSV)" fillColor style={{ border: "none" }} onClick={handleDownloadCredentials} />
          </div>
        )}
      </div>
    </>
  );
}
