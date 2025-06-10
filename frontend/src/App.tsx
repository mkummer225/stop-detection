import './App.css'
import Header from './components/header'
import VideoPreview from './components/video-preview'

function App() {
  return (
    <>
      <Header />
      <div className="mt-16 p-4">
        <VideoPreview src={null} />

        {/* Controls Area */}
        <div className="mt-8 flex gap-4 justify-center items-center">
          <button className='text-sm bg-zinc-100 border border-zinc-200 transition-colors hover:bg-zinc-200 cursor-pointer select-none px-2.5 py-1 rounded-lg'>Process</button>
          <button className='text-sm bg-zinc-100 border border-zinc-200 transition-colors hover:bg-zinc-200 cursor-pointer select-none px-2.5 py-1 rounded-lg'>Reset</button>
        </div>
      </div>
    </>
  )
}

export default App
