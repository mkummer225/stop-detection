import { useCallback, useMemo, useRef, useState } from 'react'
import './App.css'
import Header from './components/header'
import VideoPreview from './components/video-preview'
import DetectionRow from './components/detection-row'

function App() {
  // Main file input reference:
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [predictionResults, setPredictionResults] = useState<any>([])

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
    setPredictionResults([])

    fetch("http://localhost:8000/api/get_violators", {
      method: "POST",
      body: fd
    }).then(async res => {
      const predictionsArr = await res.json()

      setIsProcessing(false)
      setPredictionResults(predictionsArr.result)
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
        {predictionResults && predictionResults.length > 0 && <div className="mt-20 pt-4 max-w-4xl mx-auto">
          <h2 className="border-b font-semibold pb-2 mb-4 text-xs uppercase text-zinc-500 border-zinc-300">Results</h2>
          
          <div className="flex flex-col gap-4">
            {predictionResults.filter(({ predictions }) => predictions?.length > 0).map((pred, i) => <DetectionRow prediction={pred} key={i} />)}
          </div>
        </div>}
      </div>
    </>
  )
}

export default App
