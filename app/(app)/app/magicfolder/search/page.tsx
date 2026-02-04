/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Search view - document search interface
 */

import { DocumentHub } from "@/components/magicfolder/document-hub/document-hub"
import { UploadDialog } from "../_components/upload-dialog"

export default function MagicFolderSearchPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
