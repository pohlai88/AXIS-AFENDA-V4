import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { routes } from "@/lib/routes"
import { authViewPaths } from "@neondatabase/auth/react/ui/server"
import { AlertCircleIcon } from "lucide-react"
import Link from "next/link"
import { AuthShell } from "../../_components/auth-shell"

export default function UnauthorizedPage() {
  return (
    <AuthShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Unauthorized</AlertTitle>
            <AlertDescription>
              You don’t have permission to access this area. If you believe this is a mistake, contact your administrator.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={routes.home()}>Go home</Link>
            </Button>
            <Button asChild>
              <Link href={`/auth/${authViewPaths.SIGN_IN}`}>Sign in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
