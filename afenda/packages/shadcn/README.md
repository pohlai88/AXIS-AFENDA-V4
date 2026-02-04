# @afenda/shadcn

Internal package for shadcn/ui components and custom UI extensions.

## 📦 Package Structure

```
src/
├── index.ts              # Central export point for all components
├── accordion.tsx         # Official shadcn/ui components...
├── alert.tsx
├── ...                   # (56 total official components)
├── use-mobile.ts         # Utility hooks
└── custom/              # Custom/extended components
    ├── animated-theme-toggler.tsx
    ├── bento-grid.tsx
    ├── border-beam.tsx
    ├── date-picker.tsx
    ├── dot-pattern.tsx
    ├── kanban.tsx
    ├── number-ticker.tsx
    ├── password-input.tsx
    ├── retro-grid.tsx
    └── shimmer-button.tsx
```

## 🎯 Component Categories

### Official shadcn/ui Components (56)

All components from the official [shadcn/ui](https://ui.shadcn.com/) registry, including:

- **Layout**: `card`, `separator`, `aspect-ratio`, `resizable`, `scroll-area`
- **Forms**: `form`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`, `calendar`, `combobox`
- **Navigation**: `breadcrumb`, `navigation-menu`, `menubar`, `tabs`, `sidebar`
- **Overlays**: `dialog`, `alert-dialog`, `sheet`, `drawer`, `popover`, `hover-card`, `tooltip`, `context-menu`, `dropdown-menu`
- **Feedback**: `alert`, `sonner`, `progress`, `spinner`, `skeleton`
- **Data Display**: `table`, `badge`, `avatar`, `chart`, `empty`, `kbd`
- **Interactive**: `button`, `button-group`, `toggle`, `toggle-group`, `collapsible`, `accordion`, `carousel`
- **Specialized**: `command`, `input-otp`, `input-group`, `field`, `item`, `native-select`, `pagination`

### Custom Components (10)

Extended and composed components built on top of shadcn/ui:

- **`animated-theme-toggler`** - Animated dark/light mode toggle
- **`bento-grid`** - Modern bento-style grid layout
- **`border-beam`** - Animated border effects
- **`date-picker`** - Enhanced date picker (composes Calendar + Popover)
- **`dot-pattern`** - Decorative background pattern
- **`kanban`** - Drag-and-drop kanban board (uses @dnd-kit)
- **`number-ticker`** - Animated number counter
- **`password-input`** - Password input with show/hide toggle
- **`retro-grid`** - Retro-style background grid
- **`shimmer-button`** - Button with shimmer animation effect

## 📝 Standards

All components follow the project's **Standard Envelope Header** format:

```ts
/**
 * @domain shared
 * @layer ui
 * @responsibility <component purpose>
 * @owner afenda/shadcn
 * @dependencies
 * - radix-ui (external)
 * - @/lib/utils
 * @exports
 * - <exported symbols>
 */
```

## 🔧 Maintenance

### Updating Official Components

To reinstall/update official shadcn components and overwrite customizations:

```bash
npx shadcn@latest add @shadcn/[component-name] --overwrite --path afenda/packages/shadcn/src
```

### Adding New Official Components

```bash
npx shadcn@latest add @shadcn/[component-name] --path afenda/packages/shadcn/src
node scripts/inject-shadcn-headers.mjs
```

### Adding Custom Components

1. Create component in `src/custom/`
2. Run header injection: `node scripts/inject-custom-headers.mjs`
3. Add export to `src/index.ts`

## 🚀 Usage

Import components from the package:

```tsx
import { Button, Card, DatePicker, Kanban } from "@afenda/shadcn"
```

## 📚 Dependencies

- **React** - Core library
- **Radix UI** - Headless component primitives
- **@dnd-kit** - Drag and drop (for Kanban)
- **lucide-react** - Icon library
- **class-variance-authority** - Variant management
- **tailwindcss** - Styling

## 🔗 Related

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- Project `components.json` configuration
