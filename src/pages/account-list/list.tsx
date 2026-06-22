import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useErrorStore } from "../../stores/error";
import {
  getUsers,
  editUser,
  getPositions,
  changeUserPassword,
  getDepartments,
} from "../../api/user";
import { useUserStore } from "../../stores/user";
import { useCanEditAnyUser } from "../../hooks/use-permissions";
import Button from "../../components/Button";
import { ModalWrapper } from "../../components/modal";
import { MultiSelect } from "../../components/MultiSelect";
import type { Position } from "../../types/Position";
import { useNavigate } from "react-router";

type Department = {
  id: number;
  name: string;
};

type User = {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  department: string | null;
  departments?: Department[];
  course: string | null;
  group: string | null;
  birth_date: string | null;
  telegram: string | null;
  position_id: number;
  position_name: string | null;
  is_active: boolean;
  is_deactivated: boolean;
};

type UserFormData = {
  first_name: string;
  last_name: string;
  middle_name: string;
  department_ids: number[];
  course: string;
  group: string;
  birth_date: string;
  telegram: string;
  position: string;
  password?: string;
};

export function AccountList() {
  const [showInactive, setShowInactive] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  const setError = useErrorStore((s) => s.setError);
  const setSuccess = useErrorStore((s) => s.setSuccess);
  const currentUser = useUserStore((s) => s.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check permissions using position flags from backend
  // Only users with can_edit_any_user can edit users
  const canManageUsers = useCanEditAnyUser();

  // List is available to all users (including unauthenticated)
  const { data: users, isLoading } = useQuery({
    queryKey: ["users", departmentFilter],
    queryFn: ({ signal }) =>
      getUsers({ signal, department: departmentFilter || undefined }),
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: ({ signal }) => getPositions({ signal }),
  });

  // Fetch all departments from API for the dropdown
  const { data: allDepartments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: ({ signal }) => getDepartments({ signal }),
  });

  const editMutation = useMutation({
    mutationFn: (data: {
      userData: Partial<{
        first_name: string;
        last_name: string;
        middle_name: string;
        birth_date: string;
        course: string;
        group: string;
        department: string;
        telegram: string;
        login?: string;
        position?: string;
      }>;
      login?: string;
    }) => editUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
      setFormData(null);
      setSuccess("Пользователь успешно обновлен");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при сохранении");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { login: string; newPassword: string }) =>
      changeUserPassword({ login: data.login, newPassword: data.newPassword }),
    onSuccess: () => {
      setFormData({ ...formData!, password: "" });
      setSuccess("Пароль успешно изменен");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при смене пароля");
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    // Get department IDs from user.departments array
    const deptIds = user.departments?.map((d) => d.id) || [];
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      middle_name: user.middle_name || "",
      department_ids: deptIds,
      course: user.course || "",
      group: user.group || "",
      // Parse birth_date properly - handle various formats from backend
      birth_date: user.birth_date
        ? user.birth_date.split("T")[0].split(" ")[0]
        : "",
      telegram: user.telegram || "",
      position: user.position_name || "",
      password: "",
    });
  };

  const handleSave = () => {
    if (!editingUser) return;

    const updateData: Partial<{
      first_name: string;
      last_name: string;
      middle_name: string;
      birth_date: string;
      course: string;
      group: string;
      department_ids: number[];
      telegram: string;
      login?: string;
      position?: string;
    }> = {
      login: editingUser.login,
      first_name: formData?.first_name,
      last_name: formData?.last_name,
      middle_name: formData?.middle_name,
      department_ids: formData?.department_ids || [],
      course: formData?.course,
      group: formData?.group,
      // Convert date to ISO format with time component
      birth_date: formData?.birth_date
        ? `${formData.birth_date}T00:00:00`
        : undefined,
      telegram: formData?.telegram,
      position: formData?.position,
    };

    editMutation.mutate({ userData: updateData });
  };

  const handlePasswordChange = () => {
    if (!editingUser || !formData?.password) return;
    passwordMutation.mutate({
      login: editingUser.login,
      newPassword: formData.password,
    });
  };

  const filteredUsers = users?.filter((user: User) => {
    if (showInactive) {
      return user.is_deactivated || !user.is_active;
    }
    return user.is_active && !user.is_deactivated;
  });

  const departments = Array.from(
    new Set(users?.map((u: User) => u.department).filter(Boolean) as string[])
  );

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "var(--header-height)",
        }}
      >
        <img
          alt="racoon"
          src="./assets/images/racoon-loading.gif"
          width={256}
          height={256}
        />
        <p>Загрузка...</p>
      </div>
    );
  }

  // Helper function to check if user can edit a specific target user
  // Backend: can_edit_any_user flag allows editing any user (except self)
  // Department heads can only edit users in their own department
  const canEditUser = (targetUser: User) => {
    if (!currentUser) return false;

    // Cannot edit yourself
    if (targetUser.login === currentUser.login) return false;

    // Users with can_edit_any_user flag can edit anyone (except themselves)
    if (canManageUsers) return true;

    return false;
  };

  return (
    <div style={{ padding: "20px", marginTop: "var(--header-height)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h2 style={{ fontSize: "2rem" }}>
          {showInactive ? "Деактивированные пользователи" : "Все пользователи"}
        </h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="select-sm"
            style={{
              appearance: "none",
              backgroundColor: "white",
              padding: "8px 36px 8px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "14px",
              color: "#2c3e50",
              cursor: "pointer",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23686ACF' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            <option value="">Все отделы</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <Button
            label={
              showInactive ? "Показать активных" : "Показать деактивированных"
            }
            fillColor
            style={{ border: "none" }}
            onClick={() => setShowInactive(!showInactive)}
          />
        </div>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "var(--color-alabaster-grey)",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#686ACF", color: "white" }}>
            <th style={{ padding: "12px", textAlign: "left" }}>ФИО</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Логин</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Отдел</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Должность</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Telegram</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Статус</th>
            {canManageUsers && (
              <th style={{ padding: "12px", textAlign: "center" }}>Действия</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredUsers?.map((user: User) => (
            <tr
              key={user.id}
              style={{
                borderBottom: "1px solid #ccc",
                opacity: user.is_active && !user.is_deactivated ? 1 : 0.6,
              }}
            >
              <td style={{ padding: "12px" }}>
                <span
                  onClick={() => navigate(`/user/${user.login}`)}
                  style={{
                    color: "#686ACF",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  {user.last_name} {user.first_name} {user.middle_name || ""}
                </span>
              </td>
              <td style={{ padding: "12px" }}>{user.login}</td>
              <td style={{ padding: "12px" }}>{user.department || "-"}</td>
              <td style={{ padding: "12px" }}>{user.position_name || "-"}</td>
              <td style={{ padding: "12px" }}>{user.telegram || "-"}</td>
              <td style={{ padding: "12px" }}>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor:
                      user.is_active && !user.is_deactivated
                        ? "#4CAF50"
                        : "#f44336",
                    color: "white",
                    fontSize: "12px",
                  }}
                >
                  {user.is_active && !user.is_deactivated
                    ? "Активен"
                    : "Деактивирован"}
                </span>
              </td>
              {canEditUser(user) && (
                <td
                  style={{
                    padding: "12px",
                    display: "flex",
                    gap: "8px",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    label="Ред."
                    fillColor
                    style={{
                      border: "none",
                      padding: "6px 12px",
                      fontSize: "14px",
                    }}
                    onClick={() => handleEdit(user)}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && formData && (
        <ModalWrapper
          setIsOpen={() => {
            setEditingUser(null);
            setFormData(null);
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              maxHeight: "80vh",
              overflowY: "auto",
              padding: "20px",
            }}
          >
            <h3>
              Редактирование пользователя: {editingUser.last_name}{" "}
              {editingUser.first_name}
            </h3>

            {/* Password Change Section */}
            <div
              style={{
                padding: "16px",
                backgroundColor: "#686ACF",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <h4 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
                Смена пароля
              </h4>
              <div
                style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <label style={{ fontSize: "14px", fontWeight: 600 }}>
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Введите новый пароль"
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <Button
                  label="Изменить пароль"
                  fillColor
                  onClick={handlePasswordChange}
                  style={{ backgroundColor: "#ff9800", border: "none" }}
                />
              </div>
            </div>

            {/* User Data Section */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "14px", fontWeight: 600 }}>
                  Фамилия
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "14px", fontWeight: 600 }}>Имя</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "14px", fontWeight: 600 }}>
                  Отчество
                </label>
                <input
                  type="text"
                  value={formData.middle_name}
                  onChange={(e) =>
                    setFormData({ ...formData, middle_name: e.target.value })
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "14px", fontWeight: 600 }}>
                  Отделы
                </label>
                <MultiSelect
                  options={allDepartments.map(
                    (dept: { id: number; name: string }) => ({
                      value: String(dept.id),
                      label: dept.name,
                    })
                  )}
                  selectedValues={formData?.department_ids.map(String) || []}
                  onChange={(values: string[]) => {
                    setFormData({
                      ...formData,
                      department_ids: values.map(Number),
                    });
                  }}
                  placeholder="Выберите отделы"
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "14px", fontWeight: 600 }}>
                  Должность
                </label>
                <select
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  style={{
                    appearance: "none",
                    backgroundColor: "white",
                    padding: "8px 36px 8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                    color: "#2c3e50",
                    cursor: "pointer",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23686ACF' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                  }}
                >
                  {positions.map((pos: Position) => (
                    <option key={pos.id} value={pos.name}>
                      {pos.name}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "14px", fontWeight: 600 }}>
                  Курс
                </label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) =>
                    setFormData({ ...formData, course: e.target.value })
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "14px", fontWeight: 600 }}>
                  Группа
                </label>
                <input
                  type="text"
                  value={formData.group}
                  onChange={(e) =>
                    setFormData({ ...formData, group: e.target.value })
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "14px", fontWeight: 600 }}>
                  Дата рождения
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) =>
                    setFormData({ ...formData, birth_date: e.target.value })
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "14px", fontWeight: 600 }}>
                  Telegram
                </label>
                <input
                  type="text"
                  value={formData.telegram}
                  onChange={(e) =>
                    setFormData({ ...formData, telegram: e.target.value })
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                paddingTop: "16px",
                borderTop: "1px solid #ccc",
                marginTop: "16px",
              }}
            >
              <Button
                label="Отмена"
                fillColor
                onClick={() => {
                  setEditingUser(null);
                  setFormData(null);
                }}
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
