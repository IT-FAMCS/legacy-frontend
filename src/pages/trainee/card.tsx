import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { getTraineeCard } from "../../api/trainee";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";

export function TraineeCardPage() {
  const { cardId } = useParams();
  const id = Number(cardId);
  const card = useQuery({
    queryKey: ["trainee", "card", id], queryFn: ({ signal }) => getTraineeCard(id, { signal }),
    enabled: Number.isSafeInteger(id) && id > 0, retry: false, staleTime: 0,
    refetchOnWindowFocus: true,
  });
  return <>
    <Link to="/trainee" className="trainee-back-link">← К базе знаний</Link>
    {!Number.isSafeInteger(id) || id <= 0 ? <p role="alert">Карточка не найдена.</p>
      : card.isPending ? <p role="status">Загружаем карточку…</p>
      : card.isError ? <div role="alert" className="trainee-panel"><h1>Не удалось открыть карточку</h1>
        <p>{card.error.message}</p></div>
      : <article className="trainee-panel trainee-article">
        <p className="trainee-eyebrow">{card.data.category_name}</p>
        <h1>{card.data.title}</h1>
        <MarkdownRenderer content={card.data.content || ""} allowUserLists={false} />
      </article>}
  </>;
}
