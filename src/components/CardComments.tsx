import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MarkdownRenderer } from "./MarkdownRenderer";
import Button from "./Button";
import {
  getCardComments,
  createCardComment,
  updateCardComment,
  deleteCardComment,
  type CardComment,
} from "../api/comments";
import { useUserStore } from "../stores/user";
import { useErrorStore } from "../stores/error";
import { isAdminChairOrDeputy } from "../hooks/use-permissions";
import { formatDateTime } from "../utils/date";

type CardCommentsProps = {
  cardId: number;
  canComment: boolean;
  content: string;
  onTaskToggle?: (taskIndex: number, checked: boolean) => void;
};

type ClientRectLike = { top: number; left: number; width: number; height: number };
type Anchor = { top: number; rects: ClientRectLike[] };

// Stable reference for the "no comments yet" case — a fresh `[]` literal as
// a useQuery default is recreated every render, which would otherwise change
// identity on every pass and re-trigger the anchor-computing effect forever.
const EMPTY_COMMENTS: CardComment[] = [];

// Minimum vertical gap (px) kept between stacked comment cards in the rail.
const CARD_STACK_GAP = 12;

// Locates the exact substring `quote` inside `container`'s rendered text and
// returns a Range spanning it — walks text nodes rather than relying on any
// stored offset, since the only thing persisted server-side is the quoted
// string itself. First occurrence only: if the same phrase appears twice in
// a card, a comment may re-anchor to the wrong one. Acceptable simplification
// for a first version (documented in AGENT.md/memory.md).
function findQuoteRange(container: HTMLElement, quote: string): Range | null {
  if (!quote) return null;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let fullText = "";
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    textNodes.push(textNode);
    fullText += textNode.data;
  }

  const matchIndex = fullText.indexOf(quote);
  if (matchIndex === -1) return null;
  const matchEnd = matchIndex + quote.length;

  let offset = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  for (const textNode of textNodes) {
    const nodeStart = offset;
    const nodeEnd = offset + textNode.data.length;

    if (startNode === null && matchIndex >= nodeStart && matchIndex < nodeEnd) {
      startNode = textNode;
      startOffset = matchIndex - nodeStart;
    }
    if (endNode === null && matchEnd > nodeStart && matchEnd <= nodeEnd) {
      endNode = textNode;
      endOffset = matchEnd - nodeStart;
    }

    offset = nodeEnd;
    if (startNode && endNode) break;
  }

  if (!startNode || !endNode) return null;

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

function CommentCardBody({
  comment,
  canDelete,
  onResolve,
  onDelete,
}: {
  comment: CardComment;
  canDelete: boolean;
  onResolve: (resolved: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div className="card-comment-card">
      <blockquote>{comment.quoted_text}</blockquote>
      <div>{comment.body}</div>
      <div className="card-comment-meta">
        {comment.author_name || comment.author_login || "—"} · {formatDateTime(comment.created_at)}
      </div>
      {comment.resolved ? (
        <div className="card-comment-resolved-badge">✓ Решено{comment.resolved_by_name ? ` — ${comment.resolved_by_name}` : ""}</div>
      ) : null}
      <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
        <Button
          label={comment.resolved ? "Вернуть" : "Отметить решённым"}
          fillColor
          style={{ border: "none", padding: "4px 10px", fontSize: "12px" }}
          onClick={() => onResolve(!comment.resolved)}
        />
        {canDelete && (
          <Button
            label="Удалить"
            fillColor
            style={{ border: "none", padding: "4px 10px", fontSize: "12px", backgroundColor: "#f44336" }}
            onClick={onDelete}
          />
        )}
      </div>
    </div>
  );
}

export function CardComments({ cardId, canComment, content, onTaskToggle }: CardCommentsProps) {
  if (!canComment) {
    return <MarkdownRenderer content={content} onTaskToggle={onTaskToggle} />;
  }

  return (
    <CardCommentsInner cardId={cardId} content={content} onTaskToggle={onTaskToggle} />
  );
}

function CardCommentsInner({
  cardId,
  content,
  onTaskToggle,
}: {
  cardId: number;
  content: string;
  onTaskToggle?: (taskIndex: number, checked: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const setError = useErrorStore((s) => s.setError);
  const currentUser = useUserStore((s) => s.user);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [selectionInfo, setSelectionInfo] = useState<{ top: number; left: number } | null>(null);
  const pendingSelectionRef = useRef<{ text: string; top: number } | null>(null);
  const [composing, setComposing] = useState<{ text: string; top: number } | null>(null);
  const [composeValue, setComposeValue] = useState("");
  const [anchors, setAnchors] = useState<Record<number, Anchor | null>>({});
  const [contentHeight, setContentHeight] = useState(0);
  const [stackedTops, setStackedTops] = useState<Record<number, number>>({});
  const [stackBottom, setStackBottom] = useState(0);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isDesktopRef = useRef(
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );

  const { data: comments = EMPTY_COMMENTS } = useQuery({
    queryKey: ["card-comments", cardId],
    queryFn: ({ signal }) => getCardComments({ signal, cardId }),
  });

  const createMutation = useMutation({
    mutationFn: (vars: { quotedText: string; body: string }) =>
      createCardComment({ cardId, quotedText: vars.quotedText, body: vars.body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-comments", cardId] });
      setComposing(null);
      setComposeValue("");
      window.getSelection()?.removeAllRanges();
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Ошибка при добавлении комментария"),
  });

  const resolveMutation = useMutation({
    mutationFn: (vars: { commentId: number; resolved: boolean }) =>
      updateCardComment({ commentId: vars.commentId, resolved: vars.resolved }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["card-comments", cardId] }),
    onError: (err) => setError(err instanceof Error ? err.message : "Ошибка при изменении комментария"),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => deleteCardComment({ commentId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["card-comments", cardId] }),
    onError: (err) => setError(err instanceof Error ? err.message : "Ошибка при удалении комментария"),
  });

  const computeAnchors = useCallback(() => {
    const container = contentRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const next: Record<number, Anchor | null> = {};

    for (const comment of comments) {
      const range = findQuoteRange(container, comment.quoted_text);
      const clientRects = range ? Array.from(range.getClientRects()) : [];

      if (!range || clientRects.length === 0) {
        next[comment.id] = null;
        continue;
      }

      next[comment.id] = {
        top: clientRects[0].top - containerRect.top,
        rects: clientRects.map((r) => ({
          top: r.top - containerRect.top,
          left: r.left - containerRect.left,
          width: r.width,
          height: r.height,
        })),
      };
    }

    setAnchors(next);
    setContentHeight(containerRect.height);
  }, [comments]);

  useLayoutEffect(() => {
    computeAnchors();
  }, [computeAnchors]);

  useEffect(() => {
    window.addEventListener("resize", computeAnchors);
    return () => window.removeEventListener("resize", computeAnchors);
  }, [computeAnchors]);

  // Second pass: comments anchored close together in the text would land at
  // nearly the same `top` in the rail and cover one another. Once the cards
  // are in the DOM (from the anchors computed above), measure each one's
  // real rendered height and push any that would overlap the previous card
  // further down — order preserved (top-to-bottom by natural anchor
  // position), only pushed later, never earlier or out of order. Depends on
  // `[anchors, comments]` only (both stable references once settled, see
  // EMPTY_COMMENTS above) — an unstable dependency here would re-trigger
  // this effect every render and loop forever, the same bug fixed there.
  useLayoutEffect(() => {
    const order = comments
      .filter((c) => anchors[c.id])
      .sort((a, b) => anchors[a.id]!.top - anchors[b.id]!.top)
      .map((c) => c.id);

    let cursor = 0;
    const next: Record<number, number> = {};
    for (const id of order) {
      const naturalTop = anchors[id]!.top;
      const height = cardRefs.current[id]?.getBoundingClientRect().height ?? 0;
      const top = Math.max(naturalTop, cursor);
      next[id] = top;
      cursor = top + height + CARD_STACK_GAP;
    }

    setStackedTops(next);
    setStackBottom(cursor);
  }, [anchors, comments]);

  const handleMouseUp = useCallback(() => {
    if (!isDesktopRef.current) return;
    const container = contentRef.current;
    if (!container) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setSelectionInfo(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text || !container.contains(range.commonAncestorContainer)) {
      setSelectionInfo(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    pendingSelectionRef.current = { text, top: rect.top - containerRect.top };
    setSelectionInfo({ top: rect.top, left: rect.right });
  }, []);

  useEffect(() => {
    if (!isDesktopRef.current) return;
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionInfo(null);
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const handleStartCompose = () => {
    const pending = pendingSelectionRef.current;
    if (!pending) return;
    setComposing({ text: pending.text, top: pending.top });
    setSelectionInfo(null);
    setComposeValue("");
  };

  const handleSubmitComment = () => {
    if (!composing || !composeValue.trim()) return;
    createMutation.mutate({ quotedText: composing.text, body: composeValue.trim() });
  };

  const canDeleteComment = (comment: CardComment) =>
    comment.author_id === currentUser?.id || isAdminChairOrDeputy(currentUser?.position_name);

  const anchoredComments = comments
    .filter((c) => anchors[c.id])
    .sort((a, b) => (anchors[a.id]?.top ?? 0) - (anchors[b.id]?.top ?? 0));
  const unanchoredComments = comments.filter((c) => !anchors[c.id]);

  return (
    <div className="card-comments-layout">
      <div className="card-comments-content" ref={contentRef} onMouseUp={handleMouseUp}>
        <MarkdownRenderer content={content} onTaskToggle={onTaskToggle} />
        {comments.flatMap((comment) => {
          const anchor = anchors[comment.id];
          if (!anchor) return [];
          return anchor.rects.map((r, i) => (
            <span
              key={`${comment.id}-${i}`}
              className="card-comment-highlight"
              style={{ top: r.top, left: r.left, width: r.width, height: r.height }}
            />
          ));
        })}
      </div>

      <div className="card-comments-rail" style={{ minHeight: Math.max(contentHeight, stackBottom) }}>
        {anchoredComments.map((comment) => (
          <div
            key={comment.id}
            ref={(el) => {
              cardRefs.current[comment.id] = el;
            }}
            style={{ position: "absolute", top: stackedTops[comment.id] ?? anchors[comment.id]!.top, left: 0, right: 0 }}
          >
            <CommentCardBody
              comment={comment}
              canDelete={canDeleteComment(comment)}
              onResolve={(resolved) => resolveMutation.mutate({ commentId: comment.id, resolved })}
              onDelete={() => {
                if (confirm("Удалить комментарий?")) deleteMutation.mutate(comment.id);
              }}
            />
          </div>
        ))}

        {composing && (
          <div style={{ position: "absolute", top: composing.top, left: 0, right: 0 }} className="card-comment-card">
            <blockquote style={{ margin: "0 0 8px", padding: "0.15rem 0.7rem", borderLeft: "3px solid #686acf", background: "rgba(104, 106, 207, 0.08)", fontSize: "12.5px" }}>
              {composing.text}
            </blockquote>
            <textarea
              autoFocus
              value={composeValue}
              onChange={(e) => setComposeValue(e.target.value)}
              placeholder="Ваш комментарий..."
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "13px", resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <Button
                label="Сохранить"
                fillColor
                style={{ border: "none", padding: "4px 10px", fontSize: "12px", backgroundColor: "#4CAF50" }}
                onClick={handleSubmitComment}
                disabled={!composeValue.trim()}
              />
              <Button
                label="Отмена"
                fillColor
                style={{ border: "none", padding: "4px 10px", fontSize: "12px" }}
                onClick={() => {
                  setComposing(null);
                  setComposeValue("");
                }}
              />
            </div>
          </div>
        )}

        {unanchoredComments.length > 0 && (
          <div style={{ position: "relative", marginTop: Math.max(contentHeight, stackBottom) + 12, display: "flex", flexDirection: "column", gap: "12px" }}>
            {unanchoredComments.map((comment) => (
              <CommentCardBody
                key={comment.id}
                comment={comment}
                canDelete={canDeleteComment(comment)}
                onResolve={(resolved) => resolveMutation.mutate({ commentId: comment.id, resolved })}
                onDelete={() => {
                  if (confirm("Удалить комментарий?")) deleteMutation.mutate(comment.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {selectionInfo && (
        <button
          style={{
            position: "fixed",
            top: Math.max(8, selectionInfo.top - 40),
            left: selectionInfo.left,
            zIndex: 500,
            padding: "6px 12px",
            borderRadius: "6px",
            border: "none",
            background: "#686ACF",
            color: "white",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
          onClick={handleStartCompose}
        >
          💬 Комментировать
        </button>
      )}
    </div>
  );
}
