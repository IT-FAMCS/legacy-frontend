import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTraineeCode, rotateTraineeCode } from "../../api/trainee";
import { isAdminChairOrDeputy } from "../../hooks/use-permissions";
import { useUserStore } from "../../stores/user";
import { formatDateTime } from "../../utils/date";
import "../../styles/trainee.css";

export function TraineeAccessPage() {
  const user = useUserStore(s => s.user);
  const canManage = isAdminChairOrDeputy(user?.position_name);
  const queryClient = useQueryClient();
  const [copyStatus, setCopyStatus] = useState("");
  const [confirmRotation, setConfirmRotation] = useState(false);
  const code = useQuery({ queryKey: ["trainee-code"], queryFn: getTraineeCode,
    enabled: canManage, staleTime: 0, gcTime: 0, refetchOnWindowFocus: true, retry: false });
  const rotate = useMutation({
    mutationFn: rotateTraineeCode,
    onSuccess: (data) => {
      queryClient.setQueryData(["trainee-code"], data);
      setConfirmRotation(false);
      setCopyStatus("Новый код создан. Предыдущий код и сессии стажёров больше не действуют.");
    },
  });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.data?.code || "");
      setCopyStatus("Код скопирован");
    } catch {
      setCopyStatus("Не удалось скопировать автоматически. Выделите и скопируйте код вручную.");
    }
  };

  if (!user?.position_name) return <div className="trainee-main"><p role="status">Загружаем права доступа…</p></div>;
  if (!canManage) return <div className="trainee-main"><h1>Нет доступа</h1>
    <p>Управлять кодом могут только администратор, председатель и его заместители.</p></div>;

  return <div className="trainee-main trainee-management">
    <p className="trainee-eyebrow">Приглашаем в студактив</p><h1>Доступ стажёров</h1>
    <p className="trainee-muted">Общий код открывает стажёрам карточки с включённой настройкой «Доступна стажёрам».</p>
    <section className="trainee-panel">
      <h2>Код доступа</h2>
      {code.isPending ? <p role="status">Загружаем код…</p> : code.isError ? <div role="alert">
        <p className="trainee-error">{code.error.message}</p>
        <button className="trainee-secondary" onClick={() => code.refetch()}>Попробовать снова</button>
      </div> : <>
        {code.data.code ? <>
          <output className="trainee-code-output" aria-label="Текущий код доступа">{code.data.code}</output>
          <p className="trainee-muted">Создан: {code.data.updated_at ? formatDateTime(code.data.updated_at) : "—"}</p>
          <button className="trainee-secondary" onClick={copy} disabled={rotate.isPending}>Скопировать код</button>
        </> : <p className="trainee-muted">Код ещё не создан. Сгенерируйте его, чтобы открыть вход стажёрам.</p>}
        <div className="trainee-rotation">
          <p>Сессия стажёра действует 30 дней. При смене кода все ранее выданные сессии прекращают действовать.</p>
          {confirmRotation ? <div className="trainee-notice">
            <p>Сменить код и закрыть все текущие сессии стажёров?</p>
            <div className="trainee-actions">
              <button className="trainee-primary" disabled={rotate.isPending} onClick={() => rotate.mutate()}>
                {rotate.isPending ? "Генерируем…" : "Да, сменить код"}</button>
              <button className="trainee-secondary" disabled={rotate.isPending} onClick={() => setConfirmRotation(false)}>Отмена</button>
            </div>
          </div> : <button className="trainee-primary" disabled={rotate.isPending}
            onClick={() => { setCopyStatus(""); rotate.reset(); if (code.data.code) setConfirmRotation(true); else rotate.mutate(); }}>
            {rotate.isPending ? "Генерируем…" : "Сгенерировать новый код"}
          </button>}
        </div>
      </>}
      {rotate.isError && <p role="alert" className="trainee-error">{rotate.error.message}</p>}
      <p role="status">{copyStatus}</p>
    </section>
  </div>;
}
