import { Link } from "react-router";

interface HeaderProps {
}

export default function Header({ }: HeaderProps) {
    return (<div className="flex justify-between items-center p-4 border-b border-zinc-600">
        <div className="flex-1"><h1 className="text-white font-semibold select-none"><Link to="/">Header</Link></h1></div>
        
        <button className="text-white bg-slate-600 border-slate-500 border hover:bg-slate-500 px-2.5 py-1 rounded-lg transition-all transform hover:-translate-y-px cursor-pointer">
            Get Started
        </button>
    </div>)
}