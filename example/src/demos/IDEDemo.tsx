import {
  ResizableGroup,
  ResizablePanel,
  ResizableHandle,
} from '@local/resizable-panels'

export default function IDEDemo() {
  return (
    <ResizableGroup orientation="horizontal" className="h-full">
      {/* 文件树 */}
      <ResizablePanel
        id="explorer"
        defaultSize={200}
        minSize={80}
        collapsible
        maximizable
        className="sidebar"
      >
        <div className="panel">
          <div className="panel-header">Explorer</div>
          <div className="panel-content">
            <ul className="file-list">
              <li className="folder">📁 src</li>
              <li>📄 App.tsx</li>
              <li>📄 main.tsx</li>
              <li className="folder">📁 components</li>
              <li>📄 Button.tsx</li>
              <li>📄 Modal.tsx</li>
              <li>📄 styles.css</li>
            </ul>
          </div>
        </div>
      </ResizablePanel>

      {/* 带按钮的手柄 */}
      <ResizableHandle
        className="resize-handle-with-buttons"
        showCollapseButton
        collapseTarget="before"
        collapseButtonClassName="collapse-btn"
        showMaximizeButton
        maximizeTarget="before"
        maximizeButtonClassName="maximize-btn"
      />

      {/* 编辑器和终端 */}
      <ResizablePanel id="main-area" minSize={400} className="main-content">
        <ResizableGroup orientation="vertical" className="h-full">
          {/* 代码编辑器 */}
          <ResizablePanel
            id="editor"
            defaultSize={400}
            minSize={200}
            maximizable
            className="main-content"
          >
            <div className="panel">
              <div className="panel-header">Editor</div>
              <div className="panel-content">
                <pre style={{ 
                  background: '#f4f4f4', 
                  padding: 12, 
                  borderRadius: 4,
                  fontSize: 13,
                  overflow: 'auto'
                }}>
{`import { ResizableGroup } from '@local/resizable-panels';

function App() {
  return (
    <ResizableGroup orientation="horizontal">
      {/* IDE 布局示例 */}
    </ResizableGroup>
  );
}`}
                </pre>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle
            className="resize-handle-with-buttons"
            showMaximizeButton
            maximizeTarget="before"
            maximizeButtonClassName="maximize-btn"
          />

          {/* 终端 */}
          <ResizablePanel
            id="terminal"
            defaultSize={150}
            minSize={50}
            collapsible
            className="bottom-panel"
          >
            <div className="panel">
              <div className="panel-header">Terminal</div>
              <div className="panel-content">
                <code style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  $ npm run dev<br />
                  {'>'} example@0.0.0 dev<br />
                  {'>'} vite<br />
                  <br />
                  VITE v6.0.1  ready in 320 ms<br />
                  <br />
                  ➜  Local:   http://localhost:5173/<br />
                  ➜  Network: use --host to expose<br />
                </code>
              </div>
            </div>
          </ResizablePanel>
        </ResizableGroup>
      </ResizablePanel>
    </ResizableGroup>
  )
}
