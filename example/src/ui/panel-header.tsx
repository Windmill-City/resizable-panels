import { Maximize2, Minimize2, X } from "lucide-react"
import { cn } from "../lib/utils"

interface PanelHeaderProps {
  title: string
  isCollapsed?: boolean
  isMaximized?: boolean
  canMaximize?: boolean
  onClose?: () => void
  onMaximize?: () => void
  onRestore?: () => void
  className?: string
}

const PanelHeader = ({
  title,
  isCollapsed = false,
  isMaximized = false,
  canMaximize = false,
  onClose,
  onMaximize,
  onRestore,
  className,
}: PanelHeaderProps) => {
  return (
    <div className={cn("h-8 flex items-center justify-between px-3 select-none", "bg-accent/50 ", className)}>
      <span className="text-sm font-medium text-foreground">{title}</span>

      <div className="flex items-center gap-0.5">
        {/* Maximize/Restore button */}
        {canMaximize && !isCollapsed && (
          <button
            onClick={isMaximized ? onRestore : onMaximize}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
          title={isCollapsed ? "Expand" : "Close"}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default PanelHeader
