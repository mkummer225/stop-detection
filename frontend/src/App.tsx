import { useCallback, useMemo, useRef, useState } from 'react'
import './App.css'
import Header from './components/header'
import VideoPreview from './components/video-preview'

function App() {
  // Main file input reference:
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleUploadButton = () => {
    if(!fileInputRef.current) 
      return

    setSelectedFile(null)
    fileInputRef.current?.click()
    return true
  }

  const processFootage = useCallback(() => {
    if(!fileInputRef.current?.files)
      return

    const fd = new FormData()
    const curVideoFile = fileInputRef.current?.files[0]

    fd.set("video", curVideoFile, curVideoFile.name)
    // @ts-ignore
    fd.set("fps", 30)

    setIsProcessing(true)

    fetch("http://localhost:8000/api/get_violators", {
      method: "POST",
      body: fd
    }).then(async res => {
      console.log(await res.json())
      setIsProcessing(false)
    }).catch(e => {
      console.log(e)
      setIsProcessing(false)
    })
  }, [selectedFile])

  // Compute and memoize the current video's object URL
  const videoObjectURL = useMemo(() => {
    return selectedFile ? URL.createObjectURL(selectedFile) : null
  }, [selectedFile])

  return (
    <>
      <Header handleUploadButton={handleUploadButton} />

      <div className="relative mt-16 p-4">
        <VideoPreview src={videoObjectURL} isProcessing={isProcessing} />
        <input ref={fileInputRef} type="file" accept="video/*" className="absolute invisible -z-10" onChange={() => {
          if(!fileInputRef.current?.files) return
          setSelectedFile(fileInputRef.current.files[0])
        }} />

        {/* Controls Area */}
        <div className="mt-8 flex gap-4 justify-center items-center">
          <button className='text-sm bg-zinc-100 border border-zinc-200 transition-colors hover:bg-zinc-200 cursor-pointer select-none px-2.5 py-1 rounded-lg' onClick={processFootage}>Process</button>
          <button className='text-sm bg-zinc-100 border border-zinc-200 transition-colors hover:bg-zinc-200 cursor-pointer select-none px-2.5 py-1 rounded-lg' onClick={() => {
            if(!fileInputRef.current) return
            fileInputRef.current.value = ""
            setSelectedFile(null)
          }}>Reset</button>
        </div>

        {/* Process Results... */}
      </div>
    </>
  )
}

export default App
