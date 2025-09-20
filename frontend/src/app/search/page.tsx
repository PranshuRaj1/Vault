"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { AdvancedSearchPanel } from "@/components/search/advanced-search-panel"
import { FileCard } from "@/components/files/file-card"
import { FileListView, type SortField, type SortDirection } from "@/components/files/file-list-view"
import { FilePreviewModal } from "@/components/files/file-preview-modal"
import { useFileSearch } from "@/hooks/use-file-search"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  Grid3X3,
  List,
  Clock,
  TrendingUp,
  Filter,
  Download,
  Share2,
  Trash2,
  CheckSquare,
  Square,
  Info,
} from "lucide-react"
import type { FileMetadata } from "@/types/file"

/**
 * Mock user data
 */
const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "/diverse-user-avatars.png",
  role: "admin" as const,
}

/**
 * Extended mock file data for search demonstration
 */
const mockFiles: FileMetadata[] = [
  {
    id: "file_1",
    name: "Project Proposal Q1 2024.pdf",
    originalName: "Project Proposal Q1 2024.pdf",
    size: 2048576,
    mimeType: "application/pdf",
    extension: "pdf",
    hash: "sha256_abc123def456",
    visibility: "private",
    status: "ready",
    uploadedAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    uploadedBy: {
      id: "user_1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    downloadCount: 15,
    isOwner: true,
    isDuplicate: false,
    tags: ["work", "proposal", "q1", "2024"],
    description: "Q1 project proposal document with budget and timeline",
    downloadUrl: "/api/files/file_1/download",
  },
  {
    id: "file_2",
    name: "team-photo-conference-2024.jpg",
    originalName: "team-photo-conference-2024.jpg",
    size: 1536000,
    mimeType: "image/jpeg",
    extension: "jpg",
    hash: "sha256_def456ghi789",
    visibility: "public",
    status: "ready",
    uploadedAt: "2024-01-14T15:45:00Z",
    updatedAt: "2024-01-14T15:45:00Z",
    uploadedBy: {
      id: "user_2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
    },
    downloadCount: 43,
    isOwner: false,
    isDuplicate: false,
    tags: ["team", "photo", "conference", "2024"],
    previewUrl: "/placeholder.svg?height=400&width=600&text=Team+Conference+Photo",
    downloadUrl: "/api/files/file_2/download",
  },
  {
    id: "file_3",
    name: "backup-database-january.zip",
    originalName: "backup-database-january.zip",
    size: 52428800,
    mimeType: "application/zip",
    extension: "zip",
    hash: "sha256_ghi789jkl012",
    visibility: "private",
    status: "ready",
    uploadedAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
    uploadedBy: {
      id: "user_1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    downloadCount: 3,
    isOwner: true,
    isDuplicate: true,
    duplicateInfo: {
      originalFileId: "file_0",
      originalUploader: "admin@example.com",
      uploadDate: "2024-01-10",
      savings: 52428800,
    },
    tags: ["backup", "database", "january", "archive"],
    downloadUrl: "/api/files/file_3/download",
  },
  {
    id: "file_4",
    name: "marketing-presentation-q1.pptx",
    originalName: "marketing-presentation-q1.pptx",
    size: 8192000,
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extension: "pptx",
    hash: "sha256_jkl012mno345",
    visibility: "shared",
    status: "ready",
    uploadedAt: "2024-01-12T14:20:00Z",
    updatedAt: "2024-01-12T14:20:00Z",
    uploadedBy: {
      id: "user_3",
      name: "Bob Wilson",
      email: "bob.wilson@example.com",
    },
    downloadCount: 28,
    isOwner: false,
    isDuplicate: false,
    sharedWith: [
      {
        userId: "user_1",
        userName: "John Doe",
        userEmail: "john.doe@example.com",
        sharedAt: "2024-01-12T14:25:00Z",
      },
    ],
    tags: ["marketing", "presentation", "q1", "strategy"],
    downloadUrl: "/api/files/file_4/download",
  },
  {
    id: "file_5",
    name: "user-manual-v2.pdf",
    originalName: "user-manual-v2.pdf",
    size: 3145728,
    mimeType: "application/pdf",
    extension: "pdf",
    hash: "sha256_mno345pqr678",
    visibility: "public",
    status: "ready",
    uploadedAt: "2024-01-11T11:00:00Z",
    updatedAt: "2024-01-11T11:00:00Z",
    uploadedBy: {
      id: "user_4",
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
    },
    downloadCount: 67,
    isOwner: false,
    isDuplicate: false,
    tags: ["manual", "documentation", "v2", "user-guide"],
    description: "Comprehensive user manual version 2.0",
    downloadUrl: "/api/files/file_5/download",
  },
  {
    id: "file_6",
    name: "demo-video-product.mp4",
    originalName: "demo-video-product.mp4",
    size: 25165824,
    mimeType: "video/mp4",
    extension: "mp4",
    hash: "sha256_pqr678stu901",
    visibility: "public",
    status: "ready",
    uploadedAt: "2024-01-10T16:30:00Z",
    updatedAt: "2024-01-10T16:30:00Z",
    uploadedBy: {
      id: "user_5",
      name: "Charlie Brown",
      email: "charlie.brown@example.com",
    },
    downloadCount: 89,
    isOwner: false,
    isDuplicate: false,
    tags: ["demo", "video", "product", "tutorial"],
    description: "Product demonstration video for new features",
    downloadUrl: "/api/files/file_6/download",
  },
]

/**
 * View mode type
 */
type ViewMode = "grid" | "list"

/**
 * Advanced search page component
 * Provides comprehensive file search with multiple filter options
 */
export default function SearchPage() {
  const {
    filters,
    filteredFiles,
    savedSearches,
    searchHistory,
    searchMeta,
    isSearching,
    availableOptions,
    setFilters,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    clearFilters,
  } = useFileSearch({
    files: mockFiles,
    enableHistory: true,
    maxHistoryEntries: 20,
  })

  // UI state
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([])
  const [selectionMode, setSelectionMode] = React.useState(false)
  const [sortField, setSortField] = React.useState<SortField>("uploadedAt")
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc")
  const [previewFile, setPreviewFile] = React.useState<FileMetadata | null>(null)
  const [searchPanelExpanded, setSearchPanelExpanded] = React.useState(true)

  /**
   * File operation handlers
   */
  const fileHandlers = React.useMemo(
    () => ({
      download: (file: FileMetadata) => {
        console.log("Downloading file:", file.name)
        // TODO: Implement actual download
      },
      share: (file: FileMetadata) => {
        console.log("Sharing file:", file.name)
        // TODO: Implement share modal
      },
      delete: (file: FileMetadata) => {
        console.log("Deleting file:", file.name)
        // TODO: Implement delete confirmation
      },
      preview: (file: FileMetadata) => {
        setPreviewFile(file)
      },
      copyLink: (file: FileMetadata) => {
        navigator.clipboard.writeText(`${window.location.origin}/files/${file.id}`)
        console.log("Link copied for:", file.name)
      },
    }),
    [],
  )

  /**
   * Selection handlers
   */
  const selectionHandlers = React.useMemo(
    () => ({
      toggle: (fileId: string, selected: boolean) => {
        setSelectedFiles((prev) => (selected ? [...prev, fileId] : prev.filter((id) => id !== fileId)))
      },
      selectAll: (selected: boolean) => {
        setSelectedFiles(selected ? filteredFiles.map((f) => f.id) : [])
      },
      clear: () => {
        setSelectedFiles([])
        setSelectionMode(false)
      },
      toggleMode: () => {
        setSelectionMode((prev) => !prev)
        if (selectionMode) {
          setSelectedFiles([])
        }
      },
    }),
    [filteredFiles, selectionMode],
  )

  /**
   * Sort handler
   */
  const handleSort = React.useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      } else {
        setSortField(field)
        setSortDirection("desc")
      }
    },
    [sortField],
  )

  /**
   * Sort filtered files
   */
  const sortedFiles = React.useMemo(() => {
    const sorted = [...filteredFiles]
    sorted.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === "uploadedBy") {
        aValue = a.uploadedBy.name
        bValue = b.uploadedBy.name
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
    return sorted
  }, [filteredFiles, sortField, sortDirection])

  return (
    <MainLayout user={mockUser} notificationCount={3}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter files using multiple criteria. Find exactly what you're looking for with powerful search
            options.
          </p>
        </div>

        {/* Search panel */}
        <AdvancedSearchPanel
          filters={filters}
          onFiltersChange={setFilters}
          savedSearches={savedSearches}
          onSaveSearch={saveSearch}
          onLoadSavedSearch={loadSavedSearch}
          onDeleteSavedSearch={deleteSavedSearch}
          availableTags={availableOptions.tags}
          availableUploaders={availableOptions.uploaders}
          isExpanded={searchPanelExpanded}
          onExpandedChange={setSearchPanelExpanded}
        />

        {/* Search results summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Results
                  {isSearching && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                </CardTitle>
                <CardDescription>
                  Showing {searchMeta.filteredResults} of {searchMeta.totalResults} files
                  {Object.keys(searchMeta.appliedFilters).length > 0 && (
                    <span className="ml-2">
                      • {Object.keys(searchMeta.appliedFilters).length} filter
                      {Object.keys(searchMeta.appliedFilters).length !== 1 ? "s" : ""} applied
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Selection mode toggle */}
                <Button
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={selectionHandlers.toggleMode}
                >
                  {selectionMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  {selectionMode ? "Exit Selection" : "Select"}
                </Button>

                {/* View mode toggle */}
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          {Object.keys(searchMeta.appliedFilters).length > 0 && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm font-medium">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(searchMeta.appliedFilters).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {key}: {Array.isArray(value) ? value.join(", ") : String(value)}
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Bulk actions bar */}
        {selectionMode && selectedFiles.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedFiles.length} selected</Badge>
              <Button variant="ghost" size="sm" onClick={selectionHandlers.clear}>
                Clear selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Search insights */}
        {searchMeta.filteredResults > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Most Downloaded</p>
                    <p className="text-xs text-muted-foreground">
                      {sortedFiles.sort((a, b) => b.downloadCount - a.downloadCount)[0]?.name || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Most Recent</p>
                    <p className="text-xs text-muted-foreground">
                      {sortedFiles.sort(
                        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
                      )[0]?.name || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">File Types</p>
                    <p className="text-xs text-muted-foreground">
                      {new Set(sortedFiles.map((f) => f.extension.toUpperCase())).size} different types
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search results */}
        {sortedFiles.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  isSelected={selectedFiles.includes(file.id)}
                  selectionMode={selectionMode}
                  onSelectionChange={selectionHandlers.toggle}
                  onClick={fileHandlers.preview}
                  onDownload={fileHandlers.download}
                  onShare={fileHandlers.share}
                  onDelete={fileHandlers.delete}
                  onPreview={fileHandlers.preview}
                  onCopyLink={fileHandlers.copyLink}
                />
              ))}
            </div>
          ) : (
            <FileListView
              files={sortedFiles}
              selectedFiles={selectedFiles}
              selectionMode={selectionMode}
              sortField={sortField}
              sortDirection={sortDirection}
              onSelectionChange={selectionHandlers.toggle}
              onSelectAll={selectionHandlers.selectAll}
              onSort={handleSort}
              onFileClick={fileHandlers.preview}
              onDownload={fileHandlers.download}
              onShare={fileHandlers.share}
              onDelete={fileHandlers.delete}
              onPreview={fileHandlers.preview}
            />
          )
        ) : (
          <div className="text-center py-12">
            <div className="space-y-4">
              <div className="text-muted-foreground space-y-2">
                <p className="text-lg">No files found</p>
                <p className="text-sm">Try adjusting your search criteria or clearing some filters</p>
              </div>
              {Object.keys(searchMeta.appliedFilters).length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your search returned no results. Try broadening your search criteria or removing some filters.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* File preview modal */}
        <FilePreviewModal
          file={previewFile}
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
          onDownload={fileHandlers.download}
          onShare={fileHandlers.share}
          onCopyLink={fileHandlers.copyLink}
        />
      </div>
    </MainLayout>
  )
}
