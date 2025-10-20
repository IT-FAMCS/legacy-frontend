import { createBrowserRouter } from "react-router";
import HomePage from "./pages/home/home-page";

const router = createBrowserRouter([
  {
    path: '/',
    Component: HomePage,
  },
]);

export default router
