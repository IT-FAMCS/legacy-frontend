import Button from "../../components/Button";
import { useUserStore } from "../../stores/user";
import { EditUser } from "./edit";
import { useState } from "react";
import "./styles/page-about-styles.css";

export function AboutUser() {
  const user = useUserStore((s) => s.user);
  const [isEdit, setIsEdit] = useState(false);

  if (!user) {
    return (
      <div className="about-user">
        <h3>Личный кабинет</h3>
        
        <div className="user-info-grid">
          <div className="info-card user-not-found-card">
            <div className="user-not-found-icon">
              <span>?</span>
            </div>
            
            <h4 className="user-not-found-title">
              Пользователь не найден
            </h4>
            
            <p className="user-not-found-message">
              Не удалось загрузить информацию о пользователе. 
              Попробуйте обновить страницу или войти в систему.
            </p>
            
            <div className="user-actions user-not-found-actions">
              <Button
                label="Обновить страницу"
                className="button"
                onClick={() => window.location.reload()}
              />
              <Button
                label="Выйти"
                className="button button-secondary"
                onClick={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="about-user">
      <h3>Личный кабинет</h3>
      
      <div className="user-info-grid">
        <div className="info-card">
          <div className="info-item">
            <span className="info-label">ФИО</span>
            <span className="info-value">{user.firstName} {user.lastName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Должность</span>
            <span className="info-value">{user.position}</span>
          </div>
        </div>
        
        <div className="info-card">
          <div className="info-item">
            <span className="info-label">Курс</span>
            <span className="info-value">{user.course}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Группа</span>
            <span className="info-value">{user.group}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Дата рождения</span>
            <span className="info-value">{user.hb}</span>
          </div>
        </div>
      </div>

      <div className="user-actions">
        <Button
          label="Редактировать"
          className="button"
          onClick={() => setIsEdit(!isEdit)}
        />
        <Button
          label="Настройки"
          className="button button-secondary"
          onClick={() => {}}
        />
      </div>
      
      {isEdit && <EditUser setIsEdit={setIsEdit} />}
    </div>
  );
}