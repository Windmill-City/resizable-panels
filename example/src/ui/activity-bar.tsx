const ActivityBar = ({ children }: { children?: React.ReactNode }) => {
  return <div className="w-12 flex-none flex box-content border-r overflow-hidden">{children}</div>
}

export default ActivityBar
