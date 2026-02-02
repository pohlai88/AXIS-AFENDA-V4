"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export interface AuthFormWrapperProps {
  onSubmit: (e?: React.FormEvent) => Promise<void> | void
  submitText: string
  isSubmitting?: boolean
  children: React.ReactNode
}

export function AuthFormWrapper({
  onSubmit,
  submitText,
  isSubmitting = false,
  children,
}: AuthFormWrapperProps) {
  return (
    <div className="space-y-4">
      {children}

      <Button
        type="submit"
        disabled={isSubmitting}
        onClick={() => onSubmit()}
        className="w-full"
      >
        {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
        {submitText}
      </Button>
    </div>
  )
}