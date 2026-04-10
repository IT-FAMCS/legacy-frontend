import { useState } from 'react';
import Button from '../../components/Button';
import TitleWrapper from './wrappers/title-wrapper';
import CategoryWrapper from './wrappers/category/category-wrapper';
import { AddCategory } from './wrappers/category/add';
import type { Category } from '../../types/Category';

const HomePage = () => {
  // const categories = useLoadCategories(); — когда появится бэк
  const categories: Category[] = [{
    id: 1,
    title: "Отделы",
    description: "Информация по отделам организации",
    cards: [
      { id: 1, title: "Фандрайз", content: "# Фандрайз\n\nКонтент карточки..." },
      { id: 2, title: "SMM", content: "# SMM\n\nКонтент карточки..." },
      { id: 3, title: "Тик-Ток", content: "# Тик-Ток\n\nКонтент карточки..." },
      { id: 4, title: "IT", content: "# IT отдел\n\nКонтент карточки..." },
    ]
  }, {
    id: 2,
    title: "Мероприятия",
    description: "Информация о мероприятиях",
    cards: [
      { id: 5, title: "Тропа", content: "# Тропа\n\nКонтент карточки..." },
      { id: 6, title: "Капустник", content: "# Капустник\n\nКонтент карточки..." },
    ]
  }]

  const [isAdd, setIsAdd] = useState(false);

  return (
    <>
      <TitleWrapper />

      { categories?.map((category, index) => <CategoryWrapper key={index} category={category} />) }

      { /* isChairman && — когда появится бэк*/ <div style={{
        background: "var(--color-alabaster-grey)",
        textAlign: "center",
        paddingBlock: "2rem",
      }}>
        <Button
          label="Создать категорию"
          fillColor
          style={{ border: "none", width: "200px" }}
          onClick={() => {
            setIsAdd(!isAdd);
          }}
        />
        {isAdd && <AddCategory setIsAdd={setIsAdd} />}
      </div> }
    </>
  );
};

export default HomePage;
