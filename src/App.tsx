import { RouterProvider } from 'react-router'
import router from './routes'
import './App.css'

function App() {
  return (
    <div className="App">
      <Header/>
      <RouterProvider router={router} />
    </div>
  )
}

export default App
