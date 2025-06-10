import { Link } from "react-router";

export default function NotFound() {
    return (<div className="mt-[25vh] text-center">
        <h1 className="text-xl font-semibold text-white mb-8">404 - Page Not Found</h1>
        <p>
            <Link to="/" className="text-zinc-400 font-semibold transition-colors hover:text-zinc-200">Go home</Link>
        </p>
    </div>)
}