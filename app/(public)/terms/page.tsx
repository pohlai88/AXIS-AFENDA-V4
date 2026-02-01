import type { Metadata } from "next"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { routes } from "@/lib/routes"
import Link from "next/link"
import { Shield, Database, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service - AFENDA",
  description: "Terms of service, acceptable use policy, and SLA for enterprise-grade workflow platform on Neon PostgreSQL",
}

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="w-full">
        <Card>
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-2xl">Terms of Service</CardTitle>
            <CardDescription>
              Effective date: {new Date().toLocaleDateString()} · Clear usage, availability, and responsibility terms for enterprise workflows.
            </CardDescription>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" /> Enterprise-Grade
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Database className="h-3 w-3" /> 32.2 MB Storage
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" /> Auto-scaling
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-8">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Service Access</h3>
                <p className="text-muted-foreground mt-2">
                  Access to AFENDA is provided under your organization’s subscription or order form and subject to these terms.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Reliability Commitments</h3>
                <p className="text-muted-foreground mt-2">
                  We operate with defined availability and recovery targets, backed by tested backup and restore procedures.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Responsible Use</h3>
                <p className="text-muted-foreground mt-2">
                  Customers must use the platform lawfully, protect credentials, and avoid actions that degrade service quality.
                </p>
              </div>
            </section>
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold">Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By accessing or using AFENDA, you agree to these terms. AFENDA is an enterprise workflow orchestration
                  platform built on Neon serverless PostgreSQL and designed for secure, auditable operations.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Service Description</h3>
                <p className="text-muted-foreground">
                  AFENDA provides workflow orchestration services with the following infrastructure profile:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  <li><strong>Database:</strong> Neon serverless PostgreSQL (32.2 MB storage)</li>
                  <li><strong>Compute:</strong> Auto-scaling (0.25-2 CU)</li>
                  <li><strong>Connections:</strong> 1000+ pooled connections</li>
                  <li><strong>Backups:</strong> Hourly snapshots with 7-day PITR</li>
                  <li><strong>Region:</strong> ap-southeast-1 (Singapore)</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold">Service Level Agreement (SLA)</h3>
                <p className="text-muted-foreground">
                  We provide the following service targets:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  <li><strong>Uptime:</strong> 99.9% monthly uptime guarantee</li>
                  <li><strong>Recovery Time Objective (RTO):</strong> &lt; 1 hour</li>
                  <li><strong>Recovery Point Objective (RPO):</strong> &lt; 5 minutes</li>
                  <li><strong>Data Durability:</strong> 99.999999999% (11 nines)</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold">Acceptable Use Policy</h3>
                <p className="text-muted-foreground">You agree not to:</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Violate any laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Transmit malware or harmful code</li>
                  <li>Attempt to gain unauthorized access to systems</li>
                  <li>Interfere with service availability for other users</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold">Customer Responsibilities</h3>
                <p className="text-muted-foreground">
                  You are responsible for account security, appropriate access provisioning, and the legality of content and workflows
                  executed on the platform. You must promptly notify us of any unauthorized use.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Data Ownership & Backup</h3>
                <p className="text-muted-foreground">
                  You retain ownership of all data you submit to AFENDA. We provide:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  <li><strong>Automated Backups:</strong> Hourly snapshots</li>
                  <li><strong>Point-in-Time Recovery:</strong> 7-day window</li>
                  <li><strong>Data Export:</strong> Available upon request</li>
                  <li><strong>Deletion:</strong> Complete within 30 days of account closure</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold">Security & Compliance</h3>
                <p className="text-muted-foreground">
                  Our infrastructure is compliant with:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  <li><strong>SOC 2 Type II:</strong> Security, availability, integrity</li>
                  <li><strong>HIPAA:</strong> Business Associate Agreement available</li>
                  <li><strong>GDPR:</strong> Data protection and privacy rights</li>
                  <li><strong>CCPA:</strong> California consumer privacy compliance</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold">Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  In no event shall AFENDA be liable for any indirect, incidental, special, consequential,
                  or punitive damages, including loss of profits, data, or business interruption.
                  Our total liability is limited to the fees paid in the 12 months preceding the claim.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Service Modifications</h3>
                <p className="text-muted-foreground">
                  We may modify the service with advance notice when reasonably possible. Where changes materially impact usage,
                  we will provide guidance and data export mechanisms for affected users.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Support & Communication</h3>
                <p className="text-muted-foreground">
                  Operational notices and security communications may be delivered via email or in-product notifications. For support,
                  contact <a className="underline" href="mailto:support@nexuscanon.com">support@nexuscanon.com</a>.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Termination</h3>
                <p className="text-muted-foreground">
                  You may terminate your account at any time. We may suspend or terminate accounts that
                  violate these terms. Upon termination, your data will be retained for 30 days before permanent deletion.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Governing Law</h3>
                <p className="text-muted-foreground">
                  These terms are governed by the laws of the jurisdiction where our servers are located
                  (Singapore, ap-southeast-1). Disputes will be resolved through arbitration.
                </p>
              </section>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={routes.app.root()}>Go to AFENDA</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/infrastructure">View Infrastructure Details</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={routes.privacy()}>Privacy Policy</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
