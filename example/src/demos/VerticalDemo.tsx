import {
  ResizableGroup,
  ResizablePanel,
  ResizableHandle,
} from '@local/resizable-panels'

export default function VerticalDemo() {
  return (
    <ResizableGroup orientation="vertical" className="h-full">
      {/* 顶部区域 */}
      <ResizablePanel
        id="header"
        defaultSize={80}
        minSize={50}
        className="main-content"
      >
        <div className="panel">
          <div className="panel-header">顶部工具栏</div>
          <div className="panel-content">
            <p>这是一个垂直布局示例</p>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle className="resize-handle" />

      {/* 中间内容 */}
      <ResizablePanel id="content" minSize={200} className="main-content">
        <div className="panel">
          <div className="panel-header">主要内容</div>
          <div className="panel-content">
            <p>上下拖动分隔条可以调整高度</p>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle className="resize-handle" />

      {/* 底部面板 */}
      <ResizablePanel
        id="footer"
        defaultSize={120}
        minSize={50}
        collapsible
        className="bottom-panel"
      >
        <div className="panel">
          <div className="panel-header">底部状态栏</div>
          <div className="panel-content">
            <p>状态信息...</p>
          </div>
        </div>
      </ResizablePanel>
    </ResizableGroup>
  )
}
