const ActivityBar = ({ children }: { children?: React.ReactNode }) => {
  return <div className="w-12 flex-none flex border-r overflow-hidden">{children}</div>
}

export default ActivityBar
