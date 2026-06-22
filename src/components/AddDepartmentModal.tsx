import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useErrorStore } from "../stores/error";
import Button from "./Button";
import { ModalWrapper } from "./modal";
import { createDepartment } from "../api/user";

export function AddDepartmentModal({ setIsOpen }: { setIsOpen: (value: boolean) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const setError = useErrorStore((s) => s.setError);
  const setSuccess = useErrorStore((s) => s.setSuccess);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      createDepartment({ departmentData: data }),
    onSuccess: () => {
      // Invalidate all queries that might use departments data
      queryClient.invalidateQueries();
      setSuccess(`Отдел "${name}" успешно создан`);
      setIsOpen(false);
      setName("");
      setDescription("");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при создании отдела");
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      setError("Введите название отдела");
      return;
    }
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <ModalWrapper setIsOpen={setIsOpen}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "20px",
        }}
      >
        <h3 style={{ color: "white", fontSize: "1.5rem" }}>Добавление отдела</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ color: "white", fontWeight: 600 }}>Название *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите название отдела"
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ color: "white", fontWeight: 600 }}>Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Введите описание отдела (необязательно)"
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
          <Button
            label="Отмена"
            fillColor
            onClick={() => setIsOpen(false)}
          />
          <Button
            label={createMutation.isPending ? "Создание..." : "Создать"}
            fillColor
            style={{ backgroundColor: "#4CAF50" }}
            onClick={handleSave}
          />
        </div>
      </div>
    </ModalWrapper>
  );
}
