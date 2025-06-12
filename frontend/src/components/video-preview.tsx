import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface VideoPreviewProps {
    src: string | null
    isProcessing: boolean
    detections: any
    handleUploadButton: React.MouseEventHandler
}

interface StoppageBlock {
    didStop: boolean
    startFrame: number
    endFrame: number
}

// TODO: read this from the video
const FPS: number = 30

export default function VideoPreview({ src, isProcessing, detections, handleUploadButton }: VideoPreviewProps) {
    // Refs
    const videoElmRef = useRef<HTMLVideoElement>(null)
    const stoppageBlocksRef = useRef<HTMLDivElement>(null)

    // Video metadata
    const [videoDuration, setVideoDuration] = useState<number | null>(null)
    const [videoWidth, setVideoWidth] = useState<number>(0)
    const [videoHeight, setVideoHeight] = useState<number>(0)

    // Current playhead time
    const [curTime, setCurTime] = useState(0)

    // Current bounding boxes to display
    const [boundingBoxes, setBoundingBoxes] = useState({})

    const stoppageWidthRatio = useMemo(() => {
        if(!stoppageBlocksRef.current?.clientWidth || !videoDuration) return 0
        return stoppageBlocksRef.current?.clientWidth/videoDuration
    }, [stoppageBlocksRef.current?.clientWidth, videoDuration])

    const stoppageBlocks = useMemo(() => {
        const detectedFrames: StoppageBlock[] = []

        for(let i = 0; i < detections?.vehicles?.length; i++) {
            detectedFrames.push({
                didStop: detections?.vehicles[i].stopped,
                startFrame: detections?.vehicles[i].end_frame,
                endFrame: detections?.vehicles[i].start_frame
            })
        }

        return detectedFrames
    }, [detections, stoppageBlocksRef.current?.clientWidth, videoDuration])
    
    const handleMetadataLoaded = () => {
        if (videoElmRef.current) {
          const durationInSeconds = videoElmRef.current.duration;
          const calculatedTotalFrames = Math.floor(durationInSeconds * FPS);
          setVideoDuration(calculatedTotalFrames);
          setVideoWidth(videoElmRef.current.videoWidth)
          setVideoHeight(videoElmRef.current.videoHeight)
        }
    }

    const setCurrentFrame = useCallback((frame_num: number) => {
        if(!videoElmRef.current) return
        videoElmRef.current.currentTime = frame_num / FPS
        videoElmRef.current.play()
    }, [videoElmRef.current])
    
    const setPlayHead: React.MouseEventHandler = (e) => {
        if(!stoppageBlocksRef.current) return
        const rect = stoppageBlocksRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left

        setCurrentFrame((clickX / stoppageWidthRatio))
    }

    useEffect(() => {
        // Filter the predictions to show the nearest BB's given any frame number (curTime * FPS)
        // TODO: 10 is hardcoded here as we are making predictions every 10 frames on our backend
        setBoundingBoxes(detections?.predictions?.filter(p => p.frame == Math.ceil(curTime*FPS / 10) * 10).pop())
    }, [detections, curTime])

    return (<>
        <div className={"relative max-w-lg mx-auto bg-zinc-200 rounded-lg overflow-hidden" + (src ? '' : ' animate-pulse')}>
            {/* Display the video + the bounding boxes of cars + wheels */}
            {src && <>
                <video ref={videoElmRef} onLoadedMetadata={handleMetadataLoaded} onTimeUpdate={() => setCurTime(videoElmRef.current?.currentTime)} src={src} className="w-full h-auto aspect-[16/9]" controls></video>
                {isProcessing && <div className="absolute inset-0 bg-black/70 text-sm flex items-center justify-center text-white">
                    <span className="animate-pulse">Processing...</span>
                </div> }

                {boundingBoxes && boundingBoxes.predictions?.map((box) => <div className={"absolute rounded-md p-1 border-2 z-50" + (box.class == "car" ? " border-zinc-400" : " border-blue-500")} style={{
                    left: (box.x - box.width/2)*(videoElmRef.current.clientWidth/videoWidth),
                    top: (box.y - box.height/2)*(videoElmRef.current.clientHeight/videoHeight),
                    width: box.width*(videoElmRef.current.clientWidth/videoWidth),
                    height: box.height*(videoElmRef.current.clientHeight/videoHeight),
                }}></div>)}
            </>
            }

            {/* Status text */}
            {!src && <div className=" select-none cursor-pointer w-full h-auto aspect-[16/9] flex items-center justify-center text-xs font-semibold" onClick={handleUploadButton}>
                {isProcessing ? <h2>'Processing with RoboFlow...'</h2> : <div className="text-center">
                    <h2 className="mb-2">No Video</h2>
                    <button className="bg-zinc-100 rounded-lg cursor-pointer select-none px-2.5 py-1" onClick={handleUploadButton}>Upload</button>
                </div>}
            </div>}
        </div>

        {/* Visualize the results on a timeline */}
        {src && <div ref={stoppageBlocksRef} className="relative w-full max-w-md bg-zinc-200 rounded-lg h-14 mx-auto mt-8 overflow-hidden"
            onMouseUp={setPlayHead}>
            {/* Add blocks to the scrubber showing where drivers stopped (blue) and did not stop (red) */}
            {stoppageBlocks?.map((detection: StoppageBlock)=>
                <div className={"absolute top-0 bottom-0 select-none cursor-pointer opacity-40 hover:opacity-80 transition-all rounded-lg" + (detection.didStop ? " border-blue-500 bg-blue-500" : " border-red-500 bg-red-500")}
                     style={{ left: `${stoppageWidthRatio * detection.startFrame}px`, width: `${Math.max(2, stoppageWidthRatio * (detection.endFrame - detection.startFrame))}px` }}
                     onClick={() => setCurrentFrame(detection.startFrame)}
                >

                </div>
            )}
            <div className="absolute top-0 bottom-0 border-r-black border-r-2" style={{ left: `${stoppageWidthRatio * (curTime*FPS)}px` }}></div>
        </div>}
    </>)
}