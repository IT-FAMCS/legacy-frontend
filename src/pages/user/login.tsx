import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { login, getUser } from "../../api/user";
import { useUserStore } from "../../stores/user";
import { useErrorStore } from "../../stores/error";
import Button from "../../components/Button";
import background from "../../assets/images/title-wrapper-bg.png";

export function LoginPage() {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUserInfo);
  const setError = useErrorStore((s) => s.setError);
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (variables: Parameters<typeof login>[0]) => {
      await login(variables);
      // After successful login, fetch user info
      return await getUser();
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      navigate("/home");
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
      minHeight: "100vh",
      padding: "20px",
      background: `url(${background})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <h2 style={{ marginBottom: "24px", fontSize: "2rem", color: "white", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>Вход в систему</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
          maxWidth: "400px",
          padding: "32px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
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
          type="submit"
          style={{ border: "none", marginTop: "8px" }}
        />
      </form>
    </div>
  );
}
