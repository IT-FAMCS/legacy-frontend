import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "../../components/Button";
import { ModalWrapper } from "../../components/modal";
import { AddDepartmentModal } from "../../components/AddDepartmentModal";
import { getDepartments, updateDepartment } from "../../api/user";
import { useCanManageDepartments } from "../../hooks/use-permissions";
import { useErrorStore } from "../../stores/error";
import racoonLoading from "../../assets/images/racoon-loading.gif";

type Department = {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
};

type DepartmentForm = {
  name: string;
  description: string;
};

export function DepartmentsList() {
  const canManageDepartments = useCanManageDepartments();
  const queryClient = useQueryClient();
  const setError = useErrorStore((s) => s.setError);
  const setSuccess = useErrorStore((s) => s.setSuccess);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentForm>({ name: "", description: "" });

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: ({ signal }) => getDepartments({ signal }),
  });

  const editMutation = useMutation({
    mutationFn: ({ departmentId, departmentData }: { departmentId: number; departmentData: DepartmentForm }) =>
      updateDepartment({
        departmentId,
        departmentData: {
          name: departmentData.name.trim(),
          description: departmentData.description.trim() || undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSuccess("Отдел успешно обновлен");
      setEditingDepartment(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при сохранении отдела");
    },
  });

  const handleEditClick = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name || "",
      description: department.description || "",
    });
  };

  const handleSave = () => {
    if (!editingDepartment) return;
    if (!formData.name.trim()) {
      setError("Введите название отдела");
      return;
    }
    editMutation.mutate({ departmentId: editingDepartment.id, departmentData: formData });
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

  return (
    <div style={{ padding: "20px", marginTop: "var(--header-height)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "2rem", marginBottom: "6px" }}>Отделы</h2>
          <p style={{ color: "#666", margin: 0 }}>Список существующих отделов проекта</p>
        </div>
        {canManageDepartments && (
          <Button
            label="Добавить отдел"
            fillColor
            style={{ border: "none", backgroundColor: "#4CAF50" }}
            onClick={() => setIsAddOpen(true)}
          />
        )}
      </div>

      <div className="table-scroll">
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
              <th style={{ padding: "12px", textAlign: "left" }}>Описание</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Создан</th>
              {canManageDepartments && <th style={{ padding: "12px", textAlign: "center" }}>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {departments.map((department: Department) => (
              <tr key={department.id} style={{ borderBottom: "1px solid #ccc" }}>
                <td style={{ padding: "12px", fontWeight: 600 }}>{department.name}</td>
                <td style={{ padding: "12px" }}>{department.description || "-"}</td>
                <td style={{ padding: "12px" }}>
                  {department.created_at ? new Date(department.created_at).toLocaleDateString("ru-RU") : "-"}
                </td>
                {canManageDepartments && (
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <Button
                      label="Редактировать"
                      fillColor
                      style={{ border: "none", padding: "6px 12px", fontSize: "14px" }}
                      onClick={() => handleEditClick(department)}
                    />
                  </td>
                )}
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={canManageDepartments ? 4 : 3} style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                  Отделы пока не добавлены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && <AddDepartmentModal setIsOpen={setIsAddOpen} />}

      {editingDepartment && (
        <ModalWrapper setIsOpen={() => setEditingDepartment(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
            <h3 style={{ color: "white", fontSize: "1.5rem" }}>Редактирование отдела</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ color: "white", fontWeight: 600 }}>Название *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ color: "white", fontWeight: 600 }}>Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "16px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
              <Button label="Отмена" fillColor onClick={() => setEditingDepartment(null)} />
              <Button
                label={editMutation.isPending ? "Сохранение..." : "Сохранить"}
                fillColor
                style={{ backgroundColor: "#4CAF50" }}
                onClick={handleSave}
              />
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}
