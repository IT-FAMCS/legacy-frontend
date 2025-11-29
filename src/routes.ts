import { createBrowserRouter } from "react-router";
import HomePage from "./pages/home/home-page";
import { AboutUser } from "./pages/user/about";
import AboutPage from "./pages/about/about-page.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/about",
    Component: AboutPage,
  },
  {
    path: "/account",
    Component: AboutUser,
  },
]);

export default router;
