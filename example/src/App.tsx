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
    <ResizableContext id="app-main" className="flex flex-col">
      {/* Menu */}
      <MenuBar>Menu</MenuBar>
      {/* Horizontal Layout */}
      <ResizableGroup id="g-h">
        {/* Activity Bar */}
        <ActivityBar></ActivityBar>
        {/* Left Sidebar */}
        <ResizablePanel
          id="ps-l"
          className="border-r"
          collapsible
          minSize={200}
        >
          left
        </ResizablePanel>
        {/* Center Content */}
        <ResizablePanel id="p-main" minSize={300}>
          {/* Vertical Layout */}
          <ResizableGroup id="g-v" orientation="vertical">
            {/* Main Editor Area */}
            <ResizablePanel id="p-editor" collapsible minSize={80}>
              top
            </ResizablePanel>
            {/* Bottom Panel */}
            <ResizablePanel
              id="pb"
              className="border-t h-full:border-none"
              collapsible
              minSize={80}
            >
              bottom
            </ResizablePanel>
          </ResizableGroup>
        </ResizablePanel>
        {/* Right Sidebar */}
        <ResizablePanel
          id="ps-r"
          className="border-l"
          collapsible
          minSize={200}
        >
          right
        </ResizablePanel>
      </ResizableGroup>
      {/* Status Bar */}
      <StatusBar>Status</StatusBar>
    </ResizableContext>
  )
}

export default App
