
interface VideoPreviewProps {
    src: string | null
    isProcessing: boolean
}

export default function VideoPreview({ src, isProcessing }: VideoPreviewProps) {
    return (
        <div className={"max-w-lg mx-auto bg-zinc-200 rounded-lg overflow-hidden" + (src ? '' : ' animate-pulse')}>
            {src && <video src={src} className="w-full h-auto aspect-[16/9]" controls></video>}
            {!src && <div className="w-full h-auto aspect-[16/9] flex items-center justify-center text-xs font-semibold">
                {isProcessing ? 'Processing with RoboFlow...' : 'No Video'}
            </div>}
        </div>
    )
}