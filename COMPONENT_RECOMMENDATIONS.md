# UI Component Quality & Enterprise Integration - Detailed Recommendations

## Overview
This document provides component-by-component guidance for Phase 3 stabilization.

---

## Priority 1: Critical Components (Affect User Experience)

### 1. `permission-guard.tsx` - REQUIRES REDESIGN
**Current Status**: C | **Target**: B+  
**Effort**: 3 days | **Impact**: CRITICAL

**Issues**:
```typescript
// CURRENT: Too simplistic, binary permission model
export function PermissionGuard({ required, fallback }) {
  const has = permissions.includes(required);
  return has ? children : fallback;
}

// PROBLEMS:
❌ No granular role-based access control (RBAC)
❌ No resource-level permissions
❌ No delegation/approval workflow support
❌ Can't handle "OR" permission conditions
❌ No audit logging of access denials
```

**Solution**:
```typescript
// ENHANCED: Granular RBAC with resource-level checks
type Permission =
  | 'tasks:create' | 'tasks:read' | 'tasks:update' | 'tasks:delete'
  | 'projects:create' | 'projects:read' | 'projects:update' | 'projects:delete'
  | 'org:read' | 'org:manage' | 'org:invite'
  | 'team:read' | 'team:manage';

type RBACContext = {
  userId: string;
  roles: Role[];  // admin, manager, member
  resourceId?: string;
  resourceType?: 'task' | 'project' | 'organization' | 'team';
  org: Organization;
};

export function PermissionGuard({
  require,  // Single permission or array
  requireAll = false,  // AND vs OR logic
  resource,  // { type, id }
  fallback = <AccessDenied />,
  onDenied = () => logDenial(),
}: {
  require: Permission | Permission[];
  requireAll?: boolean;
  resource?: { type: string; id: string };
  fallback?: React.ReactNode;
  onDenied?: () => void;
}) {
  const rbac = useRBAC();
  const required = Array.isArray(require) ? require : [require];
  
  const hasPermission = requireAll
    ? required.every(p => rbac.can(p, resource))
    : required.some(p => rbac.can(p, resource));
  
  if (!hasPermission) {
    onDenied?.();
    return fallback;
  }
  
  return children;
}

// USAGE:
<PermissionGuard
  require={['tasks:update', 'org:manage']}  // OR condition
  resource={{ type: 'task', id: taskId }}
>
  <UpdateButton />
</PermissionGuard>

<PermissionGuard
  require={['tasks:delete', 'org:manage']}
  requireAll  // Requires BOTH permissions
  fallback={<button disabled>Delete (no permission)</button>}
>
  <DeleteButton />
</PermissionGuard>
```

**Implementation Checklist**:
- [ ] Create RBAC context provider
- [ ] Implement permission validation logic
- [ ] Add audit logging for access denials
- [ ] Create role definition constants
- [ ] Add tests (5 test cases minimum)
- [ ] Document permission model

---

### 2. `data-table.tsx` - ADD PERSISTENCE & FEATURES
**Current Status**: B | **Target**: A-  
**Effort**: 2 days | **Impact**: HIGH

**Issues**:
```typescript
❌ Sort order not persisted
❌ Column visibility not saved
❌ Filter selections lost on refresh
❌ No row selection state management
❌ No pagination state persistence
❌ No mobile card view fallback
```

**Solution**:
```typescript
// Enhanced with localStorage persistence
export function DataTable<TData, TValue>({
  columns,
  data,
  persistKey = 'default-table',  // Unique key for storage
  enableColumnVisibility = true,
  enableSorting = true,
  enableFiltering = true,
  enableRowSelection = false,
  mobileCardTemplate,  // Fallback for small screens
}: DataTableProps<TData, TValue>) {
  
  // Persist sorting
  const [sorting, setSorting] = useState<SortingState>(() => {
    const stored = localStorage.getItem(`${persistKey}:sorting`);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(`${persistKey}:sorting`, JSON.stringify(sorting));
  }, [sorting, persistKey]);

  // Persist column visibility
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const stored = localStorage.getItem(`${persistKey}:columns`);
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem(
      `${persistKey}:columns`,
      JSON.stringify(columnVisibility)
    );
  }, [columnVisibility, persistKey]);

  // Persist pagination
  const [pagination, setPagination] = useState<PaginationState>(() => {
    const stored = localStorage.getItem(`${persistKey}:pagination`);
    return stored ? JSON.parse(stored) : { pageIndex: 0, pageSize: 10 };
  });

  useEffect(() => {
    localStorage.setItem(`${persistKey}:pagination`, JSON.stringify(pagination));
  }, [pagination, persistKey]);

  // Mobile detection
  const isMobile = useMediaQuery('(max-width: 640px)');

  if (isMobile && mobileCardTemplate) {
    return (
      <div className="space-y-2">
        {data.map((item) => (
          <Card key={item.id} className="p-4">
            {mobileCardTemplate(item)}
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Desktop table view */}
      <Table>
        {/* Implementation */}
      </Table>
    </div>
  );
}

// USAGE:
<DataTable
  columns={taskColumns}
  data={tasks}
  persistKey="user-tasks-table"
  mobileCardTemplate={(task) => (
    <div className="space-y-2">
      <h3 className="font-semibold">{task.title}</h3>
      <p className="text-sm text-muted">{task.description}</p>
      <Badge>{task.status}</Badge>
    </div>
  )}
  enableSorting
  enableColumnVisibility
  enableFiltering
/>
```

**Implementation Checklist**:
- [ ] Add localStorage persistence for sort, columns, pagination
- [ ] Create mobile card view fallback
- [ ] Add column visibility toggle
- [ ] Implement row selection management
- [ ] Add clear filters button
- [ ] Create tests (8+ test cases)

---

### 3. `app-sidebar.tsx` - MOBILE RESPONSIVE
**Current Status**: A- | **Target**: A  
**Effort**: 1 day | **Impact**: MEDIUM

**Issues**:
```typescript
❌ No mobile hamburger menu
❌ No collapse animation on small screens
❌ Fixed width on mobile (takes up space)
```

**Solution**:
```typescript
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isOpen, setIsOpen] = useState(false);

  // Auto-close on navigation
  const router = useRouter();
  useEffect(() => {
    setIsOpen(false);
  }, [router.pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md hover:bg-accent"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsible={isMobile ? 'icon' : 'sidebar'}
        className={cn(
          isMobile && isOpen ? 'translate-x-0' : isMobile ? '-translate-x-full' : '',
          'transition-transform'
        )}
        {...props}
      >
        {/* Content */}
      </Sidebar>
    </>
  );
}
```

**Implementation Checklist**:
- [ ] Add responsive hamburger button
- [ ] Implement mobile overlay
- [ ] Add collapse animation
- [ ] Test on multiple screen sizes
- [ ] Ensure touch-friendly tap targets (44px minimum)

---

## Priority 2: Accessibility Components (A11y)

### 4. `form.tsx` - WCAG AA COMPLIANCE
**Current Status**: B | **Target**: A  
**Effort**: 2 days | **Impact**: CRITICAL (compliance)

**Missing WCAG 2.1 AA**:
```typescript
❌ No ARIA labels on error messages
❌ Missing aria-describedby connections
❌ No focus visible styling
❌ No error announcement to screen readers
❌ Missing aria-required attributes
❌ No validation feedback timing
```

**Solution**:
```typescript
export interface FormFieldProps {
  name: string;
  required?: boolean;
  description?: string;
  hint?: string;
  error?: string;
  className?: string;
}

export function FormField({
  name,
  required,
  description,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  const errorId = `${name}-error`;
  const descriptionId = `${name}-description`;
  const hintId = `${name}-hint`;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label with required indicator */}
      <label
        htmlFor={name}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {children}
        {required && <span aria-label="required">*</span>}
      </label>

      {/* Description text (below label) */}
      {description && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {/* Input field */}
      <input
        id={name}
        name={name}
        required={required}
        aria-invalid={!!error}
        aria-describedby={[
          descriptionId,
          hintId,
          error ? errorId : null
        ]
          .filter(Boolean)
          .join(' ')}
        aria-required={required}
        className={cn(
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          error && 'border-destructive focus-visible:outline-destructive'
        )}
        // ... other props
      />

      {/* Hint text (helper) */}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {/* Error message with role for screen readers */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Test with axe-core
import { axe } from 'jest-axe';

describe('FormField Accessibility', () => {
  it('passes axe accessibility checks', async () => {
    const { container } = render(
      <FormField name="email" required error="Invalid email">
        Email
      </FormField>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('announces errors to screen readers', () => {
    const { getByRole } = render(
      <FormField name="email" error="Required field">
        Email
      </FormField>
    );
    expect(getByRole('alert')).toHaveTextContent('Required field');
  });
});
```

**Implementation Checklist**:
- [ ] Add aria-invalid, aria-required attributes
- [ ] Connect error messages with aria-describedby
- [ ] Add focus-visible styles (WCAG AA 2.4.7)
- [ ] Test with axe-core
- [ ] Test with screen readers (NVDA, JAWS)
- [ ] Verify color contrast (4.5:1 ratio)

---

### 5. `dialog.tsx` - KEYBOARD NAVIGATION
**Current Status**: B+ | **Target**: A  
**Effort**: 1 day | **Impact**: MEDIUM

**Missing**:
```typescript
❌ No focus trap
❌ Esc key not closing
❌ No focus restoration on close
❌ Tab focus not managed
```

**Solution**:
```typescript
export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ open, onOpenChange, ...props }, ref) => {
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Focus trap
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false);
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = ref?.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements?.length) {
          // Trap focus within dialog
          handleTabKey(e, focusableElements);
        }
      }
    };

    useEffect(() => {
      if (open) {
        // Store current focus
        previousFocusRef.current = document.activeElement as HTMLElement;
        // Move focus to dialog
        ref?.current?.focus();
      } else {
        // Restore previous focus
        previousFocusRef.current?.focus();
      }
    }, [open]);

    return (
      <dialog
        ref={ref}
        open={open}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        {...props}
      />
    );
  }
);
```

**Implementation Checklist**:
- [ ] Implement focus trap
- [ ] Handle Esc key
- [ ] Restore focus on close
- [ ] Test keyboard navigation
- [ ] Test with screen readers

---

## Priority 3: Performance Components

### 6. `nav-projects.tsx` - VIRTUALIZATION
**Current Status**: B+ | **Target**: A-  
**Effort**: 2 days | **Impact**: MEDIUM (large lists)

**Issue**: No virtualization for large project lists

**Solution**:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function NavProjects() {
  const projects = useProjects();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // ~40px per item
    gap: 8,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <nav ref={parentRef} className="max-h-96 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => (
          <NavProjectsItem
            key={projects[virtualItem.index].id}
            project={projects[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
    </nav>
  );
}
```

**Implementation Checklist**:
- [ ] Add @tanstack/react-virtual dependency
- [ ] Implement virtualizer
- [ ] Test with 1000+ projects
- [ ] Measure performance improvement

---

## Priority 4: Testing Requirements

### Component Test Matrix
Create test files for all business components:

```typescript
// components/__tests__/permission-guard.test.tsx
describe('PermissionGuard', () => {
  it('shows content when user has permission', () => {});
  it('shows fallback when permission denied', () => {});
  it('handles permission arrays (OR logic)', () => {});
  it('handles resource-level permissions', () => {});
  it('logs access denials', () => {});
});

// components/__tests__/data-table.test.tsx
describe('DataTable', () => {
  it('persists sort preference', () => {});
  it('persists column visibility', () => {});
  it('persists pagination state', () => {});
  it('shows mobile card view on small screens', () => {});
  it('handles row selection', () => {});
});

// components/__tests__/form.test.tsx
describe('FormField', () => {
  it('passes axe accessibility checks', () => {});
  it('connects error messages with aria-describedby', () => {});
  it('announces errors to screen readers', () => {});
  it('displays required indicator', () => {});
});

// components/__tests__/dialog.test.tsx
describe('Dialog', () => {
  it('closes on Esc key', () => {});
  it('traps focus', () => {});
  it('restores focus on close', () => {});
  it('has correct ARIA attributes', () => {});
});
```

**Testing Effort**: 4 days
**Target Coverage**: 80%+ of business components

---

## Implementation Priority Order

| Week | Focus | Components | Effort |
|------|-------|-----------|--------|
| Week 3, Day 1-2 | RBAC & WCAG A11y | permission-guard, form, dialog | 5 days |
| Week 3, Day 3-5 | Data & Mobile | data-table, app-sidebar | 3 days |
| Week 4, Day 1-2 | Performance | nav-projects, virtualization | 2 days |
| Week 4, Day 3-5 | Testing | All components | 4 days |

---

## Success Criteria

- ✅ All components pass axe-core accessibility checks
- ✅ All business components have >80% test coverage
- ✅ Mobile tests passing on iOS/Android simulators
- ✅ WCAG 2.1 AA compliance verified
- ✅ No console warnings/errors in dev mode
- ✅ Component Storybook stories created

---

**Status**: READY FOR PHASE 3 IMPLEMENTATION
