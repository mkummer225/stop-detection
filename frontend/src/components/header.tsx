
export default function Header() {
    return (
        <div className="fixed top-0 left-0 right-0 bg-white p-4 flex justify-between items-center">
            <h1 className="text-indigo-500 font-semibold text-sm">unhappy-camper.co</h1>

            <div className="flex-1 text-right">
                <button className="bg-slate-800 text-white p-4 rounded-lg px-2.5 py-1">CTA1</button>
            </div>
        </div>
    )
}