import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { loginTrainee } from "../../api/trainee";
import { TraineeRaccoon } from "../../components/TraineeRaccoon";
import { getTraineeToken, setTraineeToken } from "../../utils/trainee-session";
import { useUserStore } from "../../stores/user";
import background from "../../assets/images/title-wrapper-bg.png";

export function TraineeLoginPage() {
  const [code, setCode] = useState("");
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const login = useMutation({
    mutationFn: () => loginTrainee(code.trim()),
    onSuccess: async (data) => {
      await queryClient.cancelQueries();
      useUserStore.getState().logout();
      queryClient.clear();
      setTraineeToken(data.access_token);
      navigate("/trainee", { replace: true });
    },
  });
  if (getTraineeToken()) return <Navigate to="/trainee" replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.trim() && !login.isPending) login.mutate();
  };

  return <main className="trainee-entry" style={{ backgroundImage: `url(${background})` }}>
    <section className="trainee-login-panel">
      <TraineeRaccoon large />
      <p className="trainee-eyebrow">Добро пожаловать в Наследие</p>
      <h1>Привет, стажёр!</h1>
      <p className="trainee-muted">Введи код от председателя или его заместителя — и знакомься с нашей базой знаний.</p>
      {search.has("expired") && <p role="status" className="trainee-notice">
        Срок доступа истёк или общий код обновили. Введи актуальный код, чтобы продолжить.
      </p>}
      <form onSubmit={submit} className="trainee-form">
        <label htmlFor="trainee-code">Код доступа</label>
        <input id="trainee-code" name="code" value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="Код для стажёров" autoComplete="off" autoCapitalize="characters" spellCheck={false}
          maxLength={128} required aria-describedby={login.isError ? "trainee-login-error" : undefined}
          aria-invalid={login.isError || undefined} />
        {login.isError && <p id="trainee-login-error" role="alert" className="trainee-error">{login.error.message}</p>}
        <button type="submit" className="trainee-primary" disabled={!code.trim() || login.isPending}>
          {login.isPending ? "Проверяем код…" : "Открыть базу знаний"}
        </button>
      </form>
      <Link to="/login" className="trainee-back-link">Вход для участников</Link>
    </section>
  </main>;
}
