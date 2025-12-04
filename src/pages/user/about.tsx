import Button from "../../components/Button";
import {useUserStore} from "../../stores/user";
import {EditUser} from "./edit";
import {useState} from "react";

export function AboutUser() {
  const user = useUserStore((s) => s.user);
  const [isEdit, setIsEdit] = useState(false);

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
      <h3>Личный кабинет</h3>
      <p>
        ФИО: {user?.firstName} {user?.lastName}
      </p>
      <p>Курс: {user?.course}</p>
      <p>Группа: {user?.group}</p>
      <p>ДР: {user?.hb}</p>
      <p>Должность: {user?.position}</p>
      <Button
        label="Редактировать"
        fillColor
        style={{border: "none", width: "200px"}}
        onClick={() => {
          setIsEdit(!isEdit);
        }}
      />
      {isEdit && <EditUser setIsEdit={setIsEdit}/>}
    </div>
  );
}
