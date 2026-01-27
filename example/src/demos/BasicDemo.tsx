import {
  ResizableGroup,
  ResizablePanel,
  ResizableHandle,
} from '@local/resizable-panels'

export default function BasicDemo() {
  return (
    <ResizableGroup orientation="horizontal" className="h-full">
      {/* 左侧边栏 */}
      <ResizablePanel
        id="sidebar"
        defaultSize={250}
        minSize={150}
        collapsible
        className="sidebar"
      >
        <div className="panel">
          <div className="panel-header">侧边栏</div>
          <div className="panel-content">
            <ul className="file-list">
              <li className="folder">src</li>
              <li>index.ts</li>
              <li>types.ts</li>
              <li>utils.ts</li>
              <li className="folder">components</li>
              <li>Button.tsx</li>
              <li>Input.tsx</li>
            </ul>
          </div>
        </div>
      </ResizablePanel>

      {/* 拖动条 */}
      <ResizableHandle className="resize-handle" />

      {/* 主内容 */}
      <ResizablePanel id="main" minSize={300} className="main-content">
        <div className="panel">
          <div className="panel-header">主内容区</div>
          <div className="panel-content">
            <p>这是基础用法示例。</p>
            <p>你可以：</p>
            <ul style={{ marginLeft: 20, marginTop: 10 }}>
              <li>拖动中间的分隔条调整宽度</li>
              <li>面板有最小尺寸限制（150px / 300px）</li>
              <li>侧边栏支持折叠（collapsible）</li>
            </ul>
          </div>
        </div>
      </ResizablePanel>
    </ResizableGroup>
  )
}
