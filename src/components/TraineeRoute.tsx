import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { getTraineeSession } from "../api/trainee";
import { getTraineeToken } from "../utils/trainee-session";
import "../styles/trainee.css";

export function TraineeRoute() {
  const token = getTraineeToken();
  const location = useLocation();
  const session = useQuery({
    queryKey: ["trainee", "session", token, location.key],
    queryFn: ({ signal }) => getTraineeSession({ signal }),
    enabled: !!token, retry: false, staleTime: 0, gcTime: 0,
    refetchOnWindowFocus: true, refetchInterval: 60_000,
  });

  if (!token) return <Navigate to="/trainee/login" replace />;

  return <div className="trainee-shell">
    <header className="trainee-header">
      <Link to="/trainee" className="trainee-brand">НАСЛЕДИЕ</Link>
      <Link to="/trainee">База знаний</Link>
      <span className="trainee-badge">Стажёр</span>
    </header>
    <main className="trainee-main">
      {session.isPending ? <p role="status">Проверяем доступ…</p>
        : session.isError ? <div role="alert" className="trainee-panel">
          <p>{session.error.message}</p>
          <button className="trainee-primary" onClick={() => session.refetch()}>Попробовать снова</button>
        </div> : <Outlet />}
    </main>
  </div>;
}
