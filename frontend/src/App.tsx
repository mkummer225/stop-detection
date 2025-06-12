import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

    fileInputRef.current?.click()
    return true
  }

  useEffect(() => {
    setPredictionResults([])
  }, [selectedFile])

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

  const [curRatio, setCurRatio] = useState<number[] | null>(null)

  useEffect(() =>{
    if(!predictionResults?.vehicles) {
      setCurRatio(null)
      return
    }

    const ratioArr = predictionResults.vehicles.reduce((cur, v) => {
      if (v.stopped) cur[0] += 1
      else cur[1] += 1

      return cur
    }, [0, 0])
    setCurRatio(ratioArr)
  }, [predictionResults])

  return (
    <>
      <Header handleUploadButton={handleUploadButton} />

      <div className="mt-16 p-4">
        {/* Description */}
        <div className="max-w-lg mx-auto text-center text-sm text-zinc-500 mb-8">
          <p>An app to help you quantify the number of stop sign violators in your neighborhood.</p>
        </div>

        {/* Video Preview */}
        <div className="relative">
          <VideoPreview src={videoObjectURL} isProcessing={isProcessing} detections={predictionResults} handleUploadButton={handleUploadButton} />
          <input ref={fileInputRef} type="file" accept="video/*" className="absolute invisible -z-10" onChange={() => {
            if(!fileInputRef.current?.files) return
            setSelectedFile(fileInputRef.current.files[0])
          }} />

          {/* Controls */}
          {videoObjectURL && <div className="mt-8 flex gap-4 justify-center items-center">
            <button className='text-sm bg-zinc-100 border border-zinc-200 transition-colors hover:bg-zinc-200 cursor-pointer select-none px-2.5 py-1 rounded-lg' onClick={processFootage}>Process</button>
            <button className='text-sm bg-zinc-100 border border-zinc-200 transition-colors hover:bg-zinc-200 cursor-pointer select-none px-2.5 py-1 rounded-lg' onClick={() => {
              if(!fileInputRef.current) return
              fileInputRef.current.value = ""
              setSelectedFile(null)
            }}>Reset</button>
          </div>}

          {/* Results */}
          {predictionResults && predictionResults.vehicles && <div className="mt-20 pt-4 max-w-4xl mx-auto">
            <h2 className="border-b font-semibold pb-2 mb-6 text-xs uppercase text-zinc-500 border-zinc-300">Results</h2>
        
            {curRatio !== null && <div className="mb-8">
              <div className="text-xl font-semibold text-center mb-4">
                { 100*curRatio[0]/(curRatio[0] + curRatio[1]) }% stop
              </div>
              <h2 className="font-semibold text-sm text-center mb-2">Stop Sign Obeyers to Violators</h2>
              { <div className="h-12 flex rounded-lg overflow-hidden max-w-lg mx-auto select-none"><div className="inline-flex items-center justify-center text-white bg-blue-500" style={{width: `${100*curRatio[0]/(curRatio[0] + curRatio[1])}%`}}>{ curRatio[0] }</div><div className="inline-flex items-center justify-center text-white bg-red-500" style={{width: `${100*curRatio[1]/(curRatio[0] + curRatio[1])}%`}}>{ curRatio[1] }</div></div> }
            </div>}

            <div className="flex flex-col gap-4">
              {predictionResults.vehicles.map((pred, i) => <DetectionRow prediction={pred} key={i} />)}
            </div>
          </div>}
        </div>
      </div>
    </>
  )
}

export default App
