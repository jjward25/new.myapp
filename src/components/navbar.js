import Link from "next/link"

export default function Navbar() {
    return (
            <nav className="flex justify-between items-center md:px-8 md:py-3">
                <div className="cursor-pointer relative rounded-bl-md rounded-br-md md:rounded-lg w-full overflow-hidden md:my-1 h-full">
                    <div className="absolute -inset-3  bg-gradient-to-tr from-cyan-300 via-neutral-300 to-cyan-300 dark:bg-black blur opacity-90"></div>
                    <div className="relative rounded-bl-lg rounded-br-lg md:rounded-lg flex justify-around border-2 border-cyan-200">
                        <Link className="font-semibold text-cyan-700 dark:text-cyan-900 hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 text-lg" href={"/"}>Home</Link>
                        <Link className="font-semibold text-cyan-700 dark:text-cyan-900 hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 text-lg" href={"/backlog"}>Backlog</Link>
                        <Link className="font-semibold text-cyan-700 dark:text-cyan-900 hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 text-lg" href={"/projects"}>Projects</Link>
                    </div>
                </div>
            </nav>
    )
}