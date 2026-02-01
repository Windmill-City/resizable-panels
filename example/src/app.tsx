import {
  maximizePanel,
  ResizableContext,
  ResizableGroup,
  ResizablePanel,
  restorePanels,
  useGroupContext,
} from "@local/resizable-panels"
import ActivityBar from "./ui/activity-bar"
import MenuBar from "./ui/menu-bar"
import ResizeHandle from "./ui/resize-handle"
import StatusBar from "./ui/status-bar"

/**
 * Hook for panel control logic
 * @param panelIndex - Index of the target panel to control
 * @returns Click and double-click handlers
 */
function usePanelControl(panelIndex: number) {
  const group = useGroupContext()

  const handleClick = () => {
    console.debug("[App] handleClick")

    const panels = Array.from(group.panels.values())
    const targetPanel = panels[panelIndex]

    // Click to restore when maximized
    if (group.prevMaximize) {
      restorePanels(panels, group)
      return
    }

    // Click to expand when collapsed
    if (targetPanel.isCollapsed) {
      const isBefore = panelIndex < panels.length / 2
      const delta = isBefore ? targetPanel.prevSize : -targetPanel.prevSize
      group.dragPanel(delta, isBefore ? panelIndex : panelIndex - 1)
      return
    }

    // Click to collapse when expanded and not maximized
    const isBefore = panelIndex < panels.length / 2
    const delta = isBefore ? -targetPanel.size : targetPanel.size
    group.dragPanel(delta, isBefore ? panelIndex : panelIndex - 1)
  }

  const handleDoubleClick = () => {
    console.debug("[App] handleDoubleClick")

    const panels = Array.from(group.panels.values())
    const targetPanel = panels[panelIndex]

    // Double-click to restore when maximized
    if (group.prevMaximize) {
      restorePanels(panels, group)
      return
    }

    // Double-click to expand when collapsed
    if (targetPanel.isCollapsed) {
      const isBefore = panelIndex < panels.length / 2
      const delta = isBefore ? targetPanel.prevSize : -targetPanel.prevSize
      group.dragPanel(delta, isBefore ? panelIndex : panelIndex - 1)
      return
    }

    // Double-click to maximize when expanded
    if (targetPanel.okMaximize) maximizePanel(targetPanel, panels, group)
  }

  return { handleClick, handleDoubleClick }
}

const LeftResizeHandle = () => {
  const { handleClick, handleDoubleClick } = usePanelControl(0)
  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
}

const RightResizeHandle = () => {
  const { handleClick, handleDoubleClick } = usePanelControl(2)
  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
}

const BottomResizeHandle = () => {
  const { handleClick, handleDoubleClick } = usePanelControl(1)
  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
}

function App() {
  return (
    <div className="flex-1 flex flex-col min-w-fit">
      {/* Menu */}
      <MenuBar>Menu</MenuBar>
      {/* min-h-40[160px] here to force bottom panel shrink */}
      <div className="flex-1 flex min-h-40">
        {/* Activity Bar */}
        <ActivityBar>Activity Bar</ActivityBar>
        <ResizableContext>
          <ResizableGroup>
            {/* Left Sidebar */}
            <ResizablePanel id="left" collapsible collapsed>
              left
            </ResizablePanel>
            <LeftResizeHandle />
            <ResizablePanel expand>
              <ResizableGroup direction="row">
                {/* Editor */}
                <ResizablePanel id="editor" minSize={80} collapsible expand>
                  editor
                </ResizablePanel>
                <BottomResizeHandle />
                {/* Bottom Panel */}
                <ResizablePanel
                  id="bottom"
                  className="border-t data-maximized:border-none data-collapsed:border-none"
                  minSize={80}
                  collapsible
                  okMaximize
                  collapsed
                >
                  bottom
                </ResizablePanel>
              </ResizableGroup>
            </ResizablePanel>
            <RightResizeHandle />
            {/* Right Sidebar */}
            <ResizablePanel id="right" collapsible okMaximize collapsed>
              right
            </ResizablePanel>
          </ResizableGroup>
        </ResizableContext>
      </div>
      {/* Status Bar */}
      <StatusBar>Status</StatusBar>
    </div>
  )
}

export default App
