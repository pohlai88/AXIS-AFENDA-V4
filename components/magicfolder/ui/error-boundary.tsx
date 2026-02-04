/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Error boundary for magicfolder components
 * Prevents errors in one component from crashing the entire page
 */

"use client"

import React, { Component, type ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  className?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class MagicfolderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MagicfolderErrorBoundary caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className={cn("border-destructive/50", this.props.className)}>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Something Went Wrong</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {this.state.error?.message || 
                  "An error occurred while rendering this component. Please try again."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={this.handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Functional wrapper for error boundary with common magicfolder styling
 */
export function withMagicfolderErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return function WithErrorBoundary(props: P) {
    return (
      <MagicfolderErrorBoundary onError={onError}>
        <Component {...props} />
      </MagicfolderErrorBoundary>
    )
  }
}
