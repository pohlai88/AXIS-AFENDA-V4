/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Inbox view - shows documents with inbox status
 */

import { DocumentHub } from "@/components/magicfolder/document-hub/document-hub"
import { UploadDialog } from "../_components/upload-dialog"

export default function MagicFolderInboxPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
