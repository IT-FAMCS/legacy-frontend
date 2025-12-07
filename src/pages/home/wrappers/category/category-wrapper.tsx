import { useState } from "react";
import { useUserStore } from "../../../../stores/user";
import type { Category } from "../../../../types/Category";
import { EditCategory } from "./edit";
import { DeleteCategory } from "./delete";
import Button from "../../../../components/Button";

type CategoryWrapperProps = {
  category: Category;
};

const CategoryWrapper = ({ category }: CategoryWrapperProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);

  const isChairman = useUserStore((s) => s.user?.position === "Председатель");

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
    {isEdit && <EditCategory setIsEdit={setIsEdit} />}

    { /* isChairman && — когда появится бэк*/ <Button
      label="Удалить"
      fillColor
      style={{ border: "none", width: "200px" }}
      onClick={() => {
        setIsDelete(!isEdit);
      }}
    /> }
    {isDelete && <DeleteCategory setIsDelete={setIsDelete} categoryTitle={category.title} />}

    <div>{ category.themes.map((theme, index) => <>{/* дописать после добавления тем */}</>) }</div>
  </div>
  );
};

export default CategoryWrapper;
