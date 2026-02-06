import { Tab } from "./types"

/**
 * EditorContent - A component that displays the content of a code editor tab
 *
 * Renders a scrollable code view with:
 * - Line numbers on the left side
 * - Syntax-highlighted code content
 * - Proper whitespace handling for code formatting
 *
 * @param tab - The tab object containing file metadata and content lines
 */

export interface EditorContentProps {
  tab: Tab
}

export const EditorContent = ({ tab }: EditorContentProps) => {
  return (
    <div className="flex-1 overflow-auto font-mono">
      <div className="p-4">
        {tab.content.map((line, index) => (
          <div key={index} className="flex items-baseline leading-6">
            <span className="w-12 text-right pr-4 select-none text-gray-500">{index + 1}</span>
            <span className="text-muted-foreground whitespace-pre">{line || " "}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
