
import Image from "next/image"
import Link from "next/link"

import { SiteLogo } from "./site-logo"
import { cn } from "@/lib/utils"
import { routes } from "@/lib/routes"

export function SplitLayout({
    children,
    imageAlt = "Authentication",
    childrenWrapperClassName,
    showTerms,
}: {
    children: React.ReactNode
    imageAlt?: string
    childrenWrapperClassName?: string
    showTerms?: boolean
}) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <SiteLogo />
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className={cn("w-full max-w-xs", childrenWrapperClassName)}>
                        {children}
                        {showTerms && (
                            <div className="text-muted-foreground mt-6 text-center text-sm">
                                By clicking continue, you agree to our{" "}
                                <Link
                                    href={routes.terms()}
                                    className="underline underline-offset-4"
                                >
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link
                                    href={routes.privacy()}
                                    className="underline underline-offset-4"
                                >
                                    Privacy Policy
                                </Link>
                                .
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="bg-muted relative hidden lg:block">
                <Image
                    src="/placeholder.svg"
                    alt={imageAlt}
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    fill
                    priority
                />
            </div>
        </div>
    )
}
