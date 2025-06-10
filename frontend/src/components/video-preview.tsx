
interface VideoPreviewProps {
    src: string | null
}

export default function VideoPreview({ src }: VideoPreviewProps) {
    return (
        <div className="max-w-lg mx-auto bg-zinc-200 animate-pulse rounded-lg overflow-hidden">
            {src && <video src={src} className="w-full h-auto aspect-[16/9]"></video>}
            {!src && <div className="w-full h-auto aspect-[16/9] flex items-center justify-center text-xs font-semibold">No Video</div>}
        </div>
    )
}