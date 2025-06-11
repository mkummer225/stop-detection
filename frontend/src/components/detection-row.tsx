
interface DetectionRowProps {
    n: number
}

export default function DetectionRow({ n }: DetectionRowProps) {
    return (
        <div className="bg-zinc-100 border border-zinc-300 p-4 rounded-lg">
            Detection {n}
        </div>
    )
}