import { useState } from "react";

type DemoType = "basic" | "vscode"

function App() {
  const [currentDemo, setCurrentDemo] = useState<DemoType>("basic")

  const demos: { key: DemoType; label: string }[] = [
    { key: "basic", label: "Basic" },
    { key: "vscode", label: "VsCode" },
  ]

  return (
    <div className="flex flex-col">
      <header className="bg-slate-900 text-white px-5 py-3 flex items-center gap-5 shadow-md">
        <h1 className="text-base font-medium flex items-center gap-2">
          Resizable Panels
        </h1>
        <nav className="flex gap-2">
          {demos.map((demo) => (
            <button
              key={demo.key}
              className={`
                px-3 py-1.5 rounded text-sm transition-all duration-200
                ${
                  currentDemo === demo.key
                    ? "bg-rose-500 text-white shadow-sm"
                    : "bg-white/10 hover:bg-white/20 text-white/90"
                }
              `}
              onClick={() => setCurrentDemo(demo.key)}
            >
              {demo.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="flex-1 overflow-hidden"></main>
    </div>
  )
}

export default App
