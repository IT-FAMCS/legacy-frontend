import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { login } from "../../api/user";
import { useUserStore } from "../../stores/user";
import { useErrorStore } from "../../stores/error";
import Button from "../../components/Button";

export function LoginPage() {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUserInfo);
  const setError = useErrorStore((s) => s.setError);

  const loginMutation = useMutation({
    mutationFn: (variables: Parameters<typeof login>[0]) => login(variables),
    onSuccess: (data) => {
      setUser(data);
      navigate("/");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Неверный логин или пароль");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginValue || !password) {
      setError("Заполните все поля");
      return;
    }
    loginMutation.mutate({ loginData: { login: loginValue, password } });
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
      <h2 style={{ marginBottom: "24px", fontSize: "2rem" }}>Вход в систему</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
          maxWidth: "400px",
          padding: "32px",
          backgroundColor: "var(--color-alabaster-grey)",
          borderRadius: "10px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="login" style={{ fontWeight: 600 }}>Логин</label>
          <input
            id="login"
            type="text"
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="password" style={{ fontWeight: 600 }}>Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
        </div>
        <Button
          label={loginMutation.isPending ? "Вход..." : "Войти"}
          fillColor
          full
          style={{ border: "none", marginTop: "8px" }}
          onClick={() => {}}
        />
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <a
            href="/register"
            onClick={(e) => {
              e.preventDefault();
              navigate("/register");
            }}
            style={{ color: "var(--color-gold-crest)", textDecoration: "underline" }}
          >
            Зарегистрироваться
          </a>
        </div>
      </form>
    </div>
  );
}
