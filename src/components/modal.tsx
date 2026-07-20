import { createPortal } from "react-dom";

export function ModalWrapper({
  setIsOpen,
  children,
}: {
  setIsOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
}) {
  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
        zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      onClick={() => {
        setIsOpen(false);
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "85vh",
          overflowY: "auto",
          borderRadius: "10px",
          color: "white",
          backgroundColor: "rgb(0, 0, 0, 0.7)",
          padding: "40px 20px",
          boxSizing: "border-box",
        }}
        onClick={
          (e) => e.stopPropagation()
        }
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
