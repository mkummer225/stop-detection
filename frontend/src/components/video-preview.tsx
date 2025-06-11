
interface VideoPreviewProps {
    src: string | null
    isProcessing: boolean
}

export default function VideoPreview({ src, isProcessing }: VideoPreviewProps) {
    return (
        <div className={"relative max-w-lg mx-auto bg-zinc-200 rounded-lg overflow-hidden" + (src ? '' : ' animate-pulse')}>
            {src && <>
                <video src={src} className="w-full h-auto aspect-[16/9]" controls></video>
                {isProcessing && <div className="absolute inset-0 bg-black/70 text-sm flex items-center justify-center text-white">
                    <span className="animate-pulse">Processing...</span>
                </div> }
            </>
            }
            {!src && <div className="w-full h-auto aspect-[16/9] flex items-center justify-center text-xs font-semibold">
                {isProcessing ? 'Processing with RoboFlow...' : 'No Video'}
            </div>}
        </div>
    )
}