import { createBrowserRouter } from "react-router";
import HomePage from "./pages/home/home-page";
import { AboutUser } from "./pages/user/about";

const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/account",
    Component: AboutUser,
  },
]);

export default router;
