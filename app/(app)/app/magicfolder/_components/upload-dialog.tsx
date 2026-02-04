/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Upload dialog for MagicFolder - integrates UploadZone with dialog UI
 */

"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UploadZone } from "@/components/magicfolder/upload-zone/upload-zone"
import { useUploadStore } from "@/lib/client/store/magicfolder-enhanced"

export function UploadDialog() {
  const { showUploadDialog, toggleUploadDialog } = useUploadStore()

  return (
    <Dialog open={showUploadDialog} onOpenChange={toggleUploadDialog}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>
        <UploadZone />
      </DialogContent>
    </Dialog>
  )
}
