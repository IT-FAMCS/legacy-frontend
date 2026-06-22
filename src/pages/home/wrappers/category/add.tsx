import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useErrorStore } from "../../../../stores/error";
import Button from "../../../../components/Button";
import { ModalWrapper } from "../../../../components/modal";
import { createCategory } from "../../../../api/category";

export function AddCategory({ setIsAdd }: { setIsAdd: (value: boolean) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  const setError = useErrorStore((s) => s.setError);

  const createMutation = useMutation({
    mutationFn: (variables: Parameters<typeof createCategory>[0]) => createCategory(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsAdd(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при создании категории");
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      setError("Введите название категории");
      return;
    }
    createMutation.mutate({ categoryData: { name, description } });
  };

  return (
    <ModalWrapper setIsOpen={setIsAdd}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ color: "white" }}>Создание категории</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ color: "white", fontWeight: 600 }}>Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название категории"
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
              placeholder="Введите описание категории"
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
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Button
            onClick={() => {
              setIsAdd(false);
            }}
            label="Отменить"
            fillColor
          />
          <Button
            onClick={handleSave}
            label="Сохранить"
            fillColor
            style={{ backgroundColor: "#4CAF50" }}
          />
        </div>
      </div>
    </ModalWrapper>
  );
}
