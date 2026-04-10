import { useState, useEffect } from "react";
import { useEditUser } from "../../hooks/use-user";
import { useUserStore } from "../../stores/user";
import Button from "../../components/Button";
import { ModalWrapper } from "../../components/modal";

export function EditUser({ setIsEdit }: { setIsEdit: (value: boolean) => void }) {
  const user = useUserStore((s) => s.user);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    patronymic: "",
    department: "",
    course: "",
    group: "",
    hb: "",
    position: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        patronymic: user.patronymic || "",
        department: user.department || "",
        course: user.course?.toString() || "",
        group: user.group?.toString() || "",
        hb: user.hb || "",
        position: user.position || "",
      });
    }
  }, [user]);

  const editMutation = useEditUser();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editMutation.mutate({
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      patronymic: formData.patronymic || undefined,
      department: formData.department || undefined,
      course: formData.course ? Number(formData.course) : undefined,
      group: formData.group ? Number(formData.group) : undefined,
      hb: formData.hb || undefined,
      position: formData.position || undefined,
    });
  };

  return (
    <ModalWrapper setIsOpen={setIsEdit}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          gap: "12px",
        }}
      >
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          overflowY: "auto",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600 }}>Фамилия</label>
            <input
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
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
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
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
              name="patronymic"
              type="text"
              value={formData.patronymic}
              onChange={handleChange}
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
              name="department"
              type="text"
              value={formData.department}
              onChange={handleChange}
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
              name="course"
              type="number"
              value={formData.course}
              onChange={handleChange}
              min="1"
              max="6"
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
              name="group"
              type="text"
              value={formData.group}
              onChange={handleChange}
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
              name="hb"
              type="date"
              value={formData.hb}
              onChange={handleChange}
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
              name="position"
              type="text"
              value={formData.position}
              onChange={handleChange}
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
            onClick={() => {
              setIsEdit(false);
            }}
            label="Отмена"
            fillColor
          />
          <Button
            onClick={() => {}}
            label={editMutation.isPending ? "Сохранение..." : "Сохранить"}
            fillColor
            style={{ backgroundColor: "#4CAF50" }}
          />
        </div>
      </form>
    </ModalWrapper>
  );
}
