import Button from "../../../../components/Button";
import { ModalWrapper } from "../../../../components/modal";

export function EditCategory({ setIsEdit }: { setIsEdit: Function }) {
  return (
    <ModalWrapper setIsOpen={setIsEdit}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <div>Тут редактирование по полям категории</div>
        <div>
          <Button
            onClick={() => {
              setIsEdit(false);
            }}
            label="Отменить"
            fillColor
          />
          <Button
            onClick={() => {
              setIsEdit(false);
            }}
            label="Сохранить"
            fillColor
          />
        </div>
      </div>
    </ModalWrapper>
  );
};
