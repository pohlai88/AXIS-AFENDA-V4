import Link from "next/link"

import { cn } from "@/lib/utils"
import { SiteLogo } from "./site-logo"
import { routes } from "@/lib/routes"

export function AuthShell({
  children,
  containerClassName,
}: {
  children: React.ReactNode
  containerClassName?: string
}) {
  return (
    <div className="bg-muted relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div
        className={cn(
          "relative z-10 flex w-full max-w-sm flex-col gap-6",
          containerClassName
        )}
      >
        <SiteLogo className="self-center" />
        {children}
        <div className="text-muted-foreground px-6 text-center text-sm">
          By clicking continue, you agree to our{" "}
          <Link href={routes.terms()} className="underline underline-offset-4">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href={routes.privacy()} className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  )
}
