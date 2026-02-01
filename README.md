[EN](#) | [中文](README_zh.md)

# Resizable Panels

A headless React component library designed for building IDE-like layouts (similar to VSCode).

## Features

- **Sizing** - Support both pixel (px) and ratio-based sizing modes
- **Constraints** - Support min/max pixel constraints
- **Collapsible/Maximize** - Panels support collapse/expand and maximize operations

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
    <ResizableContext className="h-screen">
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
  ratio?: boolean;                // Use ratio-based flex layout (default: false)
                                  // When true, panel sizes are used as flex-grow ratio
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
  collapsed?: boolean;            // Initial collapsed state (default: false)
  okMaximize?: boolean;           // Allow maximize (default: false)
}
```

### ResizableHandle

Drag handle between panels, used to display visual dividers between panels.

**Note: The handle index is bound according to declaration order, not DOM position.**

```tsx
interface ResizableHandleProps {
  className?: string;             // CSS class name
  children?: ReactNode;           // Custom content, such as icons
  onDoubleClick?: () => void;     // Double-click callback
}
```

## Advanced Examples

### Ratio Mode

Use `ratio` mode for ratio-based space distribution. Panel sizes are treated as flex-grow ratios rather than fixed pixels:

```tsx
<ResizableGroup direction="col" ratio>
  <ResizablePanel defaultSize={1}>  {/* Takes 1/4 of space */}
    Sidebar
  </ResizablePanel>
  <ResizablePanel defaultSize={3}>  {/* Takes 3/4 of space */}
    Main Content
  </ResizablePanel>
</ResizableGroup>
```

In ratio mode, resizing still works, and the sizes are distributed proportionally.

### Nested Layouts

Create complex layouts by nesting groups:

```tsx
<ResizableContext className="h-screen">
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

### Default Collapsed

Set `collapsed={true}` to make the panel initially collapsed (requires `collapsible`):

```tsx
<ResizableGroup direction="col">
  <ResizablePanel defaultSize={250} minSize={200} collapsible collapsed>
    Collapsed by default sidebar
  </ResizablePanel>
  <ResizablePanel>
    Main Content
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

## License

MIT
