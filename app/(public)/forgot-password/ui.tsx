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
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth/client"
import { routes } from "@/lib/routes"

const ForgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
})

type ForgotValues = z.infer<typeof ForgotSchema>

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const form = useForm<ForgotValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ForgotSchema as any),
    defaultValues: {
      email: "",
    },
  })

  const isPending = form.formState.isSubmitting

  const onSubmit = async (values: ForgotValues) => {
    const parsed = ForgotSchema.safeParse(values)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const name = issue.path[0]
        if (typeof name === "string") {
          form.setError(name as keyof ForgotValues, { message: issue.message })
        }
      }
      return
    }

    const res = await authClient.forgetPassword.emailOtp({ email: parsed.data.email })
    if (res.error) {
      toast.error(res.error.message ?? "Failed to send reset code")
      return
    }

    toast.success("Check your email for the reset code")
    router.push(routes.resetPassword({ email: parsed.data.email }))
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-muted-foreground text-sm text-balance">
            We&apos;ll email you a one-time code to reset your password.
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
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Sending..." : "Send code"}
          </Button>
        </Field>
        <FieldDescription className="px-6 text-center">
          Remembered your password?{" "}
          <Link href={routes.login()} className="underline underline-offset-4">
            Sign in
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
