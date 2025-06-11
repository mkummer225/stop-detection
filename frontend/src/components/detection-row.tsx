
interface DetectionRowProps {
    prediction: any
}

export default function DetectionRow({ prediction }: DetectionRowProps) {
    return (
        <div className="bg-zinc-100 border border-zinc-300 p-4 rounded-lg">
            <div className="flex items-baseline text-sm">
                <span className="inline-block mr-1 uppercase text-xs text-zinc-400 w-16">Frame:</span>{ prediction.frame }
            </div>
            <div className="flex items-baseline text-sm">
                <span className="inline-block mr-1 uppercase text-xs text-zinc-400 w-16">Objects:</span>
                <div>{ prediction.predictions.map(pred => <span className="block">{pred.class} @ x: {pred.x}, y: {pred.y}</span>) }</div>
            </div>
        </div>
    )
}