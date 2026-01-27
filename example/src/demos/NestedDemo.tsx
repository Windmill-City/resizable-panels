import {
  ResizableGroup,
  ResizablePanel,
  ResizableHandle,
} from '@local/resizable-panels'

export default function NestedDemo() {
  return (
    <ResizableGroup orientation="horizontal" className="h-full">
      {/* 左侧面板 */}
      <ResizablePanel
        id="left"
        defaultSize={200}
        minSize={100}
        collapsible
        className="sidebar"
      >
        <div className="panel">
          <div className="panel-header">导航</div>
          <div className="panel-content">
            <ul className="file-list">
              <li>🏠 首页</li>
              <li>📊 数据</li>
              <li>⚙️ 设置</li>
            </ul>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle className="resize-handle" />

      {/* 中间区域 - 嵌套垂直分割 */}
      <ResizablePanel id="center" minSize={300} className="main-content">
        <ResizableGroup orientation="vertical" className="h-full">
          {/* 顶部工具栏 */}
          <ResizablePanel
            id="toolbar"
            defaultSize={60}
            minSize={40}
            className="main-content"
          >
            <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ padding: '4px 12px' }}>新建</button>
              <button style={{ padding: '4px 12px' }}>保存</button>
              <button style={{ padding: '4px 12px' }}>导出</button>
            </div>
          </ResizablePanel>

          <ResizableHandle className="resize-handle" />

          {/* 主要内容 - 再次嵌套水平分割 */}
          <ResizablePanel id="main-content" minSize={200} className="main-content">
            <ResizableGroup orientation="horizontal" className="h-full">
              {/* 文档列表 */}
              <ResizablePanel
                id="doc-list"
                defaultSize={180}
                minSize={100}
                collapsible
                className="main-content"
              >
                <div className="panel">
                  <div className="panel-header">文档列表</div>
                  <div className="panel-content">
                    <ul className="file-list" style={{ color: '#333' }}>
                      <li>README.md</li>
                      <li>CHANGELOG.md</li>
                      <li>LICENSE</li>
                    </ul>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle className="resize-handle" />

              {/* 文档内容 */}
              <ResizablePanel id="doc-content" minSize={200} className="main-content">
                <div className="panel">
                  <div className="panel-header">文档预览</div>
                  <div className="panel-content">
                    <h2>嵌套布局示例</h2>
                    <p style={{ marginTop: 12 }}>
                      这个示例展示了多层嵌套的 ResizableGroup：
                    </p>
                    <ul style={{ marginLeft: 20, marginTop: 8 }}>
                      <li>最外层：水平分割（左-中-右）</li>
                      <li>中间层：垂直分割（上-中-下）</li>
                      <li>最内层：水平分割（列表-内容）</li>
                    </ul>
                    <p style={{ marginTop: 12 }}>
                      每个层级都可以独立拖动调整大小！
                    </p>
                  </div>
                </div>
              </ResizablePanel>
            </ResizableGroup>
          </ResizablePanel>

          <ResizableHandle className="resize-handle" />

          {/* 底部状态栏 */}
          <ResizablePanel
            id="status"
            defaultSize={40}
            minSize={30}
            collapsible
            collapsedSize={0}
            className="bottom-panel"
          >
            <div className="panel" style={{ padding: '8px 16px' }}>
              <span style={{ fontSize: 12 }}>就绪 | 行 12, 列 34 | UTF-8</span>
            </div>
          </ResizablePanel>
        </ResizableGroup>
      </ResizablePanel>

      <ResizableHandle className="resize-handle" />

      {/* 右侧面板 */}
      <ResizablePanel
        id="right"
        defaultSize={200}
        minSize={100}
        collapsible
        className="sidebar"
      >
        <div className="panel">
          <div className="panel-header">属性</div>
          <div className="panel-content">
            <p style={{ fontSize: 13, marginBottom: 8 }}>尺寸</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input type="text" placeholder="宽" style={{ width: 60, padding: 4 }} />
              <input type="text" placeholder="高" style={{ width: 60, padding: 4 }} />
            </div>
            <p style={{ fontSize: 13, marginBottom: 8 }}>位置</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="X" style={{ width: 60, padding: 4 }} />
              <input type="text" placeholder="Y" style={{ width: 60, padding: 4 }} />
            </div>
          </div>
        </div>
      </ResizablePanel>
    </ResizableGroup>
  )
}
