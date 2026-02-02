/**
 * @domain orchestra
 * @layer ui
 * @responsibility UI route entrypoint for /app/analytics
 */

"use client"

import { useEffect, useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import {
  TrendingUp,
  Calendar,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/client/hooks/use-auth"
import { useAnalyticsStore } from "@/lib/client/store/analytics"
import type { AnalyticsTimeRange } from "@/lib/contracts/analytics"

const COLORS = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  primary: "#3b82f6",
  secondary: "#64748b",
}

const TIME_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
  { value: "all_time", label: "All Time" },
] as const

export default function AnalyticsPage() {
  const auth = useAuth()
  const {
    analytics,
    quickStats,
    insights,
    loading,
    error,
    currentTimeRange,
    setTimeRange,
    fetchAnalytics,
    refreshAll
  } = useAnalyticsStore()

  const [activeTab, setActiveTab] = useState("overview")

  // Load data on mount and when time range changes
  useEffect(() => {
    if (auth?.userId) {
      refreshAll(auth.userId)
    }
  }, [auth?.userId, refreshAll])

  useEffect(() => {
    if (auth?.userId) {
      fetchAnalytics(auth.userId, { timeRange: currentTimeRange })
    }
  }, [currentTimeRange, auth?.userId, fetchAnalytics])

  if (!auth || !auth.userId) {
    return (
      <div className="space-y-4">
        <Alert>
          <Spinner className="h-5 w-5" />
          <AlertDescription>Loading authentication...</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleTimeRangeChange = (value: AnalyticsTimeRange) => {
    setTimeRange(value)
  }

  const handleRefresh = () => {
    if (auth?.userId) {
      refreshAll(auth.userId)
    }
  }

  if (loading && !analytics) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Analytics</h1>
          <Button variant="outline" size="sm" disabled>
            <Spinner className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-20">
          <Spinner className="size-8" />
          Loading analytics...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Analytics</h1>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track your productivity and task management insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={currentTimeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            {loading ? <Spinner className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {quickStats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-xs sm:text-sm font-medium">Completed Today</span>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold">{quickStats.tasksCompletedToday}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium">Due Today</span>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold">{quickStats.tasksDueToday}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                <span className="text-xs sm:text-sm font-medium">Overdue</span>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold">{quickStats.overdueTasksCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <span className="text-xs sm:text-sm font-medium">Productivity</span>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold">{quickStats.productivityScore}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-xs sm:text-sm font-medium">Streak</span>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold">{quickStats.streakDays} days</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights */}
      {insights && insights.insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Insights
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.insights.map(insight => (
              <Alert key={insight.id} variant={insight.severity === "high" ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-sm">{insight.description}</div>
                    {insight.actionable && insight.actionUrl && (
                      <Button variant="outline" size="sm" className="mt-2" asChild>
                        <a href={insight.actionUrl}>{insight.actionText}</a>
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Main Analytics */}
      {analytics ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <div className="space-y-4 sm:space-y-6 mt-6">
            {activeTab === "overview" && (
              <>
                {/* Task Metrics */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Task Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Total Tasks</div>
                            <div className="text-2xl font-bold">{analytics.taskMetrics.totalTasks}</div>
                          </div>
                          <div>
                            <div className="font-medium">Completion Rate</div>
                            <div className="text-2xl font-bold">{analytics.taskMetrics.completionRate.toFixed(1)}%</div>
                          </div>
                        </div>

                        {/* Priority Distribution Pie Chart */}
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Urgent', value: analytics.priorityDistribution.urgent.count, color: COLORS.urgent },
                                  { name: 'High', value: analytics.priorityDistribution.high.count, color: COLORS.high },
                                  { name: 'Medium', value: analytics.priorityDistribution.medium.count, color: COLORS.medium },
                                  { name: 'Low', value: analytics.priorityDistribution.low.count, color: COLORS.low },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {Object.values(analytics.priorityDistribution).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Average Completion Time</span>
                            <span className="font-medium">{analytics.taskMetrics.averageCompletionTime.toFixed(1)}h</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Tasks Created Today</span>
                            <span className="font-medium">{analytics.taskMetrics.tasksCreatedToday}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Tasks Completed Today</span>
                            <span className="font-medium">{analytics.taskMetrics.tasksCompletedToday}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Overdue Tasks</span>
                            <span className="font-medium text-orange-600">{analytics.taskMetrics.overdueTasksCount}</span>
                          </div>
                        </div>

                        {/* Status Distribution */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Status Breakdown</div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>To Do</span>
                              <span>{analytics.taskMetrics.todoTasks}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>In Progress</span>
                              <span>{analytics.taskMetrics.inProgressTasks}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Done</span>
                              <span className="text-green-600">{analytics.taskMetrics.completedTasks}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Cancelled</span>
                              <span className="text-red-600">{analytics.taskMetrics.cancelledTasks}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Trends Tab */}
            {activeTab === "trends" && analytics.productivityTrends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5" />
                    Productivity Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.productivityTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          labelFormatter={(value) => new Date(value as string).toLocaleDateString()}
                          formatter={(value, name) => [
                            value as string,
                            name === 'tasksCreated' ? 'Created' : name === 'tasksCompleted' ? 'Completed' : 'Completion Rate'
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="tasksCreated"
                          stackId="1"
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.6}
                        />
                        <Area
                          type="monotone"
                          dataKey="tasksCompleted"
                          stackId="1"
                          stroke={COLORS.secondary}
                          fill={COLORS.secondary}
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && analytics.projectAnalytics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Project Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.projectAnalytics.map(project => (
                      <div key={project.projectId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: project.projectColor || COLORS.primary }}
                          />
                          <div>
                            <div className="font-medium">{project.projectName}</div>
                            <div className="text-sm text-muted-foreground">
                              {project.taskCount} tasks • {project.completionRate.toFixed(1)}% complete
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{project.completedTasks}/{project.taskCount}</div>
                          <div className="text-xs text-muted-foreground">
                            {project.averageTaskDuration.toFixed(1)}h avg
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Tabs>
      ) : (
        <Empty className="p-8 sm:p-12">
          <EmptyHeader>
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <EmptyTitle>No analytics data available</EmptyTitle>
            <EmptyDescription>
              Start creating tasks to see your productivity insights here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

