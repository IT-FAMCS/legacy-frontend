import Button from "../../../../components/Button";
import { ModalWrapper } from "../../../../components/modal";

export function AddCategory({ setIsAdd }: { setIsAdd: Function }) {
  return (
    <ModalWrapper setIsOpen={setIsAdd}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <div>Тут форма создания категории</div>
        <div>
          <Button
            onClick={() => {
              setIsAdd(false);
            }}
            label="Отменить"
            fillColor
          />
          <Button
            onClick={() => {
              setIsAdd(false);
            }}
            label="Сохранить"
            fillColor
          />
        </div>
      </div>
    </ModalWrapper>
  );
};
