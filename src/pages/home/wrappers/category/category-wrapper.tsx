import { useState } from "react";
import type { Category } from "../../../../types/Category";
import { EditCategory } from "./edit";
import { DeleteCategory } from "./delete";
import Button from "../../../../components/Button";
import { useNavigate } from "react-router";

type CategoryWrapperProps = {
  category: Category;
};

const CategoryWrapper = ({ category }: CategoryWrapperProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const navigate = useNavigate();

  return (
  <div style={{
    background: "var(--color-alabaster-grey)",
    padding: "2rem 0.5rem",
    textAlign: "center",
  }}>
    <h2 style={{
      fontSize: "3.5rem",
      color: "var(--сolor-dark-grayish-blue)",
      marginBottom: "1rem",
    }}>
      { category.title || "Название категории не указано" }
    </h2>

    <p style={{
      fontSize: "1.75rem",
      marginBottom: "0.5rem",
    }}>
      { category.description || "Описание категории не указано" }
    </p>

    { /* isChairman && — когда появится бэк*/ <Button
      label="Редактировать"
      fillColor
      style={{ border: "none", width: "200px" }}
      onClick={() => {
        setIsEdit(!isEdit);
      }}
    /> }
    {isEdit && <EditCategory setIsEdit={setIsEdit} category={category} />}

    { /* isChairman && — когда появится бэк*/ <Button
      label="Удалить"
      fillColor
      style={{ border: "none", width: "200px" }}
      onClick={() => {
        setIsDelete(!isEdit);
      }}
    /> }
    {isDelete && <DeleteCategory setIsDelete={setIsDelete} categoryTitle={category.title} />}

    <div style={{ marginTop: "2rem" }}>
      <h3 style={{
        fontSize: "2rem",
        color: "var(--сolor-dark-grayish-blue)",
        marginBottom: "1rem",
      }}>Карточки:</h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1rem",
        padding: "0.5rem",
      }}>
        {category.cards && category.cards.length > 0 ? (
          category.cards.map((card) => (
            <div
              key={card.id}
              onClick={() => navigate(`/card/${category.id}/${card.id}`)}
              style={{
                padding: "1.5rem",
                backgroundColor: "white",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: "120px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
            >
              <span style={{
                fontSize: "1.25rem",
                color: "var(--сolor-dark-grayish-blue)",
                fontWeight: 600,
                textAlign: "center",
              }}>
                {card.title}
              </span>
            </div>
          ))
        ) : (
          <p style={{ color: "var(--сolor-dark-grayish-blue)", fontStyle: "italic", gridColumn: "1 / -1", textAlign: "center" }}>
            В этой категории пока нет карточек
          </p>
        )}
      </div>
    </div>
  </div>
  );
};

export default CategoryWrapper;
