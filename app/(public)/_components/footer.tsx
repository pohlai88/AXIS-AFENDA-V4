import Link from "next/link"
import { Shield, Lock, CheckCircle2, Database, Zap, BarChart3, GitBranch, Clock, Network, FileText, Scroll, HardDrive } from "lucide-react"
import { routes } from "@/lib/routes"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { HoverPrefetchLink } from "@/components/hover-prefetch-link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  // Neon Platform Features
  const neonFeatures = {
    branching: "Instant Branching",
    autoscaling: "Autoscaling",
    scaleToZero: "Scale to Zero",
    pitr: "7-30 Day PITR",
    replicas: "Read Replicas",
    pooling: "Connection Pooling",
  }

  return (
    <footer className="border-t bg-muted/30">
      {/* Main Footer Content */}
      <div className="mx-auto w-full max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">AFENDA</h3>
            <p className="text-xs text-muted-foreground">
              Enterprise-grade workflow orchestration platform built on Neon serverless PostgreSQL.
            </p>
            <p className="text-xs text-muted-foreground">
              © {currentYear} AFENDA. All rights reserved.
            </p>
          </div>

          {/* Security & Compliance */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Security & Compliance</h3>
            <div className="space-y-3">
              <HoverPrefetchLink href="/security" className="flex items-start gap-2 hover:opacity-80 transition-opacity">
                <Shield className="h-4 w-4 flex-shrink-0 text-green-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">SOC 2 Type II</p>
                  <p className="text-muted-foreground">
                    Security, availability & integrity
                  </p>
                </div>
              </HoverPrefetchLink>
              <HoverPrefetchLink href="/security" className="flex items-start gap-2 hover:opacity-80 transition-opacity">
                <Lock className="h-4 w-4 flex-shrink-0 text-blue-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">HIPAA Compliant</p>
                  <p className="text-muted-foreground">
                    PHI encryption & BAA available
                  </p>
                </div>
              </HoverPrefetchLink>
              <HoverPrefetchLink href="/security" className="flex items-start gap-2 hover:opacity-80 transition-opacity">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-purple-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">GDPR & CCPA</p>
                  <p className="text-muted-foreground">
                    Data residency & deletion rights
                  </p>
                </div>
              </HoverPrefetchLink>
            </div>
          </div>

          {/* Neon Platform Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Platform Features</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <GitBranch className="h-4 w-4 flex-shrink-0 text-violet-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">{neonFeatures.branching}</p>
                  <p className="text-muted-foreground">Copy-on-write database clones</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 flex-shrink-0 text-yellow-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">{neonFeatures.autoscaling}</p>
                  <p className="text-muted-foreground">Min/max CU auto-scaling</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 flex-shrink-0 text-green-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">{neonFeatures.scaleToZero}</p>
                  <p className="text-muted-foreground">~500ms cold start</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resources & Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Resources</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 flex-shrink-0 text-slate-600 mt-0.5" />
                <HoverPrefetchLink
                  href={routes.ui.marketing.privacy()}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </HoverPrefetchLink>
              </div>
              <div className="flex items-start gap-2">
                <Scroll className="h-4 w-4 flex-shrink-0 text-slate-600 mt-0.5" />
                <HoverPrefetchLink
                  href={routes.ui.marketing.terms()}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of Service
                </HoverPrefetchLink>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 flex-shrink-0 text-slate-600 mt-0.5" />
                <HoverPrefetchLink
                  href="/security"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Security Declaration
                </HoverPrefetchLink>
              </div>
              <div className="flex items-start gap-2">
                <HardDrive className="h-4 w-4 flex-shrink-0 text-slate-600 mt-0.5" />
                <HoverPrefetchLink
                  href="/infrastructure"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Infrastructure Details
                </HoverPrefetchLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Neon Platform Bar */}
      <Separator />
      <div className="mx-auto w-full max-w-7xl px-6 py-4 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20">
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold text-foreground">
            ⚡ Powered by Neon Serverless PostgreSQL
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <Badge variant="secondary" className="gap-1">
              <GitBranch className="h-3 w-3" />
              {neonFeatures.branching}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              {neonFeatures.autoscaling}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {neonFeatures.scaleToZero}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Network className="h-3 w-3" />
              {neonFeatures.replicas}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Database className="h-3 w-3" />
              {neonFeatures.pooling}
            </Badge>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <Separator />
      <div className="mx-auto w-full max-w-7xl px-6 py-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-muted-foreground">
            Secure. Compliant. Enterprise-ready.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <HoverPrefetchLink
              href={routes.ui.marketing.privacy()}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </HoverPrefetchLink>
            <span className="text-muted-foreground">•</span>
            <HoverPrefetchLink
              href={routes.ui.marketing.terms()}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms
            </HoverPrefetchLink>
            <span className="text-muted-foreground">•</span>
            <HoverPrefetchLink
              href="/security"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Security
            </HoverPrefetchLink>
            <span className="text-muted-foreground">•</span>
            <HoverPrefetchLink
              href="/infrastructure"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Infrastructure
            </HoverPrefetchLink>
          </nav>
        </div>
      </div>
    </footer>
  )
}
