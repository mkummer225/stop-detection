
interface DetectionRowProps {
    prediction: any
    // setCurrentFrame: Function // TODO
}

export default function DetectionRow({ prediction }: DetectionRowProps) {
    return (
        <div className="bg-zinc-100 border border-zinc-300 p-4 rounded-lg">
            {/* {JSON.stringify(prediction)} */}
            <div className="flex items-baseline text-sm mb-2">
                <span className={"font-semibold" + (prediction.stopped ? " text-zinc-500" : " text-red-500")}>{ prediction.stopped ? "✅ Car Stopped" : "🛑 No STOP" }</span>
            </div>
            <div className="flex items-baseline text-sm">
                <span className="inline-block mr-1 uppercase text-xs text-zinc-400 w-16">Begin:</span>{ prediction.start_frame }
            </div>
            <div className="flex items-baseline text-sm">
                <span className="inline-block mr-1 uppercase text-xs text-zinc-400 w-16">End:</span>{ prediction.end_frame }
            </div>

            {/* TODO: allow user to click to jump to a detection in the video... */}
            {/* <button className="text-zinc-400 underline text-xs hover:text-zinc-600 cursor-pointer" onClick={setCurrentFrame(prediction.start_frame)}>view</button> */}
        </div>
    )
}