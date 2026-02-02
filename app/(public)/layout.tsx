import type { Metadata } from "next"
import Link from "next/link"
import { siteConfig } from "@/lib/config/site"
import { Separator } from "@/components/ui/separator"
import { GitBranch, Zap, Clock, Network } from "lucide-react"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Company Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">AFENDA</h3>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  MACHINA VITAE — Orchestrator of Chaos
                </p>
                <p className="text-xs text-muted-foreground">
                  Ordo ex Confusione • Ex Vita, Structura
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                © {currentYear} AFENDA. All rights reserved.
              </p>
            </div>

            {/* Security & Compliance */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Security & Compliance</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">•</span>
                  <span>SOC 2 Type II Certified</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">•</span>
                  <span>HIPAA Compliant</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">•</span>
                  <span>GDPR & CCPA Ready</span>
                </li>
              </ul>
            </div>

            {/* Platform Features */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Platform</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <GitBranch className="h-3 w-3 text-violet-600" />
                  <span>Instant Branching</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-yellow-600" />
                  <span>Autoscaling</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-green-600" />
                  <span>Scale to Zero</span>
                </li>
                <li className="flex items-center gap-2">
                  <Network className="h-3 w-3 text-pink-600" />
                  <span>Read Replicas</span>
                </li>
              </ul>
            </div>

            {/* Resources & Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Resources</h3>
              <nav className="flex flex-col gap-2 text-xs">
                <Link
                  href={routes.ui.marketing.privacy()}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </Link>
                <Link
                  href={routes.ui.marketing.terms()}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/security"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Security Declaration
                </Link>
                <Link
                  href="/infrastructure"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Infrastructure
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <Separator />
        <div className="mx-auto w-full max-w-7xl px-6 py-3">
          <p className="text-center text-xs text-muted-foreground">
            NexusCanon • Protect • Detect • React •
          </p>
        </div>
      </footer>
    </div>
  )
}
