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
                                  // 'col' = panels arranged horizontally (left-right), drag handle resizes horizontally
                                  // 'row' = panels arranged vertically (top-bottom), drag handle resizes vertically
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
  onClick?: () => void;           // Click callback
  onDoubleClick?: () => void;     // Double-click callback
}
```

## Hooks

### useResizableContext

Access the root context value outside of `ResizableContext`:

```tsx
import { useResizableContext } from '@local/resizable-panels';

function GlobalControls() {
  const context = useResizableContext();
  
  // Access all groups
  const groups = Array.from(context.groups.values());
  
  return <div>Global Controls</div>;
}
```

### useGroupContext

Access the group context within a `ResizableGroup` to programmatically control panels:

```tsx
import { useGroupContext } from '@local/resizable-panels';

function CustomHandle() {
  const group = useGroupContext();
  
  // Access panels and group properties
  const panels = Array.from(group.panels.values());
  
  return <div>Custom Handle</div>;
}
```

### GroupValue Interface

```tsx
interface GroupValue {
  id: string;                     // Unique identifier
  direction: 'row' | 'col';       // Resize direction
  ratio: boolean;                 // Ratio mode flag
  panels: Map<string, PanelValue>;
  handles: HandleValue[];
  containerEl: RefObject<HTMLElement>;
  registerPanel: (panel: PanelValue) => void;
  unregisterPanel: (id: string) => void;
  registerHandle: (handle: HandleValue) => void;
  unregisterHandle: (id: string) => void;
  dragPanel: (delta: number, index: number) => void;  // Programmatically resize panels
  prevMaximize?: [boolean, number][];                 // State before maximize
  prevDrag?: [boolean, number][];                     // State before drag
}
```

### usePanelContext

Access the panel context within a `ResizablePanel`:

```tsx
import { usePanelContext } from '@local/resizable-panels';

function PanelContent() {
  const panel = usePanelContext();
  
  // Access panel properties
  const { size, minSize, maxSize, isCollapsed } = panel;
  
  return <div>Panel Size: {size}px</div>;
}
```

## Utility Functions

### dragPanel

Programmatically resize panels at a specific handle index. Called on `GroupValue`.

```tsx
const group = useGroupContext();

// Expand left panel by 200px (handle index 0)
group.dragPanel(200, 0);

// Collapse right panel (handle index 1)
group.dragPanel(-panel.size, 1);
```

**Parameters:**

- `delta`: Pixels to move (positive = panels before handle grow, negative = shrink)
- `index`: Handle index (0 = between panel 0 and 1)

### restorePanels

Restore all panels to their state before maximization.

```tsx
import { restorePanels } from '@local/resizable-panels';

restorePanels(group);
```

### maximizePanel

Maximize a specific panel by collapsing all others.

```tsx
import { maximizePanel } from '@local/resizable-panels';

const panels = Array.from(group.panels.values());
const targetPanel = panels[0];
maximizePanel(targetPanel, group);
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

### Programmatic Panel Control

Use `useGroupContext` and utility functions to create custom panel controls:

```tsx
function PanelControls() {
  const group = useGroupContext();
  const panels = Array.from(group.panels.values());
  const leftPanel = panels[0];

  return (
    <div>
      <button onClick={() => group.dragPanel(100, 0)}>
        Expand Left
      </button>
      <button onClick={() => maximizePanel(leftPanel, group)}>
        Maximize Left
      </button>
      <button onClick={() => restorePanels(panels, group)}>
        Restore All
      </button>
    </div>
  );
}
```

## License

MIT
