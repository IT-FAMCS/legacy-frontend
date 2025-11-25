import "./App.css";
import { RouterProvider } from "react-router";
import router from "./routes";
import { useLoadUser } from "./hooks/use-user";
import { AboutUser } from "./pages/user/about";
import { useUserStore } from "./stores/user";
import "./App.css";
import Header from "./components/Header.tsx";

function App() {
  useLoadUser();
  const user = useUserStore((s) => s.user);
  return (
    <div className="App">
      <Header />
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
