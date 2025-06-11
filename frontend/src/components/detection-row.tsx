
interface DetectionRowProps {
    prediction: any
}

export default function DetectionRow({ prediction }: DetectionRowProps) {
    return (
        <div className="bg-zinc-100 border border-zinc-300 p-4 rounded-lg">
            {JSON.stringify(prediction)}
        </div>
    )
}