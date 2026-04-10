import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "../../../../components/Button";
import { ModalWrapper } from "../../../../components/modal";
import { updateCategory } from "../../../../api/category";
import type { Category } from "../../../../types/Category";

export function EditCategory({
  setIsEdit,
  category,
}: {
  setIsEdit: (value: boolean) => void;
  category?: Category;
}) {
  const [title, setTitle] = useState(category?.title || "");
  const [description, setDescription] = useState(category?.description || "");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (category) {
      setTitle(category.title);
      setDescription(category.description);
    }
  }, [category]);

  const updateMutation = useMutation({
    mutationFn: ({ categoryId, categoryData }: { categoryId: number; categoryData: { title: string; description: string } }) =>
      updateCategory({ categoryId, categoryData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsEdit(false);
    },
    onError: (err) => {
      console.error("Ошибка обновления категории:", err);
      alert("Ошибка при обновлении категории");
    },
  });

  const handleSave = () => {
    if (!title.trim() || !category?.id) {
      alert("Введите название категории");
      return;
    }
    updateMutation.mutate({ categoryId: category.id, categoryData: { title, description } });
  };

  return (
    <ModalWrapper setIsOpen={setIsEdit}>
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
          <h3 style={{ color: "white" }}>Редактирование категории</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ color: "white", fontWeight: 600 }}>Название</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              setIsEdit(false);
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
