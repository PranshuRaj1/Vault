"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { FileCard } from "@/components/files/file-card"
import { FileListView, type SortField, type SortDirection } from "@/components/files/file-list-view"
import { FilePreviewModal } from "@/components/files/file-preview-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Upload,
  Download,
  Share2,
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
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
 * Mock file data for demonstration
 */
const mockFiles: FileMetadata[] = [
  {
    id: "file_1",
    name: "Project Proposal.pdf",
    originalName: "Project Proposal.pdf",
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
    downloadCount: 5,
    isOwner: true,
    isDuplicate: false,
    tags: ["work", "proposal"],
    description: "Q1 project proposal document",
    downloadUrl: "/api/files/file_1/download",
  },
  {
    id: "file_2",
    name: "team-photo.jpg",
    originalName: "team-photo.jpg",
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
    downloadCount: 23,
    isOwner: false,
    isDuplicate: false,
    tags: ["team", "photo"],
    previewUrl: "/placeholder.svg?height=400&width=600&text=Team+Photo",
    downloadUrl: "/api/files/file_2/download",
  },
  {
    id: "file_3",
    name: "backup-data.zip",
    originalName: "backup-data.zip",
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
    downloadCount: 1,
    isOwner: true,
    isDuplicate: true,
    duplicateInfo: {
      originalFileId: "file_0",
      originalUploader: "admin@example.com",
      uploadDate: "2024-01-10",
      savings: 52428800,
    },
    tags: ["backup", "archive"],
    downloadUrl: "/api/files/file_3/download",
  },
  {
    id: "file_4",
    name: "presentation.pptx",
    originalName: "presentation.pptx",
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
    downloadCount: 12,
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
    tags: ["presentation", "meeting"],
    downloadUrl: "/api/files/file_4/download",
  },
]

/**
 * View mode type
 */
type ViewMode = "grid" | "list"

/**
 * File management page component
 * Provides comprehensive file listing, organization, and management capabilities
 */
export default function FilesPage() {
  // State management
  const [files, setFiles] = React.useState<FileMetadata[]>(mockFiles)
  const [filteredFiles, setFilteredFiles] = React.useState<FileMetadata[]>(mockFiles)
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([])
  const [selectionMode, setSelectionMode] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortField, setSortField] = React.useState<SortField>("uploadedAt")
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc")
  const [previewFile, setPreviewFile] = React.useState<FileMetadata | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  /**
   * Filter and sort files based on current criteria
   */
  React.useEffect(() => {
    let filtered = [...files]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          file.uploadedBy.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
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

    setFilteredFiles(filtered)
  }, [files, searchQuery, sortField, sortDirection])

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
        setFiles((prev) => prev.filter((f) => f.id !== file.id))
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
   * Bulk operation handlers
   */
  const bulkHandlers = React.useMemo(
    () => ({
      download: () => {
        console.log("Bulk downloading files:", selectedFiles)
        // TODO: Implement bulk download
      },
      delete: () => {
        console.log("Bulk deleting files:", selectedFiles)
        // TODO: Implement bulk delete confirmation
        setFiles((prev) => prev.filter((f) => !selectedFiles.includes(f.id)))
        setSelectedFiles([])
      },
      share: () => {
        console.log("Bulk sharing files:", selectedFiles)
        // TODO: Implement bulk share modal
      },
    }),
    [selectedFiles],
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
   * Refresh files
   */
  const handleRefresh = React.useCallback(() => {
    setIsLoading(true)
    // TODO: Implement actual API call
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  return (
    <MainLayout user={mockUser} notificationCount={3}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">My Files</h1>
            <p className="text-muted-foreground">
              Manage and organize your uploaded files. {filteredFiles.length} of {files.length} files shown.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild>
              <a href="/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </a>
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="archives">Archives</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {/* Selection mode toggle */}
            <Button variant={selectionMode ? "default" : "outline"} size="sm" onClick={selectionHandlers.toggleMode}>
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
              <Button variant="outline" size="sm" onClick={bulkHandlers.download}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={bulkHandlers.share}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={bulkHandlers.delete}
                className="text-destructive bg-transparent"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* File display */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFiles.map((file) => (
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
            files={filteredFiles}
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
            isLoading={isLoading}
          />
        )}

        {/* Empty state */}
        {filteredFiles.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-muted-foreground space-y-2">
              <p className="text-lg">No files found</p>
              <p className="text-sm">
                {searchQuery ? "Try adjusting your search criteria" : "Upload some files to get started"}
              </p>
            </div>
            {!searchQuery && (
              <Button asChild className="mt-4">
                <a href="/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First File
                </a>
              </Button>
            )}
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
