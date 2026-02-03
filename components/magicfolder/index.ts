/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Barrel export for MagicFolder shared components
 */

export { DocumentCard, type DocumentCardDoc } from "./magicfolder-document-card"
export {
  DuplicateGroup,
  pickBestVersionId,
  type DuplicateGroupProps,
  type VersionInGroup,
} from "./magicfolder-duplicate-group"
export { InboxItem, type InboxItemDoc } from "./magicfolder-inbox-item"
export { MagicfolderFilterBar } from "./magicfolder-filter-bar"
export { CollectionList, type CollectionItem } from "./magicfolder-collection-list"

/** Canonical blocks (Phase 2) */
export { MagicfolderPage, type MagicfolderPageProps } from "./magicfolder-page"
export {
  MagicfolderDomainShell,
  MagicfolderShell,
  type MagicfolderDomainShellProps,
  type MagicfolderShellProps,
} from "./magicfolder-shell"
export { MagicfolderToolbar, type MagicfolderToolbarProps } from "./magicfolder-toolbar"
export {
  MagicfolderDataView,
  type MagicfolderDataViewProps,
} from "./magicfolder-data-view"
export {
  MagicfolderDocRow,
  MagicfolderDocCard,
  type MagicfolderDocItem,
  type MagicfolderDocRowProps,
  type MagicfolderDocCardProps,
} from "./magicfolder-doc-row"
export {
  MagicfolderEmptyState,
  type MagicfolderEmptyStateProps,
} from "./magicfolder-empty-state"
export {
  MagicfolderPageHeader,
  type MagicfolderPageHeaderProps,
} from "./magicfolder-page-header"
export {
  MagicfolderSection,
  type MagicfolderSectionProps,
} from "./magicfolder-section"
export { MagicfolderLoading } from "./magicfolder-loading"
export {
  MagicfolderStatCard,
  type MagicfolderStatCardProps,
} from "./magicfolder-stat-card"
export {
  MagicfolderHelperText,
  type MagicfolderHelperTextProps,
} from "./magicfolder-helper-text"
export {
  MagicfolderMetadataRow,
  type MagicfolderMetadataRowProps,
} from "./magicfolder-metadata-row"
export {
  MagicfolderNavLinks,
  type MagicfolderNavLinksProps,
  type MagicfolderNavLinkItem,
} from "./magicfolder-nav-links"
export {
  MagicfolderUploadDialog,
  type MagicfolderUploadDialogProps,
} from "./magicfolder-upload-dialog"
