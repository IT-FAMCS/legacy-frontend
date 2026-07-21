import Button from "../../components/Button";
import { ModalWrapper } from "../../components/modal";
import { useUserStore } from "../../stores/user";
import { useErrorStore } from "../../stores/error";
import { EditUser } from "./edit";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { logout, getVisitHistory, getUserByLogin, changeOwnPassword, getUserCardActivity } from "../../api/user";
import type { ActivityLogEntry } from "../../api/category";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCanEditAnyUser, useCanViewCardActivity } from "../../hooks/use-permissions";
import { usePagedList } from "../../hooks/use-paged-list";

type Visit = {
  id: number;
  item_id: number;
  item_name: string;
  visited_at: string;
};

type VisitHistoryProps = {
  userLogin?: string;
  canView: boolean;
  targetUserId?: number;
  currentUserId?: number;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ACTIVITY_ACTION_LABEL: Record<ActivityLogEntry["action"], string> = {
  create: "Добавил(а) карточку",
  update: "Изменил(а) карточку",
  delete: "Удалил(а) карточку",
};

const CardActivity = ({ userLogin, canView, targetUserId, currentUserId }: VisitHistoryProps) => {
  const { data: entries = [] } = useQuery({
    queryKey: ["activity", "cards", userLogin || "me", targetUserId ?? currentUserId],
    queryFn: ({ signal }) => getUserCardActivity({ signal, userId: targetUserId }),
    enabled: canView,
  });
  const { visibleItems, hasMore, nextStepLabel, showMore } = usePagedList(entries);

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "20px",
      marginTop: "20px",
    }}>
      <h3 style={{ fontSize: "1.5rem", marginBottom: "16px", color: "var(--сolor-dark-grayish-blue)" }}>
        Активность по карточкам
      </h3>
      {entries.length > 0 ? (
        <>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#686ACF", color: "white" }}>
                  <th style={{ padding: "10px", textAlign: "left" }}>Действие</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Изменения</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Когда</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((entry: ActivityLogEntry) => (
                  <tr key={entry.id} style={{ borderBottom: "1px solid #ccc" }}>
                    <td style={{ padding: "10px" }}>
                      {ACTIVITY_ACTION_LABEL[entry.action]} «{entry.entity_title || "—"}»
                    </td>
                    <td style={{ padding: "10px", color: "#666" }}>{entry.details || "—"}</td>
                    <td style={{ padding: "10px" }}>
                      {new Date(entry.created_at).toLocaleString("ru-RU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <Button label={`Показать ещё (${nextStepLabel})`} fillColor style={{ border: "none" }} onClick={showMore} />
            </div>
          )}
        </>
      ) : (
        <p style={{ color: "#666", fontStyle: "italic" }}>Активность отсутствует</p>
      )}
    </div>
  );
};

const VisitHistory = ({ userLogin, canView, targetUserId, currentUserId }: VisitHistoryProps) => {
  const { data: cardVisits = [] } = useQuery({
    queryKey: ["visits", "cards", userLogin || "me", targetUserId ?? currentUserId],
    queryFn: ({ signal }) => getVisitHistory({ signal, type: "cards", userId: targetUserId }),
    enabled: canView,
  });

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "20px",
      marginTop: "20px",
    }}>
      <h3 style={{ fontSize: "1.5rem", marginBottom: "16px", color: "var(--сolor-dark-grayish-blue)" }}>
        История просмотра карточек
      </h3>
      {cardVisits.length > 0 ? (
        <div className="table-scroll">
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
          }}>
            <thead>
              <tr style={{ backgroundColor: "#686ACF", color: "white" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>Название карточки</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Дата просмотра</th>
              </tr>
            </thead>
            <tbody>
              {cardVisits.map((visit: Visit) => (
                <tr key={visit.id} style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: "10px" }}>{visit.item_name}</td>
                  <td style={{ padding: "10px" }}>
                    {new Date(visit.visited_at).toLocaleString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: "#666", fontStyle: "italic" }}>История просмотров пуста</p>
      )}
    </div>
  );
};

function OwnPasswordModal({ setIsOpen }: { setIsOpen: (value: boolean) => void }) {
  const setError = useErrorStore((s) => s.setError);
  const setSuccess = useErrorStore((s) => s.setSuccess);
  const [form, setForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      changeOwnPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    onSuccess: () => {
      setSuccess("Пароль успешно изменен");
      setIsOpen(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при смене пароля");
    },
  });

  const handleSave = () => {
    if (!form.currentPassword.trim()) {
      setError("Введите текущий пароль");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("Новый пароль должен быть не короче 6 символов");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Новый пароль и подтверждение не совпадают");
      return;
    }
    passwordMutation.mutate();
  };

  return (
    <ModalWrapper setIsOpen={setIsOpen}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
        <h3 style={{ color: "white", fontSize: "1.5rem" }}>Смена пароля</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ color: "white", fontWeight: 600 }}>Текущий пароль</label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ color: "white", fontWeight: 600 }}>Новый пароль</label>
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ color: "white", fontWeight: 600 }}>Повторите новый пароль</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }}
          />
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
          <Button label="Отмена" fillColor onClick={() => setIsOpen(false)} />
          <Button
            label={passwordMutation.isPending ? "Сохранение..." : "Сменить пароль"}
            fillColor
            style={{ backgroundColor: "#4CAF50" }}
            onClick={handleSave}
          />
        </div>
      </div>
    </ModalWrapper>
  );
}

export function AboutUser() {
  const currentUser = useUserStore((s) => s.user);
  const logoutAction = useUserStore((s) => s.logout);
  const [isEdit, setIsEdit] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const navigate = useNavigate();
  const params = useParams<{ login?: string }>();
  const queryClient = useQueryClient();
  const canEditAnyUser = useCanEditAnyUser();
  const canViewCardActivity = useCanViewCardActivity();

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      logoutAction();
      queryClient.clear();
      navigate("/login");
    },
    onError: () => {
      logoutAction();
      navigate("/login");
    },
  });

  const isOwnProfile = !params.login;

  const { data: targetUser } = useQuery({
    queryKey: ["user", params.login],
    queryFn: ({ signal }) => getUserByLogin({ signal, login: params.login! }),
    enabled: !isOwnProfile && !!params.login,
  });

  const user = isOwnProfile ? currentUser : targetUser;
  const canEditTargetUser = canEditAnyUser && !isOwnProfile && targetUser?.login !== currentUser?.login;
  const canEditSelf = false;
  const canViewOthersHistory = canEditAnyUser;

  return (
    <div style={{
      width: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      padding: "24px",
      maxWidth: "800px",
      margin: "0 auto",
      marginTop: "var(--header-height)",
    }}>
      <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>
        {isOwnProfile ? "Личный кабинет" : "Профиль пользователя"}
      </h2>
      
      <div style={{
        backgroundColor: "var(--color-alabaster-grey)",
        borderRadius: "10px",
        padding: "24px",
      }}>
        <div style={{ display: "grid", gap: "12px" }}>
          <p><strong>ФИО:</strong> {user?.last_name} {user?.first_name} {user?.middle_name || ""}</p>
          <p><strong>Логин:</strong> {user?.login}</p>
          <p><strong>Отдел:</strong> {user?.departments && user.departments.length > 0 
            ? user.departments.map((d: { id: number; name: string }) => d.name).join(", ") 
            : user?.department || "-"}</p>
          <p><strong>Курс:</strong> {user?.course || "-"}</p>
          <p><strong>Группа:</strong> {user?.group || "-"}</p>
          <p><strong>Дата рождения:</strong> {user?.birth_date ? user.birth_date.split("T")[0] : "-"}</p>
          <p><strong>Должность:</strong> {user?.position_name || "-"}</p>
          <p><strong>Telegram:</strong> {user?.telegram || "-"}</p>
          <p><strong>Статус:</strong> {user?.is_active && !user?.is_deactivated ? "Активен" : "Деактивирован"}</p>
          <p><strong>Последний визит:</strong> {user?.last_seen_at ? new Date(user.last_seen_at).toLocaleString("ru-RU") : "-"}</p>
          <p><strong>Пароль менялся:</strong> {user?.password_changed_at ? new Date(user.password_changed_at).toLocaleString("ru-RU") : "неизвестно"}</p>
        </div>

        <div style={{
          display: "flex",
          gap: "12px",
          marginTop: "24px",
          flexWrap: "wrap",
        }}>
          {(canEditSelf || canEditTargetUser) && (
            <Button
              label="Редактировать"
              fillColor
              style={{ border: "none" }}
              onClick={() => {
                setIsEdit(!isEdit);
              }}
            />
          )}
          {isOwnProfile && (
            <Button
              label="Сменить пароль"
              fillColor
              style={{ border: "none", backgroundColor: "#4CAF50" }}
              onClick={() => setIsPasswordOpen(true)}
            />
          )}
          {isOwnProfile && (
            <Button
              label="Выйти"
              fillColor
              style={{ border: "none", backgroundColor: "#f44336" }}
              onClick={() => {
                logoutMutation.mutate();
              }}
            />
          )}
        </div>
      </div>

      {isEdit && <EditUser setIsEdit={setIsEdit} targetUser={targetUser} />}
      {isPasswordOpen && <OwnPasswordModal setIsOpen={setIsPasswordOpen} />}
      
      {(isOwnProfile || canViewOthersHistory) && (
        <VisitHistory
          userLogin={params.login}
          canView={!!(isOwnProfile || canViewOthersHistory)}
          targetUserId={targetUser?.id}
          currentUserId={currentUser?.id}
        />
      )}

      {canViewCardActivity && (
        <CardActivity
          userLogin={params.login}
          canView={canViewCardActivity}
          targetUserId={targetUser?.id}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  );
}
