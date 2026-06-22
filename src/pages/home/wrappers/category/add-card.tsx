import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useErrorStore } from "../../../../stores/error";
import Button from "../../../../components/Button";
import { ModalWrapper } from "../../../../components/modal";
import { createCard } from "../../../../api/category";
import { getPositions } from "../../../../api/user";
import { useCanEditCards } from "../../../../hooks/use-permissions";
import { MultiSelect } from "../../../../components/MultiSelect";

export function AddCard({ 
  setIsAdd, 
  categoryId,
  categoryName 
}: { 
  setIsAdd: (value: boolean) => void;
  categoryId: number;
  categoryName: string;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [accessLogins, setAccessLogins] = useState("");
  const queryClient = useQueryClient();
  const setError = useErrorStore((s) => s.setError);
  const canEditCards = useCanEditCards();

  // Fetch positions from backend
  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: ({ signal }) => getPositions({ signal }),
  });

  // Convert positions to options for MultiSelect
  const positionOptions = positions.map(pos => ({
    value: pos.name,
    label: pos.name,
  }));

  const createMutation = useMutation({
    mutationFn: (variables: Parameters<typeof createCard>[0]) => createCard(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      setIsAdd(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при создании карточки");
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      setError("Введите название карточки");
      return;
    }
    createMutation.mutate({ 
      cardData: { 
        title, 
        content: content || undefined, 
        category_id: categoryId,
        access_positions: selectedPositions.length > 0 ? selectedPositions.join(",") : undefined,
        access_logins: accessLogins || undefined,
      } 
    });
  };

  if (!canEditCards) {
    return null;
  }

  return (
    <ModalWrapper setIsOpen={setIsAdd}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          gap: "16px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ color: "white" }}>Создание карточки в категории "{categoryName}"</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ color: "white", fontWeight: 600 }}>Название *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название карточки"
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ color: "white", fontWeight: 600 }}>Содержимое</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Введите содержимое карточки"
              rows={6}
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

          <div style={{ 
            padding: "16px", 
            backgroundColor: "rgba(255,255,255,0.1)", 
            borderRadius: "8px",
            marginTop: "8px",
          }}>
            <h4 style={{ color: "white", margin: "0 0 12px 0", fontSize: "16px" }}>
              🔒 Доступ (необязательно)
            </h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <MultiSelect
                options={positionOptions}
                selectedValues={selectedPositions}
                onChange={setSelectedPositions}
                placeholder="Выберите должности"
                label="Должности"
              />
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
                Оставьте пустым для общего доступа
              </span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ color: "white", fontWeight: 500, fontSize: "14px" }}>
                  Логины (через запятую)
                </label>
                <input
                  type="text"
                  value={accessLogins}
                  onChange={(e) => setAccessLogins(e.target.value)}
                  placeholder="ivanov, petrov"
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>
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
            label={createMutation.isPending ? "Создание..." : "Создать"}
            fillColor
            style={{ backgroundColor: "#4CAF50" }}
          />
        </div>
      </div>
    </ModalWrapper>
  );
}
