"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth/client"
import { routes } from "@/lib/routes"

const ResetSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    otp: z.string().min(6, "Enter the 6-digit code from your email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetValues = z.infer<typeof ResetSchema>

export function ResetPasswordForm({ initialEmail, className, ...props }: { initialEmail: string } & React.ComponentProps<"form">) {
  const router = useRouter()

  const form = useForm<ResetValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ResetSchema as any),
    defaultValues: {
      email: initialEmail,
      otp: "",
      password: "",
      confirmPassword: "",
    },
  })

  const [otpValue, setOtpValue] = React.useState("")

  const isPending = form.formState.isSubmitting

  const onSubmit = async (values: ResetValues) => {
    const parsed = ResetSchema.safeParse({ ...values, otp: otpValue })
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const name = issue.path[0]
        if (typeof name === "string") {
          form.setError(name as keyof ResetValues, { message: issue.message })
        }
      }
      return
    }

    const res = await authClient.emailOtp.resetPassword({
      email: parsed.data.email,
      otp: otpValue,
      password: parsed.data.password,
    })
    if (res.error) {
      toast.error(res.error.message ?? "Failed to reset password")
      return
    }

    toast.success("Password updated. Please sign in.")
    router.push(routes.login())
    router.refresh()
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Enter reset code</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter the one-time code sent to your email, then choose a new password.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            {...form.register("email")}
            disabled={isPending}
          />
          {form.formState.errors.email && (
            <FieldError>{form.formState.errors.email.message}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="otp" className="sr-only">
            Verification code
          </FieldLabel>
          <InputOTP
            maxLength={6}
            id="otp"
            required
            value={otpValue}
            onChange={setOtpValue}
          >
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
          {form.formState.errors.otp && (
            <FieldError>{form.formState.errors.otp.message}</FieldError>
          )}
          {otpValue.length === 6 && !form.formState.errors.otp && (
            <FieldDescription className="text-green-600">
              Code entered successfully
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">New Password</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="Enter new password"
            required
            {...form.register("password")}
            disabled={isPending}
          />
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
          {form.formState.errors.password && (
            <FieldError>{form.formState.errors.password.message}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Confirm new password"
            required
            {...form.register("confirmPassword")}
            disabled={isPending}
          />
          {form.formState.errors.confirmPassword && (
            <FieldError>{form.formState.errors.confirmPassword.message}</FieldError>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Resetting..." : "Reset Password"}
          </Button>
        </Field>
        <FieldDescription className="text-center">
          Didn&apos;t receive the code? <Link href={routes.forgotPassword()}>Resend</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
