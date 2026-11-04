import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getTraineeCards, getTraineeCategories } from "../../api/trainee";
import { TraineeRaccoon } from "../../components/TraineeRaccoon";

export function TraineeHomePage() {
  const categories = useQuery({ queryKey: ["trainee", "categories"], queryFn: getTraineeCategories,
    staleTime: 0, refetchOnWindowFocus: true, retry: false });
  const cards = useQuery({ queryKey: ["trainee", "cards"], queryFn: getTraineeCards,
    staleTime: 0, refetchOnWindowFocus: true, retry: false });
  return <>
    <div className="trainee-welcome">
      <div><p className="trainee-eyebrow">Первые шаги вместе</p><h1>База знаний для стажёров</h1>
        <p className="trainee-muted">Знакомься с организацией в своём темпе. Здесь собраны доступные тебе материалы.</p></div>
      <TraineeRaccoon large />
    </div>
    {categories.isPending || cards.isPending ? <p role="status">Загружаем материалы…</p>
      : categories.isError || cards.isError ? <div className="trainee-panel" role="alert">
        <p>{categories.error?.message || cards.error?.message}</p>
        <button className="trainee-primary" onClick={() => { categories.refetch(); cards.refetch(); }}>Попробовать снова</button>
      </div> : categories.data.length === 0 ? <div className="trainee-panel">
        <h2>Материалы скоро появятся</h2><p className="trainee-muted">Пока ни одна карточка не открыта для стажёров.</p>
      </div> : categories.data.map(category => <section key={category.id} className="trainee-category">
        <h2>{category.name}</h2>
        {category.description && <p className="trainee-muted">{category.description}</p>}
        <div className="trainee-card-grid">{cards.data.filter(card => card.category_id === category.id).map(card =>
          <Link key={card.id} to={`/trainee/card/${card.id}`} className="trainee-card-link">
            <h3>{card.title}</h3><span>Читать материал <span aria-hidden="true">→</span></span>
          </Link>)}
        </div>
      </section>)}
  </>;
}
