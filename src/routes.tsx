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
import { TraineeRoute } from "./components/TraineeRoute";
import { TraineeLoginPage } from "./pages/trainee/login";
import { TraineeHomePage } from "./pages/trainee/home";
import { TraineeCardPage } from "./pages/trainee/card";
import { TraineeAccessPage } from "./pages/trainee/manage";

import { EquipmentPage } from "./pages/equipment/page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    element: <Layout />,
    children: [
      { path: "/equipment", element: <ProtectedRoute><EquipmentPage /></ProtectedRoute> },
      {
        path: "/trainee-access",
        element: <ProtectedRoute><TraineeAccessPage /></ProtectedRoute>,
      },
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
    path: "/trainee/login",
    element: <TraineeLoginPage />,
  },
  {
    path: "/trainee",
    element: <TraineeRoute />,
    children: [
      { index: true, element: <TraineeHomePage /> },
      { path: "card/:cardId", element: <TraineeCardPage /> },
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
