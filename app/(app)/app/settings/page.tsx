import { redirect } from "next/navigation"
import { routes } from "@/lib/routes"

/**
 * Settings index page - redirects to Design System by default
 */
export default function SettingsPage() {
  redirect(routes.ui.settings.designSystem())
}
