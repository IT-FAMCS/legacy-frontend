import { useEffect } from "react";

type ErrorBannerProps = {
  error: string | null;
  success: string | null;
  onClose: () => void;
};

export function ErrorBanner({ error, success, onClose }: ErrorBannerProps) {
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success, onClose]);

  if (!error && !success) return null;

  const isError = !!error;
  const message = error || success;
  const backgroundColor = isError ? "#f44336" : "#4CAF50";

  return (
    <div
      style={{
        position: "fixed",
        top: "var(--header-height)",
        left: 0,
        right: 0,
        backgroundColor,
        color: "white",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      <span style={{ fontSize: "14px" }}>{message}</span>
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
