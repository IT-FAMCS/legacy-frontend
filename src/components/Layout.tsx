import { Outlet } from "react-router";
import Header from "./Header";

export const Layout = () => (
  <>
    <Header />
    <main style={{ marginTop: "var(--header-height)" }}>
      <Outlet />
    </main>
  </>
);
