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
  title: "Terms of Service",
  description: "Our terms of service and usage policies",
}

export default function TermsPage() {
  return (
    <SplitLayout imageAlt="Terms of Service" childrenWrapperClassName="max-w-md">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Terms of Service</CardTitle>
            <CardDescription>
              Last updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold">Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By accessing and using AFENDA, you accept and agree to be bound by the terms
                  and provision of this agreement.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Use License</h3>
                <p className="text-muted-foreground">
                  Permission is granted to temporarily download one copy of AFENDA for personal,
                  non-commercial transitory viewing only. This is the grant of a license, not a
                  transfer of title.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Disclaimer</h3>
                <p className="text-muted-foreground">
                  The information on AFENDA is provided on an as is basis. To the fullest extent
                  permitted by law, this Company excludes all representations and warranties.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Limitations</h3>
                <p className="text-muted-foreground">
                  In no event shall this Company or its suppliers be liable for any damages (including,
                  without limitation, damages for loss of data or profit, or due to business interruption)
                  arising out of the use or inability to use AFENDA.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Privacy Policy</h3>
                <p className="text-muted-foreground">
                  Your Privacy Policy governs your use of AFENDA and you agree to be bound by its terms.
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Revisions and Errata</h3>
                <p className="text-muted-foreground">
                  The materials appearing on AFENDA could include technical, typographical, or photographic
                  errors. We do not promise that any of the materials on its website are accurate, complete,
                  or current.
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
