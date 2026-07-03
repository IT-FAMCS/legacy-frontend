import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useErrorStore } from "../../stores/error";
import Button from "../../components/Button";
import { MultiSelect } from "../../components/MultiSelect";
import { getPositions } from "../../api/user";
import { deleteCard, getCard, updateCard } from "../../api/category";
import { useCanDeleteCards, useCanEditCards } from "../../hooks/use-permissions";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import racoonLoading from "../../assets/images/racoon-loading.gif";
import { handleMarkdownHotkey } from "../../utils/markdown-hotkeys";

function toggleTaskInMarkdown(markdown: string, taskIndex: number, checked: boolean): string {
  let currentTaskIndex = -1;
  return markdown
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => {
      const match = /^(\s*[-+*]\s+\[)( |x|X)(\]\s+.*)$/.exec(line);
      if (!match) return line;
      currentTaskIndex += 1;
      if (currentTaskIndex !== taskIndex) return line;
      return `${match[1]}${checked ? "x" : " "}${match[3]}`;
    })
    .join("\n");
}

export function CardPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const [isEdit, setIsEdit] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [accessLogins, setAccessLogins] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const setError = useErrorStore((s) => s.setError);
  const setSuccess = useErrorStore((s) => s.setSuccess);
  const canEditCards = useCanEditCards();
  const canDeleteCards = useCanDeleteCards();
  const numericCardId = Number(cardId);

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: ({ signal }) => getPositions({ signal }),
  });

  const positionOptions = positions.map((pos) => ({
    value: pos.name,
    label: pos.name,
  }));

  const { data: cardData, isLoading } = useQuery({
    queryKey: ["card", cardId],
    queryFn: ({ signal }) => getCard({ signal, cardId: numericCardId }),
    enabled: !!cardId,
  });

  useEffect(() => {
    if (cardData) {
      setTitle(cardData.title);
      setContent(cardData.content || "");
      setSelectedPositions(
        cardData.access_positions
          ? cardData.access_positions.split(",").map((p: string) => p.trim()).filter(Boolean)
          : [],
      );
      setAccessLogins(cardData.access_logins || "");
    }
  }, [cardData]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const updateMutation = useMutation({
    mutationFn: (data: {
      title?: string;
      content?: string;
      access_positions?: string;
      access_logins?: string;
    }) => updateCard({ cardId: numericCardId, cardData: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", cardId] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      setIsEdit(false);
      setSuccess("Карточка сохранена");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при сохранении");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCard({ cardId: numericCardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      setSuccess("Карточка удалена");
      navigate(-1);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка при удалении карточки");
    },
  });

  const saveContentSilently = useCallback((nextContent: string) => {
    queryClient.setQueryData(["card", cardId], (old: unknown) => {
      if (!old || typeof old !== "object") return old;
      return { ...(old as Record<string, unknown>), content: nextContent };
    });

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        await updateCard({ cardId: numericCardId, cardData: { content: nextContent } });
        queryClient.invalidateQueries({ queryKey: ["card", cardId] });
        queryClient.invalidateQueries({ queryKey: ["cards"] });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка при обновлении чекбокса");
      }
    }, 700);
  }, [cardId, numericCardId, queryClient, setError]);

  const handleTaskToggle = useCallback((taskIndex: number, checked: boolean) => {
    if (!canEditCards) {
      setError("Недостаточно прав для изменения карточки");
      return;
    }
    const nextContent = toggleTaskInMarkdown(content, taskIndex, checked);
    setContent(nextContent);
    saveContentSilently(nextContent);
  }, [canEditCards, content, saveContentSilently, setError]);

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

  const handleDelete = () => {
    if (!confirm(`Удалить карточку "${title}"?`)) return;
    deleteMutation.mutate();
  };

  const handleMarkdownHotkeys = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    handleMarkdownHotkey(event, setContent);
  };

  const jumpToWordInEditor = (word: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !word) return;
    const index = content.toLowerCase().indexOf(word.toLowerCase());
    if (index < 0) return;

    textarea.focus();
    textarea.setSelectionRange(index, index + word.length);

    const before = content.slice(0, index);
    const line = before.split("\n").length;
    const approxLineHeight = 22;
    textarea.scrollTop = Math.max(0, (line - 4) * approxLineHeight);
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: "var(--header-height)" }}>
        <img alt="racoon" src={racoonLoading} width={256} height={256} />
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1220px", margin: "0 auto", marginTop: "var(--header-height)" }}>
      <div style={{ marginBottom: "20px" }}>
        <Button label="← Назад" fillColor style={{ border: "none" }} onClick={() => navigate(-1)} />
      </div>

      <div style={{ backgroundColor: "var(--color-alabaster-grey)", borderRadius: "10px", padding: "32px" }}>
        {isEdit ? (
          <>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}
            />

            <div className="markdown-editor-layout">
              <div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleMarkdownHotkeys}
                  placeholder="Содержимое карточки (поддерживается Markdown)"
                  aria-label="Содержимое карточки в формате Markdown"
                  style={{ width: "100%", minHeight: "460px", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px", fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }}
                />
                <small style={{ display: "block", marginTop: "8px", color: "#666" }}>
                  Горячие клавиши: Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K, Ctrl+E, Ctrl+Shift+X, Ctrl+Shift+7/8.
                </small>
              </div>

              <div style={{ padding: "16px", border: "1px solid #d8d8df", borderRadius: "8px", backgroundColor: "white", minHeight: "460px", maxHeight: "620px", overflowY: "auto" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>Предпросмотр</h3>
                <MarkdownRenderer
                  content={content}
                  onTaskToggle={canEditCards ? handleTaskToggle : undefined}
                  onWordDoubleClick={jumpToWordInEditor}
                />
              </div>
            </div>

            <details style={{ marginTop: "10px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>Подсказка по Markdown</summary>
              <div style={{ marginTop: "8px", padding: "12px", borderRadius: "8px", backgroundColor: "white", fontFamily: "monospace", fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {`**жирный**  *курсив*  ++подчёркнутый++  ~~зачёркнутый~~
[ссылка](https://example.com)  ![описание](https://example.com/image.png)
- список
  - вложенный пункт
- [x] выполнено
- [ ] не выполнено
> цитата

| Колонка 1 | Колонка 2 |
| --- | ---: |
| Значение | 10 |

\`код\` или блок между тремя обратными кавычками`}
              </div>
            </details>

            <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "white", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>Настройки доступа</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <MultiSelect options={positionOptions} selectedValues={selectedPositions} onChange={setSelectedPositions} placeholder="Выберите должности" label="Доступ для должностей" />
                <small style={{ color: "#666", fontSize: "12px" }}>Оставьте пустым для доступа всем</small>
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Доступ для пользователей (логины, через запятую)</label>
                  <input type="text" value={accessLogins} onChange={(e) => setAccessLogins(e.target.value)} placeholder="например: admin, ivanov" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" }} />
                  <small style={{ color: "#666", fontSize: "12px" }}>Оставьте пустым для доступа всем</small>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
              <Button label="Сохранить" fillColor style={{ border: "none", backgroundColor: "#4CAF50" }} onClick={handleSave} />
              <Button label="Отмена" fillColor style={{ border: "none" }} onClick={() => setIsEdit(false)} />
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "2.5rem", color: "var(--сolor-dark-grayish-blue)" }}>{title}</h1>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {canEditCards && <Button label="Редактировать" fillColor style={{ border: "none" }} onClick={() => setIsEdit(true)} />}
                {canDeleteCards && <Button label="Удалить" fillColor style={{ border: "none", backgroundColor: "#f44336" }} onClick={handleDelete} />}
              </div>
            </div>

            {(selectedPositions.length > 0 || accessLogins) && (
              <div style={{ padding: "12px", backgroundColor: "#fff3cd", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" }}>
                <strong>Ограниченный доступ:</strong>
                {selectedPositions.length > 0 && <div>Должности: {selectedPositions.join(", ")}</div>}
                {accessLogins && <div>Пользователи: {accessLogins}</div>}
              </div>
            )}

            <MarkdownRenderer content={content || ""} onTaskToggle={canEditCards ? handleTaskToggle : undefined} />
          </>
        )}
      </div>
    </div>
  );
}
