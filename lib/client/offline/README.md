# Offline Mode & Sync Implementation

This directory contains the complete offline functionality for the AFENDA task management application.

## Architecture

The offline implementation follows a client-side first approach with:

- **IndexedDB** via Dexie.js for local storage
- **Service Worker** for caching and background sync
- **Conflict Resolution** with automatic and manual strategies
- **PWA** capabilities for installability

## Core Components

### Storage Layer (`storage.ts`)
- Manages IndexedDB operations
- Provides CRUD operations for tasks, projects, sync queue, and conflicts
- Handles soft deletes and sync status tracking

### Sync Queue (`sync-queue.ts`)
- Queues offline operations for later synchronization
- Implements retry logic with exponential backoff
- Batches operations for efficiency

### Conflict Resolver (`conflict-resolver.ts`)
- Detects conflicts between client and server data
- Provides multiple resolution strategies
- Handles field-level merging for smart conflict resolution

### Offline Manager (`offline-manager.ts`)
- Orchestrates all offline functionality
- Manages connection status
- Coordinates sync operations
- Provides API for offline operations

## Usage

### Basic Offline Operations

```typescript
import { offlineManager } from "@/lib/client/offline/offline-manager"

// Create a task offline
const task = await offlineManager.createTaskOffline({
  title: "New task",
  description: "Created offline",
  status: "todo"
})

// Update a task offline
await offlineManager.updateTaskOffline(task.id, {
  title: "Updated title"
})

// Delete a task offline
await offlineManager.deleteTaskOffline(task.id)

// Sync all changes
await offlineManager.syncAll()
```

### Using with Existing Store

```typescript
import { useOfflineTasksStore } from "@/lib/client/offline/tasks-store-wrapper"

function MyComponent() {
  const tasksStore = useTasksStore()
  const offlineStore = useOfflineTasksStore(tasksStore)
  
  const handleCreateTask = async (data) => {
    await offlineStore.createTask(data)
  }
}
```

### Listening to Events

```typescript
useEffect(() => {
  const handleStatusChange = (event) => {
    console.log("Offline status:", event.detail.status)
  }
  
  window.addEventListener("offline:status-changed", handleStatusChange)
  
  return () => {
    window.removeEventListener("offline:status-changed", handleStatusChange)
  }
}, [])
```

## Available Events

- `offline:status-changed` - Connection status changed
- `offline:sync-started` - Sync operation started
- `offline:sync-completed` - Sync completed successfully
- `offline:sync-failed` - Sync failed
- `offline:conflict-detected` - Conflict detected
- `offline:conflict-resolved` - Conflict resolved

## Database Schema

### Sync Fields Added

#### Tasks Table
- `client_generated_id` - Unique client-side ID
- `sync_status` - Current sync status (synced/pending/conflict/deleted)
- `sync_version` - Version number for conflict resolution
- `last_synced_at` - Timestamp of last successful sync

#### Projects Table
- Same sync fields as tasks

### Additional Tables

#### `sync_queue`
- Tracks pending operations
- Implements retry logic
- Stores operation data for background sync

#### `sync_conflicts`
- Records conflicts between client and server
- Stores both versions for resolution
- Tracks resolution strategy

## API Endpoints

### Pull Changes
```
GET /api/v1/sync/pull?since=<timestamp>
```
Fetches server changes since last sync.

### Push Changes
```
POST /api/v1/sync/push
```
Sends client changes to server.

### Resolve Conflicts
```
POST /api/v1/sync/resolve
```
Applies conflict resolution.

## PWA Features

### Manifest
- Configured for standalone app experience
- Defines shortcuts and icons
- Enables installation prompt

### Service Worker
- Caches static assets
- Handles offline fallbacks
- Implements background sync
- Manages API response caching

### Install Prompt
- Automatically shows when criteria met
- Provides clear benefits explanation
- Handles iOS-specific instructions

## Conflict Resolution Strategies

1. **Server Wins** - Discard local changes
2. **Client Wins** - Overwrite server changes
3. **Merge** - Auto-merge non-conflicting fields
4. **Manual** - User intervention required

### Smart Merging

- **Tasks**: Merges title, description, tags, priority
- **Projects**: Merges name, description, color
- **Temporal**: Uses timestamps for recent changes
- **Priority**: Higher priority wins for conflicts

## Performance Optimizations

- **Batching**: Groups sync operations
- **Delta Sync**: Only transfers changes
- **Compression**: Reduces bandwidth usage
- **Caching**: Stores responses locally
- **Lazy Loading**: Loads data on demand

## Security Considerations

- IndexedDB data is not encrypted by default
- Consider adding encryption for sensitive data
- Auth tokens handled securely
- Proper session management

## Testing

### Unit Tests
- Conflict resolution logic
- Storage operations
- Sync queue management

### Integration Tests
- End-to-end sync scenarios
- Conflict detection/resolution
- Offline/online transitions

### E2E Tests
- Complete offline workflows
- PWA installation
- Cross-device synchronization

## Troubleshooting

### Common Issues

1. **Sync Not Working**
   - Check network connection
   - Verify service worker is registered
   - Clear browser cache and retry

2. **Conflicts Not Resolving**
   - Check sync versions
   - Verify conflict data integrity
   - Review resolution strategy

3. **PWA Not Installing**
   - Ensure HTTPS in production
   - Check manifest validity
   - Verify service worker scope

### Debug Tools

- Browser DevTools > Application > Storage
- Browser DevTools > Application > Service Workers
- Console logs for sync events
- IndexedDB viewer for local data

## Future Enhancements

1. **Web Workers** for heavy sync computations
2. **Differential Sync** for large datasets
3. **Real-time Collaboration** with WebSockets
4. **Advanced Conflict Resolution** with ML
5. **Offline Analytics** and Reporting
