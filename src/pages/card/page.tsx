import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useErrorStore } from "../../stores/error";
import Button from "../../components/Button";
import { MultiSelect } from "../../components/MultiSelect";
import { getPositions } from "../../api/user";
import { useCanEditCards } from "../../hooks/use-permissions";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function getAuthHeaders() {
  const token = localStorage.getItem("jwt_token");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchCard(cardId: number) {
  const res = await fetch(`${API_BASE}/api/cards/${cardId}`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }
  return await res.json();
}

async function updateCardApi({
  cardId,
  cardData,
}: {
  cardId: number;
  cardData: {
    title?: string;
    content?: string;
    access_positions?: string;
    access_logins?: string;
  };
}) {
  const res = await fetch(`${API_BASE}/api/cards/${cardId}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(cardData),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }
  return await res.json();
}

export function CardPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const [isEdit, setIsEdit] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
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

  const { data: cardData, isLoading } = useQuery({
    queryKey: ["card", cardId],
    queryFn: () => fetchCard(Number(cardId)),
    enabled: !!cardId,
  });

  useEffect(() => {
    if (cardData) {
      setTitle(cardData.title);
      setContent(cardData.content || "");
      // Parse comma-separated positions to array
      if (cardData.access_positions) {
        setSelectedPositions(cardData.access_positions.split(",").map((p: string) => p.trim()).filter(Boolean));
      } else {
        setSelectedPositions([]);
      }
      setAccessLogins(cardData.access_logins || "");
    }
  }, [cardData]);

  const updateMutation = useMutation({
    mutationFn: (data: { title?: string; content?: string; access_positions?: string; access_logins?: string }) =>
      updateCardApi({ cardId: Number(cardId), cardData: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", cardId] });
      setIsEdit(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при сохранении");
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      setError("Введите заголовок");
      return;
    }
    updateMutation.mutate({
      title,
      content,
      access_positions: selectedPositions.length > 0 ? selectedPositions.join(",") : undefined,
      access_logins: accessLogins || undefined,
    });
  };

  if (isLoading) {
    return (
      <div style={{
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
        marginTop: "var(--header-height)",
      }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div style={{
      padding: "20px",
      maxWidth: "900px",
      margin: "0 auto",
      marginTop: "var(--header-height)",
    }}>
      <div style={{ marginBottom: "20px" }}>
        <Button
          label="← Назад"
          fillColor
          style={{ border: "none" }}
          onClick={() => navigate(-1)}
        />
      </div>

      <div style={{
        backgroundColor: "var(--color-alabaster-grey)",
        borderRadius: "10px",
        padding: "32px",
      }}>
        {isEdit ? (
          <>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "24px",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Содержимое карточки (поддерживается Markdown)"
              style={{
                width: "100%",
                minHeight: "300px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
                fontFamily: "monospace",
                resize: "vertical",
              }}
            />
            
            <div style={{
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "white",
              borderRadius: "8px",
            }}>
              <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>Настройки доступа</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <MultiSelect
                  options={positionOptions}
                  selectedValues={selectedPositions}
                  onChange={setSelectedPositions}
                  placeholder="Выберите должности"
                  label="Доступ для должностей"
                />
                <small style={{ color: "#666", fontSize: "12px" }}>
                  Оставьте пустым для доступа всем
                </small>
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Доступ для пользователей (логины, через запятую)
                  </label>
                  <input
                    type="text"
                    value={accessLogins}
                    onChange={(e) => setAccessLogins(e.target.value)}
                    placeholder="например: admin, ivanov"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                    }}
                  />
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    Оставьте пустым для доступа всем
                  </small>
                </div>
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "12px",
              marginTop: "16px",
            }}>
              <Button
                label="Сохранить"
                fillColor
                style={{ border: "none", backgroundColor: "#4CAF50" }}
                onClick={handleSave}
              />
              <Button
                label="Отмена"
                fillColor
                style={{ border: "none" }}
                onClick={() => setIsEdit(false)}
              />
            </div>
          </>
        ) : (
          <>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}>
              <h1 style={{ fontSize: "2.5rem", color: "var(--сolor-dark-grayish-blue)" }}>
                {title}
              </h1>
              {canEditCards && (
                <Button
                  label="Редактировать"
                  fillColor
                  style={{ border: "none" }}
                  onClick={() => setIsEdit(true)}
                />
              )}
            </div>
            
            {(selectedPositions.length > 0 || accessLogins) && (
              <div style={{
                padding: "12px",
                backgroundColor: "#fff3cd",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "14px",
              }}>
                <strong>Ограниченный доступ:</strong>
                {selectedPositions.length > 0 && <div>Должности: {selectedPositions.join(", ")}</div>}
                {accessLogins && <div>Пользователи: {accessLogins}</div>}
              </div>
            )}
            
            <div
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}
              dangerouslySetInnerHTML={{
                __html: (content || "")
                  .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                  .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                  .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                  .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                  .replace(/\*(.*)\*/gim, '<em>$1</em>')
                  .replace(/^- (.*$)/gim, '<li>$1</li>')
                  .replace(/\n/gim, '<br />')
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
