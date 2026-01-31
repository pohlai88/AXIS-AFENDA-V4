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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type LoginValues = z.infer<typeof LoginSchema>

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackPath = searchParams?.get("callbackUrl") ?? routes.app.root()

  const form = useForm<LoginValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(LoginSchema as any),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const isPending = form.formState.isSubmitting

  const getCallbackUrl = () => {
    return `${window.location.origin}${callbackPath}`
  }

  const onSubmit = async (values: LoginValues) => {
    const parsed = LoginSchema.safeParse(values)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const name = issue.path[0]
        if (typeof name === "string") {
          form.setError(name as keyof LoginValues, { message: issue.message })
        }
      }
      return
    }

    const res = await authClient.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
      callbackURL: getCallbackUrl(),
    })

    if (res.error) {
      toast.error(res.error.message ?? "Failed to sign in")
      return
    }

    toast.success("Signed in successfully")
    router.push(callbackPath)
    router.refresh()
  }

  const signInWithProvider = async (provider: "google" | "github") => {
    const res = await authClient.signIn.social({
      provider: provider,
      callbackURL: getCallbackUrl(),
    })
    if (res.error) {
      toast.error(res.error.message ?? `Failed to sign in with ${provider}`)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Google or GitHub account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => void signInWithProvider("google")}
                  disabled={isPending}
                  className="w-full"
                >
                  <ChromeIcon className="mr-2 size-4" />
                  Login with Google
                </Button>
              </Field>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => void signInWithProvider("github")}
                  disabled={isPending}
                  className="w-full"
                >
                  <GithubIcon className="mr-2 size-4" />
                  Login with GitHub
                </Button>
              </Field>
              <Separator />
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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href={routes.forgotPassword()}
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  {...form.register("password")}
                  disabled={isPending}
                />
                {form.formState.errors.password && (
                  <FieldError>{form.formState.errors.password.message}</FieldError>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Signing in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href={routes.register()} className="underline underline-offset-4">
                    Sign up
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
