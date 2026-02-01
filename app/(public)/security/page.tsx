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
import { Separator } from "@/components/ui/separator"
import { routes } from "@/lib/routes"
import Link from "next/link"
import { Shield, Lock, CheckCircle2, Database, FileKey, Activity, HardDrive } from "lucide-react"

export const metadata: Metadata = {
  title: "Security Declaration - AFENDA",
  description: "Comprehensive security and compliance declaration for AFENDA, built on Neon serverless PostgreSQL with SOC 2, HIPAA, GDPR, and CCPA compliance",
}

export default function SecurityPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <div className="w-full">
        <Card>
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl">Security Declaration</CardTitle>
            <CardDescription>
              Defense-in-depth security, compliance, and resilience practices for AFENDA on Neon serverless PostgreSQL.
            </CardDescription>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" /> SOC 2 Type II
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" /> HIPAA
              </Badge>
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> GDPR
              </Badge>
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> CCPA
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Database className="h-3 w-3" /> Neon PostgreSQL
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Zero-Trust Access</h3>
                <p className="text-muted-foreground mt-2">
                  RBAC, RLS, and short‑lived tokens enforce least‑privilege access across tenants and services.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Encrypted by Default</h3>
                <p className="text-muted-foreground mt-2">
                  AES‑256 encryption at rest and TLS 1.3 in transit protect data across storage and network paths.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Operational Resilience</h3>
                <p className="text-muted-foreground mt-2">
                  Automated backups, PITR, and documented recovery objectives support business continuity.
                </p>
              </div>
            </section>
            {/* Compliance Certifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Compliance Certifications</h3>
              </div>
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SOC 2 Type II</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Independent attestation covering:</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Security controls</li>
                      <li>Availability guarantees</li>
                      <li>Processing integrity</li>
                      <li>Confidentiality measures</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">HIPAA Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Healthcare data protection with:</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Business Associate Agreement (BAA) available</li>
                      <li>ePHI encryption and access controls</li>
                      <li>Audit logging and monitoring</li>
                      <li>Incident response procedures</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">GDPR Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>EU data protection compliance:</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Data residency in Singapore (ap-southeast-1)</li>
                      <li>Right to access, rectification, erasure</li>
                      <li>Data portability and objection</li>
                      <li>Privacy by design and default</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">CCPA Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>California consumer privacy:</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Right to know data collected</li>
                      <li>Right to delete personal information</li>
                      <li>Opt-out of data sales</li>
                      <li>Non-discrimination guarantees</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Encryption Standards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Encryption Standards</h3>
              </div>
              <Separator />
              
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Data at Rest</h4>
                  <p className="text-muted-foreground">
                    <strong>AES-256 encryption</strong> for all database storage. Data is encrypted at the block level using
                    industry-standard algorithms with controlled key access and rotation.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Data in Transit</h4>
                  <p className="text-muted-foreground">
                    <strong>TLS 1.3 encryption</strong> for all network communications. Client and internal service connections
                    are encrypted using strong cipher suites.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Key Management</h4>
                  <p className="text-muted-foreground">
                    Encryption keys are managed using AWS KMS with automated rotation schedules and strict access controls.
                    Keys are stored separately from encrypted data.
                  </p>
                </div>
              </div>
            </div>

            {/* Authentication & Access Control */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileKey className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Authentication & Access Control</h3>
              </div>
              <Separator />
              
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">OAuth 2.0 Authentication</h4>
                  <p className="text-muted-foreground">
                    Secure authentication using industry-standard OAuth 2.0 with support for Google and GitHub identity providers.
                    JWTs are short-lived with refresh mechanisms.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Role-Based Access Control (RBAC)</h4>
                  <p className="text-muted-foreground">
                    Granular permissions management with predefined roles and custom role creation. The principle of least privilege
                    is enforced across all system components.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Row-Level Security (RLS)</h4>
                  <p className="text-muted-foreground">
                    PostgreSQL RLS policies ensure users can only access their authorized data. Policies are enforced at the database
                    layer, providing defense in depth.
                  </p>
                </div>
              </div>
            </div>

            {/* Audit & Monitoring */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Audit Logging & Monitoring</h3>
              </div>
              <Separator />
              
              <div className="rounded-lg border p-4 text-sm">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>90-day audit log retention</strong> - All authentication attempts, data access, and modifications logged</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Real-time monitoring</strong> - Continuous security monitoring with automated alerts for suspicious activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Full activity tracking</strong> - Complete audit trail of user actions, API calls, and system events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Compliance reporting</strong> - Automated compliance reports for HIPAA, GDPR, and SOC 2 requirements</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Backup & Disaster Recovery */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-cyan-600" />
                <h3 className="text-lg font-semibold">Backup & Disaster Recovery</h3>
              </div>
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4 text-sm">
                  <h4 className="font-semibold mb-2">Automated Backups</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Hourly automated snapshots</li>
                    <li>• 7-day point-in-time recovery (PITR)</li>
                    <li>• Continuous Write-Ahead Logging (WAL)</li>
                    <li>• Cross-region backup replication</li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4 text-sm">
                  <h4 className="font-semibold mb-2">Recovery Objectives</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• RTO (Recovery Time Objective): &lt; 1 hour</li>
                    <li>• RPO (Recovery Point Objective): &lt; 5 minutes</li>
                    <li>• Data durability: 99.999999999% (11 nines)</li>
                    <li>• Tested disaster recovery procedures</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Neon Capacity & Infrastructure */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold">Infrastructure Capacity</h3>
              </div>
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-3 text-sm">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">32.2 MB</div>
                  <div className="text-muted-foreground">Current Storage</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">0.25-2 CU</div>
                  <div className="text-muted-foreground">Auto-scaling Compute</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">1000+</div>
                  <div className="text-muted-foreground">Pooled Connections</div>
                </div>
              </div>

              <div className="rounded-lg border p-4 text-sm">
                <h4 className="font-semibold mb-2">Region & Availability</h4>
                <p className="text-muted-foreground">
                  <strong>ap-southeast-1 (Singapore)</strong> - Data residency in AWS Singapore region with 99.9% uptime SLA. Multi-AZ deployment for high availability and automatic failover.
                </p>
              </div>
            </div>

            {/* Responsible Disclosure */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold">Vulnerability Disclosure</h3>
              </div>
              <Separator />
              <div className="rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground">
                  We welcome responsible disclosure of security issues. Please report findings to
                  <a className="underline ml-1" href="mailto:security@nexuscanon.com">security@nexuscanon.com</a> with
                  sufficient detail for triage.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-4">
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
