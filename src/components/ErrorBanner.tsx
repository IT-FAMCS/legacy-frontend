import { useEffect } from "react";

type ErrorBannerProps = {
  error: string | null;
  onClose: () => void;
};

export function ErrorBanner({ error, onClose }: ErrorBannerProps) {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onClose]);

  if (!error) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "var(--header-height)",
        left: 0,
        right: 0,
        backgroundColor: "#f44336",
        color: "white",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      <span style={{ fontSize: "14px" }}>{error}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "white",
          fontSize: "20px",
          cursor: "pointer",
          padding: "0 8px",
        }}
      >
        ×
      </button>
    </div>
  );
}
