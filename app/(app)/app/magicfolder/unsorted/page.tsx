/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Unsorted view - documents without classification
 */

import { DocumentHub } from "@/components/magicfolder/document-hub/document-hub"
import { UploadDialog } from "../_components/upload-dialog"

export default function MagicFolderUnsortedPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
