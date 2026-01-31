import type { Metadata } from "next"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { routes } from "@/lib/routes"
import { SplitLayout } from "../_components/split-layout"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Our privacy policy and data protection practices",
}

export default function PrivacyPage() {
  return (
    <SplitLayout imageAlt="Privacy" childrenWrapperClassName="max-w-md">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
            <CardDescription>
              Last updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold">Information We Collect</h3>
                <p className="text-muted-foreground">
                  We collect information you provide directly to us, such as when you create an account,
                  use our services, or contact us for support.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">How We Use Your Information</h3>
                <p className="text-muted-foreground">
                  We use the information we collect to provide, maintain, and improve our services,
                  process transactions, and communicate with you.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Information Sharing</h3>
                <p className="text-muted-foreground">
                  We do not sell, trade, or otherwise transfer your personal information to third parties
                  without your consent, except as described in this policy.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Data Security</h3>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your
                  personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Your Rights</h3>
                <p className="text-muted-foreground">
                  You have the right to access, update, or delete your personal information.
                  You can manage your account settings or contact us for assistance.
                </p>
              </section>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline">
                <Link href={routes.register()}>Back to sign up</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={routes.login()}>Sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SplitLayout>
  )
}
