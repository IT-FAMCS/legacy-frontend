import { createPortal } from "react-dom";

export function ModalWrapper({
  setIsOpen,
  children,
}: {
  setIsOpen: Function;
  children: React.ReactNode;
}) {
  return createPortal(
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100vw",
        height: "100vh",
        zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      onClick={() => {
        setIsOpen(false);
      }}
    >
      <div
        style={{
          position: "absolute",
          overflowY: "auto",
          width: "600px",
          height: "350px",
          top: "calc(50% - 175px)",
          left: "calc(50% - 300px)",
          borderRadius: "10px",
          color: "white",
          backgroundColor: "rgb(0, 0, 0, 0.7)",
          padding: "40px 20px",
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
