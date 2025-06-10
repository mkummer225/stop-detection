import './App.css'
import Header from './components/header'
import VideoPreview from './components/video-preview'

function App() {
  return (
    <>
      <Header />
      <div className="mt-16 p-4">
        <VideoPreview src={null} />
      </div>
    </>
  )
}

export default App
