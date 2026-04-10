import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useErrorStore } from "../../stores/error";
import { getCard, updateCard } from "../../api/category";
import Button from "../../components/Button";

export function CardPage() {
  const { categoryId, cardId } = useParams<{ categoryId: string; cardId: string }>();
  const navigate = useNavigate();
  const [isEdit, setIsEdit] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();
  const setError = useErrorStore((s) => s.setError);

  const { data: cardData, isLoading } = useQuery({
    queryKey: ["card", categoryId, cardId],
    queryFn: () => getCard({
      categoryId: Number(categoryId),
      cardId: Number(cardId),
    }),
    enabled: !!categoryId && !!cardId,
  });

  useEffect(() => {
    if (cardData) {
      setTitle(cardData.title);
      setContent(cardData.content);
    }
  }, [cardData]);

  const updateMutation = useMutation({
    mutationFn: (cardData: { title: string; content: string }) =>
      updateCard({ cardId: Number(cardId), cardData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", categoryId, cardId] });
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
    updateMutation.mutate({ title, content });
  };

  if (isLoading) {
    return (
      <div style={{
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
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
              style={{
                width: "100%",
                minHeight: "400px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
                fontFamily: "monospace",
                resize: "vertical",
              }}
            />
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
              <Button
                label="Редактировать"
                fillColor
                style={{ border: "none" }}
                onClick={() => setIsEdit(true)}
              />
            </div>
            <div
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}
              dangerouslySetInnerHTML={{
                __html: content
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
