import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"

export function SiteLogo({
    className,
    showText = true,
}: {
    className?: string
    showText?: boolean
}) {
    return (
        <Link
            href={routes.ui.marketing.home()}
            className={cn("flex items-center gap-2 font-medium", className)}
        >
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
            </div>
            {showText && <span>{siteConfig.name}</span>}
        </Link>
    )
}
