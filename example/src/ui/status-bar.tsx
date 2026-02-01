const StatusBar = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div data-status-bar className="h-6 flex box-content items-center justify-center">
      {children}
    </div>
  )
}

export default StatusBar
