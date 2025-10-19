import './App.css'
import { useLoadUser } from './hooks/use-user'
import { useUserStore } from './stores/user';
import { QueryClient } from "@tanstack/react-query";




function App() {
  useLoadUser();
  const user = useUserStore((s) => s.user);
  console.log(user)

  return (
      <></>
  )
}

export default App
