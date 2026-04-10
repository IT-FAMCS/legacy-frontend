import { createBrowserRouter } from "react-router";
import HomePage from "./pages/home/home-page";
import { AboutUser } from "./pages/user/about";
import { LoginPage } from "./pages/user/login";
import { RegisterPage } from "./pages/user/register";
import { AccountList } from "./pages/account-list/list";
import { CardPage } from "./pages/card/page";
import { Layout } from "./components/Layout";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/account",
        element: <AboutUser />,
      },
      {
        path: "/accounts",
        element: <AccountList />,
      },
      {
        path: "/card/:categoryId/:cardId",
        element: <CardPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
]);

export default router;
