import { useRef } from 'react'
import './App.css'
import Header from './components/header'
import VideoPreview from './components/video-preview'

function App() {
  // Main file input reference:
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadButton = () => {
    // TODO: show filepicker and handle call to backend inference endpoint for video file
    // fileInputRef.current...
    return true
  }

  return (
    <>
      <Header handleUploadButton={handleUploadButton} />

      <div className="relative mt-16 p-4">
        <VideoPreview src={null} />
        <input ref={fileInputRef} type="file" name="" id="" className="absolute invisible -z-10" />

        {/* Controls Area */}
        <div className="mt-8 flex gap-4 justify-center items-center">
          <button className='text-sm bg-zinc-100 border border-zinc-200 transition-colors hover:bg-zinc-200 cursor-pointer select-none px-2.5 py-1 rounded-lg'>Process</button>
          <button className='text-sm bg-zinc-100 border border-zinc-200 transition-colors hover:bg-zinc-200 cursor-pointer select-none px-2.5 py-1 rounded-lg'>Reset</button>
        </div>

        {/* Process Results... */}
      </div>
    </>
  )
}

export default App
