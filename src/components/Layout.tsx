import { Outlet } from "react-router";
import Header from "./Header";
import { ErrorBanner } from "./ErrorBanner";
import { useErrorStore } from "../stores/error";

export const Layout = () => {
  const { error, success, setError, setSuccess } = useErrorStore();

  return (
    <>
      <Header />
      {(error || success) && (
        <ErrorBanner error={error} success={success} onClose={() => { setError(null); setSuccess(null); }} />
      )}
      <main style={{ marginTop: "var(--header-height)" }}>
        <Outlet />
      </main>
    </>
  );
};
