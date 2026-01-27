import { useState } from 'react'
import BasicDemo from './demos/BasicDemo'
import IDEDemo from './demos/IDEDemo'
import NestedDemo from './demos/NestedDemo'
import VerticalDemo from './demos/VerticalDemo'

type DemoType = 'basic' | 'ide' | 'nested' | 'vertical'

function App() {
  const [currentDemo, setCurrentDemo] = useState<DemoType>('basic')

  const demos: { key: DemoType; label: string }[] = [
    { key: 'basic', label: '基础用法' },
    { key: 'vertical', label: '垂直布局' },
    { key: 'ide', label: 'IDE 布局' },
    { key: 'nested', label: '嵌套布局' },
  ]

  return (
    <div className="demo-container">
      <header className="demo-header">
        <h1>🎛️ Resizable Panels</h1>
        <nav className="demo-nav">
          {demos.map((demo) => (
            <button
              key={demo.key}
              className={currentDemo === demo.key ? 'active' : ''}
              onClick={() => setCurrentDemo(demo.key)}
            >
              {demo.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="demo-content">
        {currentDemo === 'basic' && <BasicDemo />}
        {currentDemo === 'ide' && <IDEDemo />}
        {currentDemo === 'nested' && <NestedDemo />}
        {currentDemo === 'vertical' && <VerticalDemo />}
      </main>
    </div>
  )
}

export default App
