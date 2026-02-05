import { Tab } from "./types"

export interface EditorContentProps {
  tab: Tab
}

export const EditorContent = ({ tab }: EditorContentProps) => {
  return (
    <div className="flex-1 overflow-auto font-mono text-sm bg-background">
      <div className="p-4">
        {tab.content.map((line, index) => (
          <div key={index} className="flex leading-6">
            <span className="w-12 text-right pr-4 select-none text-gray-500 text-xs">{index + 1}</span>
            <span className="text-muted-foreground whitespace-pre">{line || " "}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
