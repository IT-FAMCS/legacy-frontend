import "./App.css";
import { RouterProvider } from "react-router";
import router from "./routes";
import { useLoadUser } from "./hooks/use-user";

function App() {
  useLoadUser();
  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
