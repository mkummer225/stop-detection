import { useParams } from "react-router"

export default function TestPage() {
    const { id } = useParams()

    return (<div className="p-4 text-white">Test Page {id}</div>)
}