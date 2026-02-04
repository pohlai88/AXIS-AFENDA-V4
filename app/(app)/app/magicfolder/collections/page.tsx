/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Collections view - tagged document collections
 */

import { DocumentHub } from "@/components/magicfolder/document-hub/document-hub"
import { UploadDialog } from "../_components/upload-dialog"

export default function MagicFolderCollectionsPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
