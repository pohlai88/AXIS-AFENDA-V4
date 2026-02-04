# MagicFolder Frontend

## Overview

MagicFolder is a modern, unified document management interface that replaces the previous multi-section approach with a single intelligent hub. Built with mobile-first design principles and powered by AI-enhanced features.

## Architecture

### Domain Structure

```
app/(app)/app/magicfolder/
├── page.tsx                    # Main unified document hub
├── layout.tsx                  # MagicFolder segment layout
├── loading.tsx                 # Loading state
├── error.tsx                   # Error boundary
├── _components/                # Route-local components
│   └── upload-dialog.tsx       # Upload dialog integration
└── documents/
    └── [id]/
        ├── page.tsx            # Document detail view
        ├── loading.tsx         # Detail loading state
        ├── error.tsx           # Detail error state
        └── not-found.tsx       # Document not found
```

### Component Structure

All reusable components live in `components/magicfolder/`:

- **DocumentHub** - Main unified interface
- **EnhancedDocumentCard** - Document cards with multiple view modes
- **SmartFilters** - Intelligent filtering system
- **DocumentPreview** - File preview and metadata viewer
- **UploadZone** - Drag-and-drop upload interface
- **BulkActions** - Batch operations on selected documents
- **MobileComponents** - Mobile-specific UI elements

## Features

### Unified Document Hub

- **Single Interface**: Replaces 6 separate sections (Inbox, Duplicates, Unsorted, Search, Collections, Audit)
- **Smart Filtering**: Quick status filters, advanced search, date ranges, tags
- **Multiple View Modes**: Cards, List, Gallery, Table
- **Real-time Stats**: Dashboard showing document counts by status
- **Bulk Operations**: Select multiple documents for batch actions

### Mobile-First Design

- **Responsive Layouts**: Optimized for mobile, tablet, and desktop
- **Touch Gestures**: Swipe actions and touch-friendly controls
- **Bottom Action Bar**: Fixed mobile navigation
- **Floating Upload Button**: Easy access to upload on mobile
- **Mobile Filter Sheet**: Bottom sheet for filters on mobile

### Document Management

- **Document Cards**: Thumbnail previews, status badges, quick actions
- **Document Preview**: Full-screen preview with zoom, rotation, metadata
- **Upload**: Drag-and-drop with progress tracking and validation
- **Bulk Actions**: Archive, tag, process, share, download multiple documents
- **Search**: Full-text search with smart suggestions

### AI-Powered Features

- **Smart Suggestions**: AI-powered filter recommendations
- **Auto-Classification**: Document type detection
- **Duplicate Detection**: Automatic duplicate identification
- **Tag Suggestions**: AI-suggested tags based on content

## State Management

Uses Zustand stores from `lib/client/store/magicfolder-enhanced.ts`:

- **DocumentHubStore**: View mode, filters, selection, documents
- **UploadStore**: Upload queue, progress, drag-over state

## API Integration

All API calls use routes from `lib/routes.ts`:

- `GET /api/v1/magicfolder` - List documents with filters
- `GET /api/v1/magicfolder/objects/:id` - Get document details
- `POST /api/v1/magicfolder/presign` - Get upload presigned URL
- `POST /api/v1/magicfolder/ingest` - Ingest uploaded document
- `GET /api/v1/magicfolder/tags` - List available tags
- `POST /api/v1/magicfolder/bulk` - Bulk operations

## Usage

### Main Page

```tsx
// app/(app)/app/magicfolder/page.tsx
import { DocumentHub } from "@/components/magicfolder/document-hub/document-hub"
import { UploadDialog } from "./_components/upload-dialog"

export default function MagicFolderPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
```

### Document Detail

```tsx
// Navigate to document detail
<Link href={routes.ui.magicfolder.documentById(documentId)}>
  View Document
</Link>
```

### Upload Documents

```tsx
// Trigger upload dialog
const { toggleUploadDialog } = useUploadStore()
<Button onClick={toggleUploadDialog}>Upload</Button>
```

## Development

### Running Locally

```bash
pnpm dev
```

Navigate to `/app/magicfolder` to view the interface.

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

### Building

```bash
pnpm build
```

## Migration from Old Structure

The new unified hub replaces these old routes:

- `/app/magicfolder/inbox` → Filtered view with `status=inbox`
- `/app/magicfolder/duplicates` → Filtered view with `status=duplicates`
- `/app/magicfolder/unsorted` → Filtered view with `status=needs_review`
- `/app/magicfolder/search` → Search functionality in main hub
- `/app/magicfolder/collections` → Tag-based filtering
- `/app/magicfolder/audit` → Integrated into main interface

All functionality is now accessible from the single unified interface at `/app/magicfolder`.

## Performance Optimizations

- **Pagination**: Server-side pagination with configurable page size
- **Lazy Loading**: Images and thumbnails loaded on demand
- **Infinite Scroll**: Load more documents as user scrolls
- **Optimistic Updates**: Immediate UI feedback for actions
- **Debounced Search**: Reduces API calls during typing
- **Skeleton Loading**: Smooth loading states

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and semantic HTML
- **Focus Management**: Proper focus handling in dialogs
- **Color Contrast**: WCAG AA compliant colors
- **Touch Targets**: Minimum 44x44px touch targets on mobile

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Future Enhancements

- [ ] Advanced AI classification
- [ ] Visual search and similarity matching
- [ ] Workflow automation rules
- [ ] Collaborative document sharing
- [ ] Version history and rollback
- [ ] Advanced analytics dashboard
- [ ] Custom metadata fields
- [ ] Integration with external services
