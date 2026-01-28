import {
  ResizableContext,
  ResizableGroup,
  ResizablePanel,
} from "@local/resizable-panels"
import ActivityBar from "./ui/activity-bar"
import MenuBar from "./ui/menu-bar"
import StatusBar from "./ui/status-bar"

function App() {
  return (
    <ResizableContext>
      {/* Menu */}
      <MenuBar>Menu</MenuBar>
      {/* Horizontal Layout */}
      <ResizableGroup>
        {/* Activity Bar */}
        <ActivityBar></ActivityBar>
        {/* Left Sidebar */}
        <ResizablePanel className="border-r" collapsible minSize={200}>
          left
        </ResizablePanel>
        {/* Center Content */}
        <ResizablePanel minSize={300}>
          {/* Vertical Layout */}
          <ResizableGroup orientation="vertical">
            {/* Main Editor Area */}
            <ResizablePanel collapsible minSize={80}>
              top
            </ResizablePanel>
            {/* Bottom Panel */}
            <ResizablePanel
              className="border-t data-[maximized=true]:border-none"
              collapsible
              minSize={80}
            >
              bottom
            </ResizablePanel>
          </ResizableGroup>
        </ResizablePanel>
        {/* Right Sidebar */}
        <ResizablePanel className="border-l" collapsible minSize={200}>
          right
        </ResizablePanel>
      </ResizableGroup>
      {/* Status Bar */}
      <StatusBar>Status</StatusBar>
    </ResizableContext>
  )
}

export default App
