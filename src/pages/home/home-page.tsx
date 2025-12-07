import { useState } from 'react';
import { useLoadCategories } from '../../hooks/use-category';
import Button from '../../components/Button';
import TitleWrapper from './wrappers/title-wrapper';
import CategoryWrapper from './wrappers/category/category-wrapper';
import { AddCategory } from './wrappers/category/add';
import type { Category } from '../../types/Category';

const HomePage = () => {
  // const categories = useLoadCategories(); — когда появится бэк
  const categories: Category[] = [{
    id: 1,
    title: "Название категории",
    description: "Описание категории",
    themes: []
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
