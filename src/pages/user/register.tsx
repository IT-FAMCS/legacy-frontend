import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { getPositions, getDepartments } from "../../api/user";
import { useErrorStore } from "../../stores/error";
import { useCanRegisterUsers } from "../../hooks/use-permissions";
import Button from "../../components/Button";
import { ErrorBanner } from "../../components/ErrorBanner";
import { MultiSelect } from "../../components/MultiSelect";

export function RegisterPage() {
  const navigate = useNavigate();
  const params = useParams<{ token?: string }>();
  const error = useErrorStore((s) => s.error);
  const success = useErrorStore((s) => s.success);
  const setError = useErrorStore((s) => s.setError);
  const setSuccess = useErrorStore((s) => s.setSuccess);
  const canRegisterUsers = useCanRegisterUsers();

  const [formData, setFormData] = useState({
    login: "",
    password: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    department_ids: [] as number[],
    course: "",
    group: "",
    birth_date: "",
    telegram: "",
    position: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch positions from backend
  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: ({ signal }) => getPositions({ signal }),
  });

  // Fetch departments from backend
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: ({ signal }) => getDepartments({ signal }),
  });

  // Convert departments to options for MultiSelect
  const departmentOptions = departments.map((dept: { id: number; name: string }) => ({
    value: String(dept.id),
    label: dept.name,
  }));

  const registerMutation = useMutation({
    mutationFn: async (variables: { userData: {
      login: string;
      password: string;
      first_name: string;
      last_name: string;
      middle_name?: string;
      department_ids?: number[];
      course?: string;
      group?: string;
      birth_date?: string;
      telegram?: string;
      position: string;
    }}) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      
      // Send token from URL if provided, otherwise use token from localStorage
      const token = params.token || localStorage.getItem("jwt_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/register`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(variables.userData),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${res.status}`);
      }
      return await res.json();
    },
    onSuccess: () => {
      // Copy credentials to clipboard
      const credentialsText = `логин: ${formData.login}, пароль: ${formData.password}`;
      navigator.clipboard.writeText(credentialsText).then(() => {
        setSuccess(`Пользователь с логином "${formData.login}" успешно зарегистрирован. Логин и пароль скопированы в буфер обмена.`);
      }).catch(() => {
        setSuccess(`Пользователь с логином "${formData.login}" успешно зарегистрирован.`);
      });
      navigate("/accounts");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при регистрации");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.login.trim()) {
      errors.login = "Введите логин";
    }
    if (!formData.password.trim()) {
      errors.password = "Введите пароль";
    }
    if (!formData.first_name.trim()) {
      errors.first_name = "Введите имя";
    }
    if (!formData.last_name.trim()) {
      errors.last_name = "Введите фамилию";
    }
    if (!formData.position.trim()) {
      errors.position = "Выберите должность";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("Заполните обязательные поля");
      return;
    }

    setValidationErrors({});
    registerMutation.mutate({
      userData: {
        login: formData.login,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || undefined,
        department_ids: formData.department_ids.length > 0 ? formData.department_ids : undefined,
        course: formData.course || undefined,
        group: formData.group || undefined,
        // Convert date to ISO format with time component
        birth_date: formData.birth_date ? `${formData.birth_date}T00:00:00` : undefined,
        telegram: formData.telegram || undefined,
        position: formData.position,
      },
    });
  };

  if (!canRegisterUsers) {
    return (
      <>
        <ErrorBanner error={error} success={success} onClose={() => { setError(null); setSuccess(null); }} />
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - var(--header-height))",
          padding: "20px",
        }}>
          <h2 style={{ marginBottom: "24px", fontSize: "2rem", color: "#f44336" }}>Доступ запрещён</h2>
          <p style={{ fontSize: "1.2rem", color: "#666" }}>У вас нет прав для регистрации пользователей</p>
          <Button
            label="На главную"
            fillColor
            style={{ border: "none", marginTop: "20px" }}
            onClick={() => navigate("/home")}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <ErrorBanner error={error} success={success} onClose={() => { setError(null); setSuccess(null); }} />
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - var(--header-height))",
        padding: "20px",
        paddingBottom: "40px",
        marginTop: "var(--header-height)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "800px", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <h2 style={{ fontSize: "2rem" }}>Регистрация пользователя</h2>
          <Button label="Массовая регистрация из файла →" fillColor style={{ border: "none" }} onClick={() => navigate("/register/bulk")} />
        </div>
        <div
          className="form-grid-2"
          style={{
            width: "100%",
            maxWidth: "800px",
            padding: "32px",
            backgroundColor: "var(--color-alabaster-grey)",
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="login" style={{ fontWeight: 600 }}>Логин *</label>
            <input
              id="login"
              name="login"
              type="text"
              value={formData.login}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: validationErrors.login ? "2px solid #f44336" : "1px solid #ccc",
                fontSize: "16px",
              }}
            />
            {validationErrors.login && (
              <span style={{ color: "#f44336", fontSize: "12px" }}>{validationErrors.login}</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="password" style={{ fontWeight: 600 }}>Пароль *</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: validationErrors.password ? "2px solid #f44336" : "1px solid #ccc",
                fontSize: "16px",
              }}
            />
            {validationErrors.password && (
              <span style={{ color: "#f44336", fontSize: "12px" }}>{validationErrors.password}</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="first_name" style={{ fontWeight: 600 }}>Имя *</label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              value={formData.first_name}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: validationErrors.first_name ? "2px solid #f44336" : "1px solid #ccc",
                fontSize: "16px",
              }}
            />
            {validationErrors.first_name && (
              <span style={{ color: "#f44336", fontSize: "12px" }}>{validationErrors.first_name}</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="last_name" style={{ fontWeight: 600 }}>Фамилия *</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: validationErrors.last_name ? "2px solid #f44336" : "1px solid #ccc",
                fontSize: "16px",
              }}
            />
            {validationErrors.last_name && (
              <span style={{ color: "#f44336", fontSize: "12px" }}>{validationErrors.last_name}</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="middle_name" style={{ fontWeight: 600 }}>Отчество</label>
            <input
              id="middle_name"
              name="middle_name"
              type="text"
              value={formData.middle_name}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="position" style={{ fontWeight: 600 }}>Должность *</label>
            <select
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className={validationErrors.position ? "select-error" : ""}
            >
              <option value="">Выберите должность</option>
              {positions.map((pos: { id: number; name: string }) => (
                <option key={pos.id} value={pos.name}>{pos.name}</option>
              ))}
            </select>
            {validationErrors.position && (
              <span style={{ color: "#f44336", fontSize: "12px" }}>{validationErrors.position}</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontWeight: 600 }}>Отделы</label>
            <MultiSelect
              options={departmentOptions}
              selectedValues={formData.department_ids.map(String)}
              onChange={(values: string[]) => {
                setFormData({ ...formData, department_ids: values.map(Number) });
              }}
              placeholder="Выберите отделы"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="course" style={{ fontWeight: 600 }}>Курс</label>
            <input
              id="course"
              name="course"
              type="text"
              value={formData.course}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="group" style={{ fontWeight: 600 }}>Группа</label>
            <input
              id="group"
              name="group"
              type="text"
              value={formData.group}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="birth_date" style={{ fontWeight: 600 }}>Дата рождения</label>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="telegram" style={{ fontWeight: 600 }}>Telegram</label>
            <input
              id="telegram"
              name="telegram"
              type="text"
              value={formData.telegram}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
            <Button
              label="Отмена"
              fillColor
              style={{ border: "none" }}
              onClick={() => navigate("/accounts")}
            />
            <Button
              label={registerMutation.isPending ? "Регистрация..." : "Зарегистрировать"}
              fillColor
              style={{ border: "none", backgroundColor: "#4CAF50" }}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </>
  );
}
