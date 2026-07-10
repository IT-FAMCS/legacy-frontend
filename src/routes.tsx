import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing/landing-page";
import HomePage from "./pages/home/home-page";
import { AboutUser } from "./pages/user/about";
import { LoginPage } from "./pages/user/login";
import { RegisterPage } from "./pages/user/register";
import { RegisterBulkPage } from "./pages/user/register-bulk";
import { AccountList } from "./pages/account-list/list";
import { PositionsList } from "./pages/positions/list";
import { DepartmentsList } from "./pages/departments/list";
import { CardPage } from "./pages/card/page";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    element: <Layout />,
    children: [
      {
        path: "/home",
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/account",
        element: (
          <ProtectedRoute>
            <AboutUser />
          </ProtectedRoute>
        ),
      },
      {
        path: "/user/:login",
        element: (
          <ProtectedRoute>
            <AboutUser />
          </ProtectedRoute>
        ),
      },
      {
        path: "/accounts",
        element: (
          <ProtectedRoute>
            <AccountList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/departments",
        element: (
          <ProtectedRoute>
            <DepartmentsList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/positions",
        element: (
          <ProtectedRoute>
            <PositionsList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/card/:categoryId/:cardId",
        element: (
          <ProtectedRoute>
            <CardPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/register/bulk",
    element: <RegisterBulkPage />,
  }
]);

export default router;
