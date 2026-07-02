import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Button from "../../components/Button";
import TitleWrapper from "./wrappers/title-wrapper";
import CategoryWrapper from "./wrappers/category/category-wrapper";
import { AddCategory } from "./wrappers/category/add";
import { getCategories } from "../../api/category";
import { useCanEditCategories } from "../../hooks/use-permissions";
import racoonLoading from "../../assets/images/racoon-loading.gif";

const HomePage = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => getCategories({ signal }),
  });

  // Check permissions using position flags from backend via hooks
  const canEditCategories = useCanEditCategories();

  const [isAdd, setIsAdd] = useState(false);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "var(--header-height)",
        }}
      >
        <img alt="racoon" src={racoonLoading} width={256} height={256} />
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <>
      <TitleWrapper />

      {categories?.map((category) => (
        <CategoryWrapper key={category.id} category={category} />
      ))}

      {canEditCategories && (
        <div
          style={{
            background: "var(--color-alabaster-grey)",
            textAlign: "center",
            paddingBlock: "2rem",
          }}
        >
          <Button
            label="Создать категорию"
            fillColor
            style={{ border: "none", width: "200px" }}
            onClick={() => {
              setIsAdd(!isAdd);
            }}
          />
          {isAdd && <AddCategory setIsAdd={setIsAdd} />}
        </div>
      )}
    </>
  );
};

export default HomePage;
