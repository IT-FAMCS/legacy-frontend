import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsersList, deactivateUser } from "../../api/user";
import type { UserInfo } from "../../stores/user";
import Button from "../../components/Button";
import { ModalWrapper } from "../../components/modal";

type UserFormData = {
  firstName: string;
  lastName: string;
  patronymic?: string;
  department?: string;
  course?: number;
  group?: string;
  hb?: string;
  position?: string;
  role: string;
};

export function AccountList() {
  const [showInactive, setShowInactive] = useState(false);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [formData, setFormData] = useState<UserFormData | null>(null);

  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", showInactive],
    queryFn: ({ signal }) => getUsersList({ signal, showInactive }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: number) => deactivateUser({ userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleEdit = (user: NonNullable<UserInfo>) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      patronymic: user.patronymic || "",
      department: user.department || "",
      course: user.course || undefined,
      group: user.group?.toString() || "",
      hb: user.hb || "",
      position: user.position || "",
      role: user.role || "member",
    });
  };

  const handleSave = () => {
    // TODO: Implement update user API
    setEditingUser(null);
    setFormData(null);
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const handleDeactivate = (userId: number) => {
    deactivateMutation.mutate(userId);
  };

  if (isLoading) {
    return <div style={{ padding: "20px" }}>Загрузка...</div>;
  }

  return (
    <div style={{ padding: "20px", marginTop: "var(--header-height)" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
      }}>
        <h2 style={{ fontSize: "2rem" }}>
          {showInactive ? "Деактивированные пользователи" : "Все пользователи"}
        </h2>
        <Button
          label={showInactive ? "Показать активных" : "Показать деактивированных"}
          fillColor
          style={{ border: "none" }}
          onClick={() => setShowInactive(!showInactive)}
        />
      </div>

      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "var(--color-alabaster-grey)",
        borderRadius: "10px",
        overflow: "hidden",
      }}>
        <thead>
          <tr style={{ backgroundColor: "#686ACF", color: "white" }}>
            <th style={{ padding: "12px", textAlign: "left" }}>ФИО</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Логин</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Отдел</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Должность</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Роль</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Статус</th>
            <th style={{ padding: "12px", textAlign: "center" }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users?.filter(Boolean).map((user) => {
            if (!user) return null;
            return (
            <tr
              key={user.id}
              style={{
                borderBottom: "1px solid #ccc",
                opacity: user.isActive ? 1 : 0.6,
              }}
            >
              <td style={{ padding: "12px" }}>
                {user.lastName} {user.firstName} {user.patronymic}
              </td>
              <td style={{ padding: "12px" }}>{user.login}</td>
              <td style={{ padding: "12px" }}>{user.department || "-"}</td>
              <td style={{ padding: "12px" }}>{user.position || "-"}</td>
              <td style={{ padding: "12px" }}>
                {user.role === "admin" && "Администратор"}
                {user.role === "chairman" && "Председатель"}
                {user.role === "member" && "Участник"}
                {user.role === "guest" && "Гость"}
              </td>
              <td style={{ padding: "12px" }}>
                <span style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  backgroundColor: user.isActive ? "#4CAF50" : "#f44336",
                  color: "white",
                  fontSize: "12px",
                }}>
                  {user.isActive ? "Активен" : "Деактивирован"}
                </span>
              </td>
              <td style={{ padding: "12px", display: "flex", gap: "8px", justifyContent: "center" }}>
                <Button
                  label="Ред."
                  fillColor
                  style={{ border: "none", padding: "6px 12px", fontSize: "14px" }}
                  onClick={() => handleEdit(user)}
                />
                <Button
                  label={user.isActive ? "Деактив." : "Актив."}
                  fillColor
                  style={{
                    border: "none",
                    padding: "6px 12px",
                    fontSize: "14px",
                    backgroundColor: user.isActive ? "#f44336" : "#4CAF50",
                  }}
                  onClick={() => handleDeactivate(user.id)}
                />
              </td>
            </tr>
          )})}
        </tbody>
      </table>

      {editingUser && formData && (
        <ModalWrapper setIsOpen={() => { setEditingUser(null); setFormData(null); }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            height: "100%",
          }}>
            <h3>Редактирование пользователя</h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              overflowY: "auto",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600 }}>Фамилия</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600 }}>Имя</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600 }}>Отчество</label>
                <input
                  type="text"
                  value={formData.patronymic || ""}
                  onChange={(e) => setFormData({ ...formData, patronymic: e.target.value })}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600 }}>Отдел</label>
                <input
                  type="text"
                  value={formData.department || ""}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600 }}>Курс</label>
                <input
                  type="number"
                  value={formData.course || ""}
                  onChange={(e) => setFormData({ ...formData, course: Number(e.target.value) || undefined })}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600 }}>Группа</label>
                <input
                  type="text"
                  value={formData.group || ""}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600 }}>Дата рождения</label>
                <input
                  type="date"
                  value={formData.hb || ""}
                  onChange={(e) => setFormData({ ...formData, hb: e.target.value })}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600 }}>Должность</label>
                <input
                  type="text"
                  value={formData.position || ""}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              paddingTop: "12px",
            }}>
              <Button
                label="Отмена"
                fillColor
                onClick={() => { setEditingUser(null); setFormData(null); }}
              />
              <Button
                label="Сохранить"
                fillColor
                onClick={handleSave}
                style={{ backgroundColor: "#4CAF50" }}
              />
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}
