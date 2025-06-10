import './App.css'
import Header from './components/header'
import { Outlet } from 'react-router'

// Main layout
function App() {
  return (
    <>
      <div className="relative bg-zinc-800 w-full h-screen">
        <Header />
        <Outlet />
      </div>
    </>
  )
}

export default App
