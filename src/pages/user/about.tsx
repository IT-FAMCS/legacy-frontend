import Button from "../../components/Button";
import { useUserStore } from "../../stores/user";
import { EditUser } from "./edit";
import { useState } from "react";
import { useNavigate } from "react-router";
import { logout } from "../../api/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function AboutUser() {
  const user = useUserStore((s) => s.user);
  const logoutAction = useUserStore((s) => s.logout);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      padding: "24px",
      maxWidth: "600px",
      margin: "0 auto",
    }}>
      <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>Личный кабинет</h2>
      
      <div style={{
        backgroundColor: "var(--color-alabaster-grey)",
        borderRadius: "10px",
        padding: "24px",
      }}>
        <div style={{ display: "grid", gap: "12px" }}>
          <p><strong>ФИО:</strong> {user?.lastName} {user?.firstName} {user?.patronymic}</p>
          <p><strong>Логин:</strong> {user?.login}</p>
          <p><strong>Отдел:</strong> {user?.department || "-"}</p>
          <p><strong>Курс:</strong> {user?.course || "-"}</p>
          <p><strong>Группа:</strong> {user?.group || "-"}</p>
          <p><strong>Дата рождения:</strong> {user?.hb || "-"}</p>
          <p><strong>Должность:</strong> {user?.position || "-"}</p>
          <p><strong>Роль:</strong> {
            user?.role === "admin" && "Администратор"
            || user?.role === "chairman" && "Председатель"
            || user?.role === "member" && "Участник"
            || user?.role === "guest" && "Гость"
          }</p>
        </div>

        <div style={{
          display: "flex",
          gap: "12px",
          marginTop: "24px",
          flexWrap: "wrap",
        }}>
          <Button
            label="Редактировать"
            fillColor
            style={{ border: "none" }}
            onClick={() => {
              setIsEdit(!isEdit);
            }}
          />
          <Button
            label="Выйти"
            fillColor
            style={{ border: "none", backgroundColor: "#f44336" }}
            onClick={() => {
              logoutMutation.mutate();
            }}
          />
        </div>
      </div>

      {isEdit && <EditUser setIsEdit={setIsEdit} />}
    </div>
  );
};
