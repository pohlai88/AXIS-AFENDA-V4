/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Keyboard shortcuts help dialog for MagicFolder
 */

"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Keyboard } from "lucide-react"
import { getKeyboardShortcutList } from "@/lib/client/hooks/use-keyboard-shortcuts"

export function KeyboardShortcutsDialog() {
  const shortcuts = getKeyboardShortcutList()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Keyboard className="h-4 w-4 mr-2" />
          Keyboard Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcuts.map((category) => (
            <div key={category.category} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {shortcut.keys}
                    </Badge>
                  </div>
                ))}
              </div>
              {category.category !== shortcuts[shortcuts.length - 1].category && (
                <Separator />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-2 py-1 bg-background rounded border">?</kbd> anytime to see
            these shortcuts
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
