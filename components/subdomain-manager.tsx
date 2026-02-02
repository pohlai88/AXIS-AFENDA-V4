"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, CheckCircle } from "lucide-react"
import { routes } from "@/lib/routes"

interface SubdomainConfig {
  id: string
  subdomain: string
  isPrimary: boolean
  isActive: boolean
  createdAt: string
}

interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
  }
}

export function SubdomainManager() {
  const [subdomains, setSubdomains] = useState<SubdomainConfig[]>([])
  const [newSubdomain, setNewSubdomain] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadSubdomains()
  }, [])

  async function loadSubdomains() {
    try {
      setLoading(true)
      setError(null)

      const endpoint = routes.api.v1.tenancy.subdomains.list()
      const response = await fetch(endpoint)
      const result: ApiResponse<SubdomainConfig[]> = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || "Failed to load subdomains")
      }

      setSubdomains(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddSubdomain(e: React.FormEvent) {
    e.preventDefault()
    if (!newSubdomain.trim()) return

    try {
      setError(null)
      setSuccess(null)
      setLoading(true)

      const endpoint = routes.api.v1.tenancy.subdomains.create()
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: newSubdomain.toLowerCase(),
          isPrimary: subdomains.length === 0,
        }),
      })

      const result: ApiResponse<SubdomainConfig> = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || "Failed to create subdomain")
      }

      if (result.data) {
        setSubdomains([...subdomains, result.data])
        setNewSubdomain("")
        setSuccess(`Subdomain &quot;${newSubdomain}&quot; created successfully`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  async function handleSetPrimary(id: string) {
    try {
      setError(null)
      setSuccess(null)

      const endpoint = routes.api.v1.tenancy.subdomains.update()
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isPrimary: true }),
      })

      const result: ApiResponse<SubdomainConfig> = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || "Failed to update subdomain")
      }

      if (result.data) {
        const updatedConfig = result.data
        setSubdomains(
          subdomains.map((s) =>
            s.id === id ? updatedConfig : { ...s, isPrimary: false }
          )
        )
        setSuccess("Primary subdomain updated")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      setError(null)
      setSuccess(null)

      const endpoint = routes.api.v1.tenancy.subdomains.update()
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      })

      const result: ApiResponse<SubdomainConfig> = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || "Failed to update subdomain")
      }

      if (result.data) {
        const updatedConfig = result.data
        setSubdomains(subdomains.map((s) => (s.id === id ? updatedConfig : s)))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  async function handleDelete(id: string, subdomain: string) {
    if (!confirm(`Delete subdomain &quot;${subdomain}&quot;?`)) return

    try {
      setError(null)
      setSuccess(null)

      const endpoint = routes.api.v1.tenancy.subdomains.delete()
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      const result: ApiResponse<void> = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || "Failed to delete subdomain")
      }

      setSubdomains(subdomains.filter((s) => s.id !== id))
      setSuccess(`Subdomain &quot;${subdomain}&quot; deleted`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Subdomains</CardTitle>
          <CardDescription>
            Create custom subdomains for your organization&apos;s multi-tenant setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSubdomain} className="flex gap-2">
            <Input
              placeholder="e.g., tenant1"
              value={newSubdomain}
              onChange={(e) => setNewSubdomain(e.target.value)}
              disabled={loading}
              pattern="^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$"
              title="Lowercase letters, numbers, and hyphens only"
            />
            <Button type="submit" disabled={loading || !newSubdomain.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Subdomain
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Subdomains</CardTitle>
          <CardDescription>
            Manage your organization&apos;s custom subdomains and routing configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && subdomains.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : subdomains.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No subdomains configured yet. Add your first subdomain above.
            </p>
          ) : (
            <div className="space-y-3">
              {subdomains.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">
                          {config.subdomain}.nexuscanon.com
                        </span>
                        {config.isPrimary && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Primary
                          </Badge>
                        )}
                        {!config.isActive && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(config.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!config.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(config.id)}
                        disabled={loading}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant={config.isActive ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => handleToggleActive(config.id, config.isActive)}
                      disabled={loading}
                    >
                      {config.isActive ? "Active" : "Inactive"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(config.id, config.subdomain)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">DNS Configuration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            Add a wildcard CNAME record to your DNS provider:
          </p>
          <div className="bg-white p-3 rounded border border-blue-200 font-mono text-xs overflow-x-auto">
            &lt;subdomain&gt;.nexuscanon.com CNAME cname.vercel-dns.com
          </div>
          <p className="text-muted-foreground">
            Or use &lt;Vercel IP&gt; addresses if your DNS provider doesn&apos;t support CNAME for subdomains.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
