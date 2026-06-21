"use client";

interface NavbarProps {
  pageName: string;
}

export default function Navbar({ pageName }: NavbarProps) {
  return (
    <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8">
      <h2 className="text-white font-semibold text-lg">{pageName}</h2>
      <div className="flex items-center gap-4">
        <button className="text-gray-400 hover:text-cyan-400 transition text-xl">
          🔔
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-sm">
            V
          </div>
          <div>
            <p className="text-white text-sm font-medium">Vedant</p>
            <p className="text-gray-500 text-xs">Student</p>
          </div>
        </div>
      </div>
    </div>
  );
}