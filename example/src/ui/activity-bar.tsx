const ActivityBar = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div data-activity-bar className="w-12 flex-none flex box-content [writing-mode:vertical-rl] overflow-hidden">
      {children}
    </div>
  )
}

export default ActivityBar
