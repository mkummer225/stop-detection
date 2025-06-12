import { UploadIcon } from "lucide-react";

interface HeaderProps {
    handleUploadButton: React.MouseEventHandler<HTMLButtonElement>
}

export default function Header({ handleUploadButton }: HeaderProps) {
    return (
        <div className="fixed z-50 top-0 left-0 right-0 bg-white p-4 flex justify-between items-center">
            <h1 className="text-red-500 text-shadow-red-200/30 text-lg text-shadow-md font-semibold"><span className="inline-block italic mr-px text-xs">un-</span>Happy Camper<span className="inline-block ml-px text-xs">(s)</span></h1>

            <div className="flex-1 text-right">
                <button onClick={handleUploadButton} className="inline-flex items-center text-xs uppercase bg-zinc-800 text-white hover:bg-zinc-700 transition-all hover:-translate-y-0.5 cursor-pointer p-4 rounded-lg px-5 py-2">
                    <UploadIcon height={14} width={14} className="inline-block mr-2" />Upload Footage
                </button>
            </div>
        </div>
    )
}