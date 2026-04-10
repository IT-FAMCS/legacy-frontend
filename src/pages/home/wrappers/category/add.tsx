import { useState } from "react";
import Button from "../../../../components/Button";
import { ModalWrapper } from "../../../../components/modal";

export function AddCategory({ setIsAdd }: { setIsAdd: (value: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    // TODO: Отправить данные на бэкенд для создания категории
    console.log("Создание категории:", { title, description });
    setIsAdd(false);
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
