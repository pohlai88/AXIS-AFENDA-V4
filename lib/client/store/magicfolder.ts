/**
 * @domain magicfolder
 * @layer client
 * @responsibility Re-export MagicFolder Zustand stores (UI-only, no server truth)
 */

export {
  useMagicfolderSearchStore,
  type MagicfolderFilters,
  type MagicfolderSortBy,
  type MagicfolderSortOrder,
  type MagicfolderViewMode,
  type SavedView,
} from "./magicfolder-search"

export { useMagicfolderSelectionStore } from "./magicfolder-selection"

export {
  useMagicfolderUploadStore,
  type UploadItem,
  type UploadItemStatus,
} from "./magicfolder-upload"

export { useMagicfolderDuplicatesStore } from "./magicfolder-duplicates"
