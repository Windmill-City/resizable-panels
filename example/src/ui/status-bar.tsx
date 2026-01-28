const StatusBar = ({ children }: { children?: React.ReactNode }) => {
  return <div className="h-6 flex border-t overflow-hidden">{children}</div>
}

export default StatusBar
