const MenuBar = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div data-menu-bar className="h-8 flex box-content relative items-center justify-center">
      {children}
    </div>
  )
}

export default MenuBar
