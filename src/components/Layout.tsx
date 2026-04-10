import { Outlet } from "react-router";
import Header from "./Header";
import { ErrorBanner } from "./ErrorBanner";
import { useErrorStore } from "../stores/error";

export const Layout = () => {
  const { error, setError } = useErrorStore();

  return (
    <>
      <Header />
      {error && <ErrorBanner error={error} onClose={() => setError(null)} />}
      <main style={{ marginTop: "var(--header-height)" }}>
        <Outlet />
      </main>
    </>
  );
};
