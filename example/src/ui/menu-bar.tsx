const MenuBar = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div
      data-menu-bar
      className="h-8 flex box-content relative"
    >
      {children}
    </div>
  )
}

export default MenuBar
