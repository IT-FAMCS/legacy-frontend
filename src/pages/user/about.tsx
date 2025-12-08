import { useUserStore } from "../../stores/user";
import { EditUser } from "./edit";
import { useState } from "react";
import "./styles/page-about-styles.css";

export function AboutUser() {
  const user = useUserStore((s) => s.user);
  const [isEdit, setIsEdit] = useState(false);
  return (
    <div className="about-user">
      <h3>Личный кабинет</h3>
      
      <div className="user-info-grid">
        <div className="info-card">
          <div className="info-item">
            <span className="info-label">ФИО</span>
            <span className="info-value">{user?.firstName} {user?.lastName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Должность</span>
            <span className="info-value">{user?.position}</span>
          </div>
        </div>
        
        <div className="info-card">
          <div className="info-item">
            <span className="info-label">Курс</span>
            <span className="info-value">{user?.course}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Группа</span>
            <span className="info-value">{user?.group}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Дата рождения</span>
            <span className="info-value">{user?.hb}</span>
          </div>
        </div>
      </div>

      <div className="user-actions">
        <button
        title="Редактировать"
          className="button"
          onClick={() => setIsEdit(!isEdit)}
        >Редактировать</button>
        <button
          title="Настройки"
          className="button button-secondary"
          onClick={() => {}}
        >Настройки</button>
      </div>
      
      {isEdit && <EditUser setIsEdit={setIsEdit} />}
    </div>
  );
}