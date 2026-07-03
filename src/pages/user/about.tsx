import Button from "../../components/Button";
import { useUserStore } from "../../stores/user";
import { EditUser } from "./edit";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { logout, getVisitHistory, getUserByLogin } from "../../api/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCanEditAnyUser } from "../../hooks/use-permissions";

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
      ) : (
        <p style={{ color: "#666", fontStyle: "italic" }}>История просмотров пуста</p>
      )}
    </div>
  );
};

export function AboutUser() {
  const currentUser = useUserStore((s) => s.user);
  const logoutAction = useUserStore((s) => s.logout);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const params = useParams<{ login?: string }>();
  const queryClient = useQueryClient();
  const canEditAnyUser = useCanEditAnyUser();

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

  // Fetch target user if viewing another user's profile
  const { data: targetUser } = useQuery({
    queryKey: ["user", params.login],
    queryFn: ({ signal }) => getUserByLogin({ signal, login: params.login! }),
    enabled: !isOwnProfile && !!params.login,
  });

  // Use target user data or current user data
  const user = isOwnProfile ? currentUser : targetUser;

  // Backend doesn't allow self-editing - users must contact admin to edit their own profile
  // Check if current user can edit the target user
  // Backend: can_edit_any_user flag allows editing any user (except self)
  const canEditTargetUser = canEditAnyUser && !isOwnProfile && targetUser?.login !== currentUser?.login;
  
  // Users cannot edit themselves - backend returns 403
  const canEditSelf = false;

  // Check if current user can view others' visit history
  // Backend: users with can_edit_any_user flag (admins) can view others' data
  const canViewOthersHistory = canEditAnyUser;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      padding: "24px",
      maxWidth: "800px",
      margin: "0 auto",
      marginTop: "var(--header-height)",
    }}>
      <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>
        {isOwnProfile ? "Личный кабинет" : `Профиль пользователя`}
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
      
      {(isOwnProfile || canViewOthersHistory) && (
        <VisitHistory
          userLogin={params.login}
          canView={!!(isOwnProfile || canViewOthersHistory)}
          targetUserId={targetUser?.id}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  );
};
