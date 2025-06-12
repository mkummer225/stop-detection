
interface DetectionRowProps {
    prediction: any
    // setCurrentFrame: Function // TODO
}

export default function DetectionRow({ prediction }: DetectionRowProps) {
    const FPS = 30

    function secondsToHms(seconds: number) {
        const date = new Date(seconds * 1000); // Convert seconds to milliseconds
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const secs = date.getUTCSeconds();
      
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return (
        <div className="bg-zinc-100 border border-zinc-300 p-4 rounded-lg">
            {/* {JSON.stringify(prediction)} */}
            <div className="flex items-baseline text-sm mb-2">
                <span className={"font-semibold" + (prediction.stopped ? " text-zinc-500" : " text-red-500")}>{ prediction.stopped ? "✅ Car Stopped" : "🛑 No STOP" }</span>
            </div>
            <div className="flex items-baseline text-sm">
                <span className="inline-block mr-1 uppercase text-xs text-zinc-400 w-16">Begin:</span>{ secondsToHms(prediction.start_frame/FPS) }
            </div>
            <div className="flex items-baseline text-sm">
                <span className="inline-block mr-1 uppercase text-xs text-zinc-400 w-16">End:</span>{ secondsToHms(prediction.end_frame/FPS) }
            </div>

            {/* TODO: allow user to click to jump to a detection in the video... */}
            {/* <button className="text-zinc-400 underline text-xs hover:text-zinc-600 cursor-pointer" onClick={setCurrentFrame(prediction.start_frame)}>view</button> */}
        </div>
    )
}