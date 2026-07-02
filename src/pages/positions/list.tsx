import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useErrorStore } from "../../stores/error";
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from "../../api/user";
import { useUserStore } from "../../stores/user";
import Button from "../../components/Button";
import { ModalWrapper } from "../../components/modal";
import type { Position } from "../../types/Position";
import racoonLoading from "../../assets/images/racoon-loading.gif";

type PositionFormData = {
  name: string;
  hierarchy_level: number;
  can_register_users: boolean;
  can_edit_categories: boolean;
  can_delete_categories: boolean;
  can_edit_cards: boolean;
  can_delete_cards: boolean;
  can_edit_any_user: boolean;
  can_manage_positions: boolean;
};

export function PositionsList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState<PositionFormData | null>(null);

  const queryClient = useQueryClient();
  const setError = useErrorStore((s) => s.setError);
  const currentUser = useUserStore((s) => s.user);

  const { data: positions, isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: ({ signal }) => getPositions({ signal }),
  });

  const createMutation = useMutation({
    mutationFn: (positionData: PositionFormData) =>
      createPosition({ positionData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setIsCreateOpen(false);
      setFormData(null);
    },
    onError: (err) => {
      setError(
        err instanceof Error ? err.message : "Ошибка при создании должности",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      positionId,
      positionData,
    }: {
      positionId: number;
      positionData: Partial<PositionFormData>;
    }) => updatePosition({ positionId, positionData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setEditingPosition(null);
      setFormData(null);
    },
    onError: (err) => {
      setError(
        err instanceof Error ? err.message : "Ошибка при обновлении должности",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (positionId: number) => deletePosition({ positionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
    onError: (err) => {
      setError(
        err instanceof Error ? err.message : "Ошибка при удалении должности",
      );
    },
  });

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      name: position.name,
      hierarchy_level: position.hierarchy_level,
      can_register_users: position.can_register_users,
      can_edit_categories: position.can_edit_categories,
      can_delete_categories: position.can_delete_categories,
      can_edit_cards: position.can_edit_cards,
      can_delete_cards: position.can_delete_cards,
      can_edit_any_user: position.can_edit_any_user,
      can_manage_positions: position.can_manage_positions,
    });
  };

  const handleCreate = () => {
    setEditingPosition(null);
    setFormData({
      name: "",
      hierarchy_level: 6,
      can_register_users: false,
      can_edit_categories: false,
      can_delete_categories: false,
      can_edit_cards: false,
      can_delete_cards: false,
      can_edit_any_user: false,
      can_manage_positions: false,
    });
    setIsCreateOpen(true);
  };

  const handleSave = () => {
    if (!formData) return;
    if (editingPosition) {
      updateMutation.mutate({
        positionId: editingPosition.id,
        positionData: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (position: Position) => {
    if (confirm(`Удалить должность "${position.name}"?`)) {
      deleteMutation.mutate(position.id);
    }
  };

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
        <img alt="racoon" src={racoonLoading} width={256} height={256} />
        <p>Загрузка...</p>
      </div>
    );
  }

  const canManagePositions =
    currentUser?.position_name &&
    ["админ", "зам", "председатель"].some((role) =>
      currentUser.position_name?.toLowerCase().includes(role),
    );

  return (
    <div style={{ padding: "20px", marginTop: "var(--header-height)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ fontSize: "2rem" }}>Должности</h2>
        {canManagePositions && (
          <Button
            label="Создать должность"
            fillColor
            style={{ border: "none" }}
            onClick={handleCreate}
          />
        )}
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
            <th style={{ padding: "12px", textAlign: "left" }}>Название</th>
            <th style={{ padding: "12px", textAlign: "center" }}>Уровень</th>
            <th style={{ padding: "12px", textAlign: "center" }}>
              Регистрация
            </th>
            <th style={{ padding: "12px", textAlign: "center" }}>Категории</th>
            <th style={{ padding: "12px", textAlign: "center" }}>Карточки</th>
            <th style={{ padding: "12px", textAlign: "center" }}>
              Пользователи
            </th>
            <th style={{ padding: "12px", textAlign: "center" }}>Должности</th>
            {canManagePositions && (
              <th style={{ padding: "12px", textAlign: "center" }}>Действия</th>
            )}
          </tr>
        </thead>
        <tbody>
          {positions?.map((position: Position) => (
            <tr
              key={position.id}
              style={{
                borderBottom: "1px solid #ccc",
              }}
            >
              <td style={{ padding: "12px" }}>{position.name}</td>
              <td style={{ padding: "12px", textAlign: "center" }}>
                {position.hierarchy_level}
              </td>
              <td style={{ padding: "12px", textAlign: "center" }}>
                {position.can_register_users ? "✓" : "—"}
              </td>
              <td style={{ padding: "12px", textAlign: "center" }}>
                {position.can_edit_categories ? "✓" : "—"}
                {position.can_delete_categories ? " (удаление)" : ""}
              </td>
              <td style={{ padding: "12px", textAlign: "center" }}>
                {position.can_edit_cards ? "✓" : "—"}
                {position.can_delete_cards ? " (удаление)" : ""}
              </td>
              <td style={{ padding: "12px", textAlign: "center" }}>
                {position.can_edit_any_user ? "✓" : "—"}
              </td>
              <td style={{ padding: "12px", textAlign: "center" }}>
                {position.can_manage_positions ? "✓" : "—"}
              </td>
              {canManagePositions && (
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
                    onClick={() => handleEdit(position)}
                  />
                  <Button
                    label="Удалить"
                    fillColor
                    style={{
                      border: "none",
                      padding: "6px 12px",
                      fontSize: "14px",
                      backgroundColor: "#f44336",
                    }}
                    onClick={() => handleDelete(position)}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {(isCreateOpen || editingPosition) && formData && (
        <ModalWrapper
          setIsOpen={() => {
            setEditingPosition(null);
            setIsCreateOpen(false);
            setFormData(null);
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              height: "100%",
              overflowY: "auto",
            }}
          >
            <h3>
              {editingPosition
                ? "Редактирование должности"
                : "Создание должности"}
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label style={{ fontSize: "14px", fontWeight: 600 }}>
                Название должности
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
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
                Уровень иерархии (1-10, 1 = высший)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.hierarchy_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hierarchy_level: Number(e.target.value),
                  })
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
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.can_register_users}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_register_users: e.target.checked,
                    })
                  }
                />
                Регистрация пользователей
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.can_edit_categories}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_edit_categories: e.target.checked,
                    })
                  }
                />
                Редактирование категорий
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.can_delete_categories}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_delete_categories: e.target.checked,
                    })
                  }
                />
                Удаление категорий
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.can_edit_cards}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_edit_cards: e.target.checked,
                    })
                  }
                />
                Редактирование карточек
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.can_delete_cards}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_delete_cards: e.target.checked,
                    })
                  }
                />
                Удаление карточек
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.can_edit_any_user}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_edit_any_user: e.target.checked,
                    })
                  }
                />
                Редактирование пользователей
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.can_manage_positions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_manage_positions: e.target.checked,
                    })
                  }
                />
                Управление должностями
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                paddingTop: "12px",
              }}
            >
              <Button
                label="Отмена"
                fillColor
                onClick={() => {
                  setEditingPosition(null);
                  setIsCreateOpen(false);
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
