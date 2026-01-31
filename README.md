[EN](#) | [中文](README_zh.md)

# Resizable Panels

A headless React component library designed for building IDE-like layouts (similar to VSCode).

## Features

- 🎨 **Headless Design** - Complete control over styling, no CSS enforced
- 📐 **Flexible Layouts** - Support both horizontal (`col`) and vertical (`row`) resizing
- 🗂️ **Nested Groups** - Support for complex nested layouts
- 📏 **Smart Constraints** - min/max size constraints with intelligent space distribution
- 🔄 **Collapsible Panels** - Panels can be collapsed and expanded
- 🔍 **Maximize Panels** - Support for maximizing panels
- 🌱 **Expand Mode** - Panels can grow/shrink when container size changes
- ⚡ **Performance** - Efficient resize handling with minimal re-renders
- 🔷 **TypeScript** - Full type safety support

## Installation

```bash
pnpm add @local/resizable-panels
```

## Development

This project uses pnpm workspaces. To run the example:

```bash
# Install dependencies
pnpm install

# Start development server (run in project root, NOT in example directory)
pnpm dev
```

> **Note**: Do not run `pnpm dev` in the `example` directory. Due to workspace configuration, it must be started from the project root.

## Quick Start

```tsx
import { ResizableContext, ResizableGroup, ResizablePanel } from '@local/resizable-panels';

function App() {
  return (
    <ResizableContext style={{ height: '100vh' }}>
      <ResizableGroup direction="col">
        <ResizablePanel defaultSize={300} minSize={200}>
          <div style={{ background: '#f0f0f0', height: '100%' }}>
            Left Panel
          </div>
        </ResizablePanel>
        <ResizablePanel defaultSize={500} minSize={300}>
          <div style={{ background: '#e0e0e0', height: '100%' }}>
            Right Panel
          </div>
        </ResizablePanel>
      </ResizableGroup>
    </ResizableContext>
  );
}
```

## Components

### ResizableContext

The root container that manages all resizable groups and handles global mouse events.

```tsx
interface ResizableContextProps {
  id?: string;                    // Unique identifier
  children?: ReactNode;           // Child elements
  className?: string;             // CSS class name
  onLayoutChanged?: (context: ContextValue) => void;  // Layout change callback
}
```

### ResizableGroup

A container for grouping panels in the same direction.

```tsx
interface ResizableGroupProps {
  id?: string;                    // Unique identifier
  children?: ReactNode;           // Child elements (ResizablePanels)
  className?: string;             // CSS class name
  direction?: 'row' | 'col';      // Resize direction (default: 'col')
                                  // 'col' = horizontal resize handles
                                  // 'row' = vertical resize handles
}
```

### ResizablePanel

An individual resizable panel.

```tsx
interface ResizablePanelProps {
  id?: string;                    // Unique identifier
  children?: ReactNode;           // Panel content
  className?: string;             // CSS class name
  expand?: boolean;               // Grow/shrink when group size changes (default: false)
  minSize?: number;               // Minimum size in pixels (default: 200)
  maxSize?: number;               // Maximum size in pixels (default: Infinity)
  defaultSize?: number;           // Default size in pixels (default: 300)
  collapsible?: boolean;          // Allow collapse (default: false)
  okMaximize?: boolean;           // Allow maximize (default: false)
}
```

## Advanced Examples

### Nested Layouts

Create complex layouts by nesting groups:

```tsx
<ResizableContext style={{ height: '100vh' }}>
  <ResizableGroup direction="col">
    {/* Left sidebar */}
    <ResizablePanel defaultSize={250} minSize={150} collapsible>
      Sidebar
    </ResizablePanel>
    
    {/* Main content area */}
    <ResizableGroup direction="row">
      {/* Top panel */}
      <ResizablePanel defaultSize={400} minSize={200}>
        Top Content
      </ResizablePanel>
      
      {/* Bottom panel */}
      <ResizablePanel defaultSize={300} minSize={150} collapsible>
        Bottom Content
      </ResizablePanel>
    </ResizableGroup>
    
    {/* Right panel */}
    <ResizablePanel defaultSize={300} minSize={200}>
      Right Panel
    </ResizablePanel>
  </ResizableGroup>
</ResizableContext>
```

### Expand Mode

Panels with `expand={true}` will grow to fill available space:

```tsx
<ResizableGroup direction="col">
  <ResizablePanel defaultSize={200} minSize={150}>
    Fixed Panel
  </ResizablePanel>
  <ResizablePanel expand minSize={300}>
    This panel expands to fill remaining space
  </ResizablePanel>
</ResizableGroup>
```

### Layout Change Callback

Listen to layout changes when resizing ends:

```tsx
<ResizableContext 
  onLayoutChanged={(context) => {
    console.log('Layout changed:', context);
    // Save layout to localStorage, etc.
  }}
>
  {/* ... */}
</ResizableContext>
```

## How It Works

### Resizing

1. Move your mouse over the edge between two panels
2. The cursor changes to indicate a resize handle
3. Click and drag to resize
4. Release to finish

### Collapsing

When `collapsible={true}`:

- Drag a panel edge past half of the `minSize`
- The panel will collapse to 0 size
- Drag the edge back to expand the panel

### Space Distribution

When resizing:

- Space is taken from panels closest to the resize handle first
- Panels respect their `minSize` and `maxSize` constraints
- Collapsed panels don't participate in space distribution
- Expand panels grow to fill remaining space

## Styling

Since this is a headless library, you have complete control over styling:

```tsx
<ResizableContext className="my-layout">
  <ResizableGroup direction="col" className="my-group">
    <ResizablePanel 
      className="my-panel sidebar"
      defaultSize={250}
      minSize={150}
      collapsible
    >
      <div className="panel-content">Content</div>
    </ResizablePanel>
    <ResizablePanel className="my-panel main" expand>
      <div className="panel-content">Main Content</div>
    </ResizablePanel>
  </ResizableGroup>
</ResizableContext>
```

### Data Attributes

Panels expose data attributes for styling:

```css
[data-resizable-panel] {
  /* All panels */
}

[data-resizable-panel][data-collapsed="true"] {
  /* Collapsed panels */
}

[data-resizable-panel][data-maximized="true"] {
  /* Maximized panels */
}

[data-resizable-group] {
  /* Groups */
}

[data-resizable-group][data-direction="col"] {
  /* Horizontal groups */
}

[data-resizable-group][data-direction="row"] {
  /* Vertical groups */
}
```

## TypeScript

Full TypeScript support with exported types:

```tsx
import type { 
  ResizableContextProps, 
  ResizableGroupProps, 
  ResizablePanelProps,
  ContextValue,
  GroupValue,
  PanelValue,
  Direction
} from '@local/resizable-panels';
```

## Known Issues

### maxSize constraint may be exceeded after window resize

**Steps to reproduce:**

1. Set `maxSize` on a panel
2. Collapse other panels in a small window
3. Enlarge the window

**Result:** The panel with `maxSize` may temporarily exceed its limit. Errors may occur when resizing other panels.

**Note:** The panel will return to normal once other panels expand to occupy the excess space.

**Recommendation:** Avoid using `maxSize` if possible to prevent this issue.

**Status:** This issue will not be fixed.

## License

MIT
