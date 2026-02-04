/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Duplicates view - shows duplicate document groups
 */

import { DuplicateGroupsView } from "@/components/magicfolder/duplicate-groups-view/duplicate-groups-view"
import { UploadDialog } from "../_components/upload-dialog"

export default function MagicFolderDuplicatesPage() {
  return (
    <>
      <DuplicateGroupsView />
      <UploadDialog />
    </>
  )
}
