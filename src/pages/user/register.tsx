import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { register } from "../../api/user";
import { useUserStore } from "../../stores/user";
import type { UserRole } from "../../stores/user";
import Button from "../../components/Button";

export function RegisterPage() {
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    firstName: "",
    lastName: "",
    patronymic: "",
    department: "",
    course: "",
    group: "",
    hb: "",
    position: "",
    role: "member" as UserRole,
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUserInfo);

  const registerMutation = useMutation({
    mutationFn: (userData: Parameters<typeof register>[0]["userData"]) => register({ userData }),
    onSuccess: (data) => {
      setUser(data);
      navigate("/");
    },
    onError: () => {
      setError("Ошибка регистрации");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.login || !formData.password || !formData.firstName || !formData.lastName) {
      setError("Заполните обязательные поля");
      return;
    }
    registerMutation.mutate({
      ...formData,
      course: formData.course ? Number(formData.course) : undefined,
      group: formData.group ? Number(formData.group) : undefined,
    });
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "calc(100vh - var(--header-height))",
      padding: "20px",
    }}>
      <h2 style={{ marginBottom: "24px", fontSize: "2rem" }}>Регистрация</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
          maxWidth: "500px",
          padding: "32px",
          backgroundColor: "var(--color-alabaster-grey)",
          borderRadius: "10px",
        }}
      >
        {error && (
          <p style={{ color: "red", margin: 0, textAlign: "center" }}>{error}</p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="lastName" style={{ fontWeight: 600 }}>Фамилия *</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
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
            <label htmlFor="firstName" style={{ fontWeight: 600 }}>Имя *</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="patronymic" style={{ fontWeight: 600 }}>Отчество</label>
          <input
            id="patronymic"
            name="patronymic"
            type="text"
            value={formData.patronymic}
            onChange={handleChange}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
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
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="department" style={{ fontWeight: 600 }}>Отдел</label>
          <input
            id="department"
            name="department"
            type="text"
            value={formData.department}
            onChange={handleChange}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="course" style={{ fontWeight: 600 }}>Курс</label>
            <input
              id="course"
              name="course"
              type="number"
              value={formData.course}
              onChange={handleChange}
              min="1"
              max="6"
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
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="hb" style={{ fontWeight: 600 }}>Дата рождения</label>
            <input
              id="hb"
              name="hb"
              type="date"
              value={formData.hb}
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
            <label htmlFor="position" style={{ fontWeight: 600 }}>Должность</label>
            <input
              id="position"
              name="position"
              type="text"
              value={formData.position}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="role" style={{ fontWeight: 600 }}>Роль</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          >
            <option value="member">Мемьберь</option>
            <option value="admin">Зам</option>
            <option value="chairman">Председатель</option>
          </select>
        </div>
        <Button
          label={registerMutation.isPending ? "Регистрация..." : "Зарегистрироваться"}
          fillColor
          full
          style={{ border: "none", marginTop: "8px" }}
          onClick={() => {}}
        />
      </form>
    </div>
  );
}
