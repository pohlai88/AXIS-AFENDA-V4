"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ChromeIcon, GithubIcon } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"
import { authClient } from "@/lib/auth/client"
import { routes } from "@/lib/routes"

const RegisterSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterValues = z.infer<typeof RegisterSchema>

export function SignupForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackPath = searchParams?.get("callbackUrl") ?? routes.app.root()

  const form = useForm<RegisterValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(RegisterSchema as any),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const isPending = form.formState.isSubmitting

  const getCallbackUrl = () => {
    return `${window.location.origin}${callbackPath}`
  }

  const onSubmit = async (values: RegisterValues) => {
    const parsed = RegisterSchema.safeParse(values)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const name = issue.path[0]
        if (typeof name === "string") {
          form.setError(name as keyof RegisterValues, { message: issue.message })
        }
      }
      return
    }

    const res = await authClient.signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      callbackURL: getCallbackUrl(),
    })

    if (res.error) {
      toast.error(res.error.message ?? "Failed to create account")
      return
    }

    toast.success("Account created")
    router.push(routes.login())
    router.refresh()
  }

  const signUpWithProvider = async (provider: "google" | "github") => {
    const res = await authClient.signIn.social({
      provider,
      callbackURL: getCallbackUrl(),
      requestSignUp: true,
    })
    if (res.error) {
      toast.error(res.error.message ?? `Failed to continue with ${provider}`)
      return
    }
    if (res.data?.url) window.location.assign(res.data.url)
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            required
            {...form.register("name")}
            disabled={isPending}
          />
          {form.formState.errors.name && (
            <FieldError>{form.formState.errors.name.message}</FieldError>
          )}
        </Field>
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
          <FieldDescription>
            We&apos;ll use this to contact you. We will not share your email
            with anyone else.
          </FieldDescription>
          {form.formState.errors.email && (
            <FieldError>{form.formState.errors.email.message}</FieldError>
          )}
        </Field>
        <Field className="grid gap-2 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
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
          </div>
          <div>
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm password"
              required
              {...form.register("confirmPassword")}
              disabled={isPending}
            />
            <FieldDescription>Please confirm your password.</FieldDescription>
            {form.formState.errors.confirmPassword && (
              <FieldError>{form.formState.errors.confirmPassword.message}</FieldError>
            )}
          </div>
        </Field>
        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
        </Field>
        <Separator />
        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={() => void signUpWithProvider("google")}
            disabled={isPending}
            className="w-full"
          >
            <ChromeIcon className="mr-2 size-4" />
            Sign up with Google
          </Button>
        </Field>
        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={() => void signUpWithProvider("github")}
            disabled={isPending}
            className="w-full"
          >
            <GithubIcon className="mr-2 size-4" />
            Sign up with GitHub
          </Button>
        </Field>
        <FieldDescription className="px-6 text-center">
          Already have an account? <Link href={routes.login()}>Sign in</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
