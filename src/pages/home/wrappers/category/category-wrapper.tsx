import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { Category, Card } from "../../../../types/Category";
import { EditCategory } from "./edit";
import { AddCard } from "./add-card";
import Button from "../../../../components/Button";
import { useUserStore } from "../../../../stores/user";
import { getCards } from "../../../../api/category";
import { useCanEditCategories, useCanEditCards } from "../../../../hooks/use-permissions";

type CategoryWrapperProps = {
  category: Category;
};

const CategoryWrapper = ({ category }: CategoryWrapperProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const [isAddCard, setIsAddCard] = useState(false);
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.user);

  const { data: allCards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: ({ signal }) => getCards({ signal }),
  });

  // Filter cards by category
  const cards = allCards.filter(card => card.category_id === category.id);

  // Check permissions using position flags from backend via hooks
  const canEditCategories = useCanEditCategories();
  const canEditCards = useCanEditCards();

  const canViewCard = (card: Card) => {
    // If no access restrictions, everyone can view
    if (!card.access_positions && !card.access_logins) return true;
    
    // Check position-based access
    if (card.access_positions) {
      const allowedPositions = card.access_positions.split(",").map(p => p.trim().toLowerCase());
      if (currentUser?.position_name && allowedPositions.some(pos => 
        currentUser.position_name?.toLowerCase().includes(pos)
      )) {
        return true;
      }
    }
    
    // Check login-based access
    if (card.access_logins) {
      const allowedLogins = card.access_logins.split(",").map(l => l.trim().toLowerCase());
      if (currentUser?.login && allowedLogins.includes(currentUser.login.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  };

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
        {category.name || "Название категории не указано"}
      </h2>

      <p style={{
        fontSize: "1.75rem",
        marginBottom: "0.5rem",
      }}>
        {category.description || "Описание категории не указано"}
      </p>

      {canEditCategories && (
        <>
          <Button
            label="Редактировать"
            fillColor
            style={{ border: "none", width: "200px", marginRight: "8px" }}
            onClick={() => {
              setIsEdit(!isEdit);
            }}
          />
        </>
      )}
      {isEdit && <EditCategory setIsEdit={setIsEdit} category={category} />}
      {isAddCard && <AddCard setIsAdd={setIsAddCard} categoryId={category.id} categoryName={category.name} />}

      <div style={{ marginTop: "2rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
          padding: "0.5rem",
        }}>
          {cards.filter(canViewCard).map((card) => (
            <div
              key={card.id}
              onClick={() => navigate(`/card/${category.id}/${card.id}`)}
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "16px",
                cursor: "pointer",
                transition: "transform 0.2s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <h4 style={{
                fontSize: "1.25rem",
                marginBottom: "12px",
                color: "var(--сolor-dark-grayish-blue)",
                minHeight: "3rem",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {card.title}
              </h4>
              <p style={{
                fontSize: "0.9rem",
                color: "#666",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                lineHeight: "1.4",
                flex: 1,
                margin: 0,
              }}>
                {card.content || "Нет содержимого"}
              </p>
              {(card.access_positions || card.access_logins) && (
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "12px",
                }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    backgroundColor: "#fff3cd",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#856404",
                  }}>
                    🔒 Ограниченный доступ
                  </span>
                </div>
              )}
            </div>
          ))}
          
          {/* Add Card Button - at the end of the list */}
          {canEditCards && (
            <div
              onClick={() => setIsAddCard(true)}
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "16px",
                cursor: "pointer",
                transition: "transform 0.2s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "150px",
                border: "2px dashed #ccc",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "#686ACF";
                e.currentTarget.style.backgroundColor = "#f8f8ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#ccc";
                e.currentTarget.style.backgroundColor = "white";
              }}
            >
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}>
                <span style={{
                  fontSize: "4rem",
                  color: "#686ACF",
                  fontWeight: 300,
                  lineHeight: 1,
                }}>
                  +
                </span>
                <span style={{
                  fontSize: "0.9rem",
                  color: "#686ACF",
                  fontWeight: 500,
                }}>
                  Добавить карточку
                </span>
              </div>
            </div>
          )}
          
          {cards.filter(canViewCard).length === 0 && !canEditCards && (
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
