"use client"

import * as React from "react"
import { Calendar, X, Plus, Search, Save, History, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Slider } from "@/components/ui/slider"
import type {
  SearchFilters,
  FileTypeFilter,
  VisibilityFilter,
  OwnershipFilter,
  DateRangeFilter,
  SizeRangeFilter,
  SavedSearch,
} from "@/types/search"

interface AdvancedSearchPanelProps {
  /** Current search filters */
  filters: SearchFilters
  /** Callback when filters change */
  onFiltersChange: (filters: SearchFilters) => void
  /** Available saved searches */
  savedSearches: SavedSearch[]
  /** Callback to save current search */
  onSaveSearch: (name: string, description?: string) => void
  /** Callback to load saved search */
  onLoadSavedSearch: (search: SavedSearch) => void
  /** Callback to delete saved search */
  onDeleteSavedSearch: (searchId: string) => void
  /** Available tags for filtering */
  availableTags: string[]
  /** Available uploaders for filtering */
  availableUploaders: Array<{ id: string; name: string; email: string }>
  /** Whether panel is expanded */
  isExpanded: boolean
  /** Callback when panel expansion changes */
  onExpandedChange: (expanded: boolean) => void
}

/**
 * File type filter options with labels and MIME type mappings
 */
const FILE_TYPE_OPTIONS: Array<{ value: FileTypeFilter; label: string; description: string }> = [
  { value: "all", label: "All Files", description: "Show all file types" },
  { value: "images", label: "Images", description: "JPG, PNG, GIF, SVG, etc." },
  { value: "documents", label: "Documents", description: "PDF, DOC, TXT, etc." },
  { value: "videos", label: "Videos", description: "MP4, AVI, MOV, etc." },
  { value: "audio", label: "Audio", description: "MP3, WAV, FLAC, etc." },
  { value: "archives", label: "Archives", description: "ZIP, RAR, TAR, etc." },
  { value: "other", label: "Other", description: "All other file types" },
]

/**
 * Size range presets in bytes
 */
const SIZE_RANGES = {
  small: { min: 0, max: 1024 * 1024 }, // 0-1MB
  medium: { min: 1024 * 1024, max: 10 * 1024 * 1024 }, // 1-10MB
  large: { min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 }, // 10-100MB
  huge: { min: 100 * 1024 * 1024, max: Number.MAX_SAFE_INTEGER }, // 100MB+
}

/**
 * Format file size to human readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

/**
 * Advanced search panel component
 * Provides comprehensive filtering options for file search
 */
export function AdvancedSearchPanel({
  filters,
  onFiltersChange,
  savedSearches,
  onSaveSearch,
  onLoadSavedSearch,
  onDeleteSavedSearch,
  availableTags,
  availableUploaders,
  isExpanded,
  onExpandedChange,
}: AdvancedSearchPanelProps) {
  const [newTagInput, setNewTagInput] = React.useState("")
  const [saveSearchName, setSaveSearchName] = React.useState("")
  const [saveSearchDescription, setSaveSearchDescription] = React.useState("")
  const [showSaveDialog, setShowSaveDialog] = React.useState(false)

  /**
   * Update specific filter value
   */
  const updateFilter = React.useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      onFiltersChange({ ...filters, [key]: value })
    },
    [filters, onFiltersChange],
  )

  /**
   * Add tag to filter
   */
  const addTag = React.useCallback(
    (tag: string) => {
      if (tag && !filters.tags.includes(tag)) {
        updateFilter("tags", [...filters.tags, tag])
      }
      setNewTagInput("")
    },
    [filters.tags, updateFilter],
  )

  /**
   * Remove tag from filter
   */
  const removeTag = React.useCallback(
    (tag: string) => {
      updateFilter(
        "tags",
        filters.tags.filter((t) => t !== tag),
      )
    },
    [filters.tags, updateFilter],
  )

  /**
   * Clear all filters
   */
  const clearAllFilters = React.useCallback(() => {
    onFiltersChange({
      query: "",
      fileType: "all",
      visibility: "all",
      ownership: "all",
      dateRange: "all",
      sizeRange: "all",
      tags: [],
      includeDuplicates: true,
    })
  }, [onFiltersChange])

  /**
   * Handle save search
   */
  const handleSaveSearch = React.useCallback(() => {
    if (saveSearchName.trim()) {
      onSaveSearch(saveSearchName.trim(), saveSearchDescription.trim() || undefined)
      setSaveSearchName("")
      setSaveSearchDescription("")
      setShowSaveDialog(false)
    }
  }, [saveSearchName, saveSearchDescription, onSaveSearch])

  /**
   * Count active filters
   */
  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.query) count++
    if (filters.fileType !== "all") count++
    if (filters.visibility !== "all") count++
    if (filters.ownership !== "all") count++
    if (filters.dateRange !== "all") count++
    if (filters.sizeRange !== "all") count++
    if (filters.uploadedBy) count++
    if (filters.tags.length > 0) count++
    if (!filters.includeDuplicates) count++
    if (filters.minDownloads) count++
    return count
  }, [filters])

  return (
    <Card className="w-full">
      <Collapsible open={isExpanded} onOpenChange={onExpandedChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Advanced Search
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount} active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Filter files by type, date, size, and more</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                {isExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Quick actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
              </div>
              {savedSearches.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      Saved Searches
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">Saved Searches</h4>
                      {savedSearches.map((search) => (
                        <div key={search.id} className="flex items-center justify-between p-2 rounded border">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{search.name}</p>
                            {search.description && (
                              <p className="text-xs text-muted-foreground truncate">{search.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onLoadSavedSearch(search)}
                              className="h-8 px-2"
                            >
                              Load
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteSavedSearch(search.id)}
                              className="h-8 px-2 text-destructive bg-transparent"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <Separator />

            {/* Main search query */}
            <div className="space-y-2">
              <Label htmlFor="search-query">Search Query</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-query"
                  placeholder="Search by filename, content, or metadata..."
                  value={filters.query}
                  onChange={(e) => updateFilter("query", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* File type filter */}
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select
                  value={filters.fileType}
                  onValueChange={(value: FileTypeFilter) => updateFilter("fileType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility filter */}
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={filters.visibility}
                  onValueChange={(value: VisibilityFilter) => updateFilter("visibility", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="private">Private Only</SelectItem>
                    <SelectItem value="public">Public Only</SelectItem>
                    <SelectItem value="shared">Shared Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ownership filter */}
              <div className="space-y-2">
                <Label>Ownership</Label>
                <Select
                  value={filters.ownership}
                  onValueChange={(value: OwnershipFilter) => updateFilter("ownership", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="owned">Files I Own</SelectItem>
                    <SelectItem value="shared_with_me">Shared With Me</SelectItem>
                    <SelectItem value="public_files">Public Files</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date range filter */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value: DateRangeFilter) => updateFilter("dateRange", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                {filters.dateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start bg-transparent">
                          <Calendar className="h-4 w-4 mr-2" />
                          From
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={filters.customDateRange?.from ? new Date(filters.customDateRange.from) : undefined}
                          onSelect={(date) =>
                            updateFilter("customDateRange", {
                              ...filters.customDateRange,
                              from: date?.toISOString() || "",
                            })
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start bg-transparent">
                          <Calendar className="h-4 w-4 mr-2" />
                          To
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={filters.customDateRange?.to ? new Date(filters.customDateRange.to) : undefined}
                          onSelect={(date) =>
                            updateFilter("customDateRange", {
                              ...filters.customDateRange,
                              to: date?.toISOString() || "",
                            })
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Size range filter */}
              <div className="space-y-2">
                <Label>File Size</Label>
                <Select
                  value={filters.sizeRange}
                  onValueChange={(value: SizeRangeFilter) => updateFilter("sizeRange", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Size</SelectItem>
                    <SelectItem value="small">Small (0-1MB)</SelectItem>
                    <SelectItem value="medium">Medium (1-10MB)</SelectItem>
                    <SelectItem value="large">Large (10-100MB)</SelectItem>
                    <SelectItem value="huge">Huge (100MB+)</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                {filters.sizeRange === "custom" && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min (MB)"
                        value={filters.customSizeRange?.min ? filters.customSizeRange.min / (1024 * 1024) : ""}
                        onChange={(e) =>
                          updateFilter("customSizeRange", {
                            ...filters.customSizeRange,
                            min: Number.parseFloat(e.target.value) * 1024 * 1024 || 0,
                          })
                        }
                        className="text-sm"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="number"
                        placeholder="Max (MB)"
                        value={filters.customSizeRange?.max ? filters.customSizeRange.max / (1024 * 1024) : ""}
                        onChange={(e) =>
                          updateFilter("customSizeRange", {
                            ...filters.customSizeRange,
                            max: Number.parseFloat(e.target.value) * 1024 * 1024 || Number.MAX_SAFE_INTEGER,
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Uploader filter */}
              <div className="space-y-2">
                <Label>Uploaded By</Label>
                <Select
                  value={filters.uploadedBy || "any"}
                  onValueChange={(value) => updateFilter("uploadedBy", value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any uploader" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any uploader</SelectItem>
                    {availableUploaders.map((uploader) => (
                      <SelectItem key={uploader.id} value={uploader.id}>
                        <div>
                          <div className="font-medium">{uploader.name}</div>
                          <div className="text-xs text-muted-foreground">{uploader.email}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags filter */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add tag filter..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag(newTagInput)
                      }
                    }}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => addTag(newTagInput)} disabled={!newTagInput.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {filters.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTag(tag)}
                          className="h-auto p-0 ml-1 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                {availableTags.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Available tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {availableTags
                        .filter((tag) => !filters.tags.includes(tag))
                        .slice(0, 10)
                        .map((tag) => (
                          <Button
                            key={tag}
                            variant="outline"
                            size="sm"
                            onClick={() => addTag(tag)}
                            className="h-6 px-2 text-xs"
                          >
                            {tag}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional options */}
            <div className="space-y-4">
              <Separator />
              <div className="space-y-3">
                <Label>Additional Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-duplicates"
                      checked={filters.includeDuplicates}
                      onCheckedChange={(checked) => updateFilter("includeDuplicates", !!checked)}
                    />
                    <Label htmlFor="include-duplicates" className="text-sm">
                      Include duplicate files in results
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-downloads" className="text-sm">
                      Minimum downloads: {filters.minDownloads || 0}
                    </Label>
                    <Slider
                      id="min-downloads"
                      min={0}
                      max={100}
                      step={1}
                      value={[filters.minDownloads || 0]}
                      onValueChange={([value]) => updateFilter("minDownloads", value || undefined)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save search dialog */}
            {showSaveDialog && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="save-name">Search Name</Label>
                  <Input
                    id="save-name"
                    placeholder="Enter search name..."
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="save-description">Description (optional)</Label>
                  <Input
                    id="save-description"
                    placeholder="Enter description..."
                    value={saveSearchDescription}
                    onChange={(e) => setSaveSearchDescription(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleSaveSearch} disabled={!saveSearchName.trim()}>
                    Save Search
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
