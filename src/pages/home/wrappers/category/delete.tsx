import Button from "../../../../components/Button";
import { ModalWrapper } from "../../../../components/modal";

export function DeleteCategory({ setIsDelete, categoryTitle }: { setIsDelete: Function, categoryTitle: string }) {
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
        <div>Вы действительно хотите удалить категорию <br/> {categoryTitle}?</div>
        <div>
          <Button
            onClick={() => {
              setIsDelete(false);
            }}
            label="Отменить"
            fillColor
          />
          <Button
            onClick={() => {
              setIsDelete(false);
            }}
            label="Удалить"
            fillColor
          />
        </div>
      </div>
    </ModalWrapper>
  );
};
