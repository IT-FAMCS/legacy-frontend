import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "../../../../components/Button";
import { ModalWrapper } from "../../../../components/modal";
import { deleteCategory } from "../../../../api/category";

export function DeleteCategory({
  setIsDelete,
  categoryTitle,
  categoryId,
}: {
  setIsDelete: (value: boolean) => void;
  categoryTitle: string;
  categoryId: number;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteCategory({ categoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsDelete(false);
    },
    onError: (err) => {
      console.error("Ошибка удаления категории:", err);
      alert("Ошибка при удалении категории");
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <ModalWrapper setIsOpen={setIsDelete}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <div style={{ color: "white" }}>
          Вы действительно хотите удалить категорию <br/> <strong>{categoryTitle}</strong>?
        </div>
        <div>
          <Button
            onClick={() => {
              setIsDelete(false);
            }}
            label="Отменить"
            fillColor
          />
          <Button
            onClick={handleDelete}
            label="Удалить"
            fillColor
            style={{ backgroundColor: "#f44336" }}
          />
        </div>
      </div>
    </ModalWrapper>
  );
}
