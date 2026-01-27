import { ResizableGroup, ResizablePanel } from "@local/resizable-panels"
import ActivityBar from "./ui/activity-bar"
import MenuBar from "./ui/menu-bar"
import StatusBar from "./ui/status-bar"

function App() {
  return (
    <ResizableContext>
      <ResizableGroup>
        {/* Menu */}
        <MenuBar>Menu</MenuBar>
        {/* Horizontal Layout */}
        <ResizableGroup>
          {/* Activity Bar */}
          <ActivityBar></ActivityBar>
          {/* 左侧边栏 */}
          <ResizablePanel className="border-r" collapsible minSize={200}>
            left
          </ResizablePanel>
          {/* 中间内容 */}
          <ResizablePanel minSize={300}>
            {/* 垂直布局 */}
            <ResizableGroup orientation="vertical">
              {/* 主内容区 */}
              <ResizablePanel collapsible minSize={80}>
                top
              </ResizablePanel>
              {/* 底栏 */}
              <ResizablePanel
                className="border-t h-full:border-none"
                collapsible
                minSize={80}
              >
                bottom
              </ResizablePanel>
            </ResizableGroup>
          </ResizablePanel>
          {/* 右侧边栏 */}
          <ResizablePanel className="border-l" collapsible minSize={200}>
            right
          </ResizablePanel>
        </ResizableGroup>
        {/* 状态栏 */}
        <StatusBar>Status</StatusBar>
      </ResizableGroup>
    </ResizableContext>
  )
}

export default App
