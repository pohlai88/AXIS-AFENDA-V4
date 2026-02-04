/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Main MagicFolder page - unified document hub interface
 * Replaces the old multi-section approach with a single intelligent interface
 */

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
