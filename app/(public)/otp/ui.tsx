"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { routes } from "@/lib/routes"

export function OTPForm({ className, ...props }: React.ComponentProps<"div">) {
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState("")

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.length !== 6) {
      setError("Please enter a 6-digit code")
      return
    }
    toast.message("Submitted verification code.", {
      description: value ? `Code: ${value}` : undefined,
    })
  }

  const onResend = () => {
    toast.message("Resending code…")
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Enter verification code</h1>
            <p className="text-muted-foreground text-sm text-balance">
              We sent a 6-digit code to your email.
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="otp" className="sr-only">
              Verification code
            </FieldLabel>
            <InputOTP maxLength={6} id="otp" required value={value} onChange={setValue}>
              <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <FieldDescription>
              Enter the 6-digit code sent to your email.
            </FieldDescription>
            {error && (
              <FieldError>{error}</FieldError>
            )}
          </Field>
          <Button type="submit" disabled={value.length !== 6} className="w-full">
            Verify
          </Button>
          <FieldDescription className="text-center">
            Didn&apos;t receive the code? <button type="button" onClick={onResend} className="underline underline-offset-4">Resend</button>
          </FieldDescription>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <Link href={routes.terms()}>Terms of Service</Link>{" "}
        and <Link href={routes.privacy()}>Privacy Policy</Link>.
      </FieldDescription>
    </div>
  )
}

