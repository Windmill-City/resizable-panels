import { Columns, Plus, Rows, X } from "lucide-react"
import { useState } from "react"
import { SplitDirection, Tab } from "./types"

/**
 * TabBar - Displays a horizontal tab bar with split controls and add tab button
 *
 * Renders a scrollable list of file tabs with:
 * - Active/inactive tab styling with visual indicators
 * - Close button on hover/active state
 * - Add new tab button
 * - Horizontal and vertical split controls
 *
 * Supports right-click context menu (placeholder for future menu implementation)
 */

export interface TabBarProps {
  tabs: Tab[]
  activeTabId: string
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onSplit: (direction: SplitDirection) => void
  onAddTab: () => void
}

export const TabBar = ({ tabs, activeTabId, onTabClick, onTabClose, onSplit, onAddTab }: TabBarProps) => {
  // State placeholder for future context menu implementation
  const [_, setShowSplitMenu] = useState(false)

  return (
    <div className="h-9 flex items-center bg-muted/30 overflow-x-auto scrollbar-hide relative">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          onContextMenu={(e) => {
            e.preventDefault()
            setShowSplitMenu(true)
          }}
          className={`
            group h-full flex items-center gap-2 px-3 min-w-30 max-w-50 
            border-r border-border cursor-pointer select-none text-sm
            transition-colors duration-150
            ${
              activeTabId === tab.id
                ? "bg-background text-foreground border-t-2 border-t-primary"
                : "bg-tab text-muted-foreground hover:bg-tab-hover border-t border-t-transparent"
            }
          `}
          title={tab.name}
        >
          <span className={`${tab.iconColor} text-xs font-medium`}>{tab.language}</span>
          <span className="flex-1 truncate">{tab.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTabClose(tab.id)
            }}
            className={`
              p-0.5 rounded hover:bg-accent/80 opacity-0 group-hover:opacity-100
              ${activeTabId === tab.id ? "opacity-100" : ""}
              transition-opacity
            `}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Add new tab button */}
      <button
        onClick={onAddTab}
        className="h-full px-2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        title="New File"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Split buttons */}
      <div className="ml-auto flex items-center gap-1 px-2 border-l border-border">
        <button
          onClick={() => onSplit("horizontal")}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Split Right"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onSplit("vertical")}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Split Down"
        >
          <Rows className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
