"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Calendar,
  Flag,
  Folder,
  Clock,
  MoreHorizontal
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { TASK_FILTERING_UI } from "@/lib/constants"
import type {
  AdvancedTaskFilters,
  SearchFilter,
  DateRangeFilter,
  MultiSelectFilter
} from "@/lib/contracts/tasks"
import { TASK_STATUS, TASK_PRIORITY } from "@/lib/contracts/tasks"

type DateRangeValue = string | null | undefined
type IncludeMode = 'any' | 'all' | 'none'
type RelativeRange = "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "this_quarter" | "last_quarter" | "this_year" | "last_year" | "overdue" | "due_today" | "due_this_week" | "due_this_month" | undefined

interface AdvancedFiltersProps {
  filters: AdvancedTaskFilters
  onFiltersChange: (filters: AdvancedTaskFilters) => void
  onClear: () => void
  facets?: {
    statusCounts: Record<string, number>
    priorityCounts: Record<string, number>
    projectCounts: Record<string, number>
    tagCounts: Record<string, number>
    totalCount: number
  }
  projects?: Array<{ id: string; name: string; color?: string }>
  className?: string
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onClear,
  facets,
  projects = [],
  className
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof AdvancedTaskFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value
    } as AdvancedTaskFilters)
  }

  const updateSearchFilter = (search: SearchFilter) => {
    updateFilter('search', search)
  }

  const updateDateRangeFilter = (field: 'createdDate' | 'dueDate' | 'completedDate', dateRange: DateRangeFilter) => {
    updateFilter(field, dateRange)
  }

  const updateMultiSelectFilter = (field: 'status' | 'priority' | 'tags' | 'projects', multiSelect: MultiSelectFilter) => {
    updateFilter(field, multiSelect)
  }

  const hasActiveFilters = Boolean(
    filters.search?.query ||
    filters.createdDate?.relativeRange ||
    filters.dueDate?.relativeRange ||
    filters.completedDate?.relativeRange ||
    filters.status?.values?.length ||
    filters.priority?.values?.length ||
    filters.tags?.values?.length ||
    filters.projects?.values?.length ||
    filters.hasDueDate !== undefined ||
    filters.isOverdue !== undefined ||
    filters.hasRecurrence !== undefined ||
    filters.hasDescription !== undefined ||
    filters.hasTags !== undefined
  )

  const activeFilterCount = [
    filters.search?.query ? 1 : 0,
    filters.createdDate?.relativeRange ? 1 : 0,
    filters.dueDate?.relativeRange ? 1 : 0,
    filters.completedDate?.relativeRange ? 1 : 0,
    filters.status?.values?.length || 0,
    filters.priority?.values?.length || 0,
    filters.tags?.values?.length || 0,
    filters.projects?.values?.length || 0,
    filters.hasDueDate !== undefined ? 1 : 0,
    filters.isOverdue !== undefined ? 1 : 0,
    filters.hasRecurrence !== undefined ? 1 : 0,
    filters.hasDescription !== undefined ? 1 : 0,
    filters.hasTags !== undefined ? 1 : 0
  ].reduce((sum, count) => sum + count, 0)

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">{TASK_FILTERING_UI.SECTION_LABELS.QUICK_FILTERS}</CardTitle>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onClear()
                    }}
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-96">
              <div className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search
                  </Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Search tasks..."
                      value={filters.search?.query || ''}
                      onChange={(e) => updateSearchFilter({
                        ...filters.search,
                        query: e.target.value,
                        fields: filters.search?.fields || ['all'],
                        matchType: filters.search?.matchType || 'contains'
                      })}
                    />
                    <div className="flex gap-2 text-xs">
                      <Select
                        value={filters.search?.fields?.[0] || 'all'}
                        onValueChange={(value) => updateSearchFilter({
                          ...filters.search,
                          fields: [value as 'title' | 'description' | 'tags' | 'all'],
                          query: filters.search?.query || '',
                          matchType: filters.search?.matchType || 'contains'
                        })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Fields</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="description">Description</SelectItem>
                          <SelectItem value="tags">Tags</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.search?.matchType || 'contains'}
                        onValueChange={(value) => updateSearchFilter({
                          ...filters.search,
                          matchType: value as 'contains' | 'exact' | 'fuzzy',
                          query: filters.search?.query || '',
                          fields: filters.search?.fields || ['all']
                        })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="exact">Exact</SelectItem>
                          <SelectItem value="fuzzy">Fuzzy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Date Ranges */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Ranges
                  </Label>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    <Select
                      value={filters.dueDate?.relativeRange || ''}
                      onValueChange={(value) => {
                        if (value === '') {
                          updateDateRangeFilter('dueDate', {})
                        } else {
                          updateDateRangeFilter('dueDate', {
                            relativeRange: value as 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'overdue' | 'due_today' | 'due_this_week' | 'due_this_month'
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select range..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="due_today">Due Today</SelectItem>
                        <SelectItem value="due_this_week">Due This Week</SelectItem>
                        <SelectItem value="due_this_month">Due This Month</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="today">Created Today</SelectItem>
                        <SelectItem value="this_week">Created This Week</SelectItem>
                        <SelectItem value="this_month">Created This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Created Date */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Created Date</Label>
                    <Select
                      value={filters.createdDate?.relativeRange || ''}
                      onValueChange={(value: DateRangeValue) => updateDateRangeFilter('createdDate', {
                        relativeRange: value as RelativeRange || undefined
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select range..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="this_week">This Week</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_week">Last Week</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="space-y-2">
                    {Object.values(TASK_STATUS).map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status?.values?.includes(status) || false}
                          onCheckedChange={(checked) => {
                            const currentValues = filters.status?.values || []
                            const newValues = checked
                              ? [...currentValues, status]
                              : currentValues.filter(v => v !== status)

                            updateMultiSelectFilter('status', {
                              values: newValues,
                              includeMode: filters.status?.includeMode || 'any'
                            })
                          }}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm capitalize">
                          {status.replace('_', ' ')}
                          {facets?.statusCounts?.[status] && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {facets.statusCounts[status]}
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Status include mode */}
                  {filters.status?.values && filters.status.values.length > 1 && (
                    <Select
                      value={filters.status?.includeMode || 'any'}
                      onValueChange={(value: IncludeMode) => updateMultiSelectFilter('status', {
                        values: filters.status?.values || [],
                        includeMode: value
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Match Any</SelectItem>
                        <SelectItem value="all">Match All</SelectItem>
                        <SelectItem value="none">Exclude All</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Separator />

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Priority
                  </Label>
                  <div className="space-y-2">
                    {Object.values(TASK_PRIORITY).map(priority => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={`priority-${priority}`}
                          checked={filters.priority?.values?.includes(priority) || false}
                          onCheckedChange={(checked) => {
                            const currentValues = filters.priority?.values || []
                            const newValues = checked
                              ? [...currentValues, priority]
                              : currentValues.filter(v => v !== priority)

                            updateMultiSelectFilter('priority', {
                              values: newValues,
                              includeMode: filters.priority?.includeMode || 'any'
                            })
                          }}
                        />
                        <Label htmlFor={`priority-${priority}`} className="text-sm capitalize">
                          {priority}
                          {facets?.priorityCounts?.[priority] && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {facets.priorityCounts[priority]}
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Projects */}
                {projects.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Projects
                    </Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {projects.map(project => (
                        <div key={project.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`project-${project.id}`}
                            checked={filters.projects?.values?.includes(project.id) || false}
                            onCheckedChange={(checked) => {
                              const currentValues = filters.projects?.values || []
                              const newValues = checked
                                ? [...currentValues, project.id]
                                : currentValues.filter(v => v !== project.id)

                              updateMultiSelectFilter('projects', {
                                values: newValues,
                                includeMode: filters.projects?.includeMode || 'any'
                              })
                            }}
                          />
                          <Label htmlFor={`project-${project.id}`} className="text-sm flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: project.color || '#3b82f6' }}
                            />
                            {project.name}
                            {facets?.projectCounts?.[project.id] && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {facets.projectCounts[project.id]}
                              </Badge>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Boolean Filters */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MoreHorizontal className="h-4 w-4" />
                    Quick Filters
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has-due-date"
                        checked={filters.hasDueDate === true}
                        onCheckedChange={(checked) => updateFilter('hasDueDate', checked ? true : undefined)}
                      />
                      <Label htmlFor="has-due-date" className="text-sm">
                        Has due date
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is-overdue"
                        checked={filters.isOverdue === true}
                        onCheckedChange={(checked) => updateFilter('isOverdue', checked ? true : undefined)}
                      />
                      <Label htmlFor="is-overdue" className="text-sm">
                        Overdue
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has-recurrence"
                        checked={filters.hasRecurrence === true}
                        onCheckedChange={(checked) => updateFilter('hasRecurrence', checked ? true : undefined)}
                      />
                      <Label htmlFor="has-recurrence" className="text-sm">
                        Recurring
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has-description"
                        checked={filters.hasDescription === true}
                        onCheckedChange={(checked) => updateFilter('hasDescription', checked ? true : undefined)}
                      />
                      <Label htmlFor="has-description" className="text-sm">
                        Has description
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has-tags"
                        checked={filters.hasTags === true}
                        onCheckedChange={(checked) => updateFilter('hasTags', checked ? true : undefined)}
                      />
                      <Label htmlFor="has-tags" className="text-sm">
                        Has tags
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Sorting */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Sort By
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={filters.sortBy || 'createdAt'}
                      onValueChange={(value) => updateFilter('sortBy', value as 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'status' | 'completedAt')}
                    >
                      <SelectTrigger className="h-8 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Created</SelectItem>
                        <SelectItem value="updatedAt">Updated</SelectItem>
                        <SelectItem value="dueDate">Due Date</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.sortOrder || 'desc'}
                      onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Newest First</SelectItem>
                        <SelectItem value="asc">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
