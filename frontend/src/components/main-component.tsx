import { Link } from "react-router";

interface MainCompProps {
}

export default function MainComponent({ }: MainCompProps) {
    return (<div className="relative text-white p-4 flex-1">
        <h1 className="text-center">Vite + React + TS + Tailwind – Hello World</h1>
        
        <p className="text-center text-xs mt-4">
            <Link to="/test/" className="text-zinc-400 underline hover:text-zinc-200 transition-colors">test</Link>
        </p>
    </div>)
}