import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "../../stores/user";
import { editUser, getPositions, getDepartments } from "../../api/user";
import { useErrorStore } from "../../stores/error";
import Button from "../../components/Button";
import { ModalWrapper } from "../../components/modal";
import { MultiSelect } from "../../components/MultiSelect";

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

export function EditUser({ 
  setIsEdit, 
  targetUser 
}: { 
  setIsEdit: (value: boolean) => void;
  targetUser?: User | null;
}) {
  const currentUser = useUserStore((s) => s.user);
  const setError = useErrorStore((s) => s.setError);
  const queryClient = useQueryClient();
  
  // Use targetUser if provided (editing another user), otherwise use currentUser
  const userToEdit = targetUser || currentUser;

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    department_ids: [] as number[],
    course: "",
    group: "",
    birth_date: "",
    telegram: "",
    position: "",
  });

  // Fetch positions for dropdown
  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: ({ signal }) => getPositions({ signal }),
  });

  // Fetch all departments from API
  const { data: allDepartments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: ({ signal }) => getDepartments({ signal }),
  });

  // Convert departments to options for MultiSelect
  const departmentOptions = allDepartments.map((dept: { id: number; name: string }) => ({
    value: String(dept.id),
    label: dept.name,
  }));

  useEffect(() => {
    if (userToEdit && "departments" in userToEdit) {
      // Get department IDs from user.departments array
      const deptIds = (userToEdit as User).departments?.map((d: { id: number; name: string }) => d.id) || [];
      setFormData({
        first_name: (userToEdit as User).first_name || "",
        last_name: (userToEdit as User).last_name || "",
        middle_name: (userToEdit as User).middle_name || "",
        department_ids: deptIds,
        course: (userToEdit as User).course || "",
        group: (userToEdit as User).group || "",
        // Parse birth_date properly - backend returns ISO format
        birth_date: (userToEdit as User).birth_date ? (userToEdit as User).birth_date!.split("T")[0].split(" ")[0] : "",
        telegram: (userToEdit as User).telegram || "",
        position: (userToEdit as User).position_name || "",
      });
    }
  }, [userToEdit]);

  const editMutation = useMutation({
    mutationFn: (data: { userData: Partial<{
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
    }>; login?: string }) => editUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userToEdit?.login] });
      setIsEdit(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при сохранении");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!userToEdit) return;
    
    editMutation.mutate({
      userData: {
        login: userToEdit.login,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        middle_name: formData.middle_name || undefined,
        department_ids: formData.department_ids.length > 0 ? formData.department_ids : undefined,
        course: formData.course || undefined,
        group: formData.group || undefined,
        // Convert date to ISO format with time component
        birth_date: formData.birth_date ? `${formData.birth_date}T00:00:00` : undefined,
        telegram: formData.telegram || undefined,
        position: formData.position || undefined,
      },
    });
  };

  return (
    <ModalWrapper setIsOpen={setIsEdit}>
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
        <h3 style={{ margin: 0, fontSize: "1.5rem" }}>Редактирование пользователя</h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600 }}>Фамилия</label>
            <input
              name="last_name"
              type="text"
              value={formData.last_name}
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
              name="first_name"
              type="text"
              value={formData.first_name}
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
              name="middle_name"
              type="text"
              value={formData.middle_name}
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
            <label style={{ fontSize: "14px", fontWeight: 600 }}>Отделы</label>
            <MultiSelect
              options={departmentOptions}
              selectedValues={formData.department_ids.map(String)}
              onChange={(values: string[]) => {
                setFormData({ ...formData, department_ids: values.map(Number) });
              }}
              placeholder="Выберите отделы"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600 }}>Должность</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
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
              <option value="">Не выбрана</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.name}>{pos.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600 }}>Курс</label>
            <input
              name="course"
              type="text"
              value={formData.course}
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
              name="birth_date"
              type="date"
              value={formData.birth_date}
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
            <label style={{ fontSize: "14px", fontWeight: 600 }}>Telegram</label>
            <input
              name="telegram"
              type="text"
              value={formData.telegram}
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
          paddingTop: "16px",
          borderTop: "1px solid #ccc",
          marginTop: "16px",
        }}>
          <Button
            onClick={() => {
              setIsEdit(false);
            }}
            label="Отмена"
            fillColor
          />
          <Button
            onClick={handleSubmit}
            label={editMutation.isPending ? "Сохранение..." : "Сохранить"}
            fillColor
            style={{ backgroundColor: "#4CAF50" }}
          />
        </div>
      </div>
    </ModalWrapper>
  );
};
