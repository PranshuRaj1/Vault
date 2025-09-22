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
  Loader2,
  AlertCircle,
} from "lucide-react"
import type { FileMetadata } from "@/types/file"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


// api url
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"



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
  const [files, setFiles] = React.useState<FileMetadata[]>([])
  const [filteredFiles, setFilteredFiles] = React.useState<FileMetadata[]>([])
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([])
  const [selectionMode, setSelectionMode] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortField, setSortField] = React.useState<SortField>("uploadedAt")
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc")
  const [previewFile, setPreviewFile] = React.useState<FileMetadata | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const { user, isLoading: isAuthLoading } = useAuth()
  const router  = useRouter()


  // data fetching function
  const fetchFiles = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/files`, {
        method: "GET",
        credentials: "include", // This is crucial for sending your auth cookie
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to fetch files")
      }

      const data: FileMetadata[] = await response.json()
      console.log(data);
      
      setFiles(data) // Set the master list
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // auth check and initial fetch

  React.useEffect(() => {
    if (isAuthLoading) {
      return // Wait for auth check
    }
    if (!user) {
      console.log("No user, redirecting to /auth")
      router.push("/auth")
      return
    }
    // Once user is confirmed, fetch their files
    fetchFiles()
  }, [user, isAuthLoading, router, fetchFiles])



  /**
   * Filter and sort files based on current criteria
   */
  React.useEffect(() => {
    // 1. Provide a fallback for 'files'
    let filtered = [...(files || [])]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (file) =>
          // 2. Add optional chaining (?) and fallbacks (||)
          (file.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (file.tags || []).some((tag) => (tag?.toLowerCase() || "").includes(searchQuery.toLowerCase())) ||
          (file.uploadedBy?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === "uploadedBy") {
        // 3. Use optional chaining here too
        aValue = a.uploadedBy?.name
        bValue = b.uploadedBy?.name
      }

      // 4. Handle cases where values might be null or undefined
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
      } else if (aValue == null) { // Catches null or undefined
        aValue = "" // Use an empty string as a fallback
      }

      if (typeof bValue === "string") {
        bValue = bValue.toLowerCase()
      } else if (bValue == null) {
        bValue = ""
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
        setFiles((prev) => (prev || []).filter((f) => f.id !== file.id))
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
        setSelectedFiles(selected ? (filteredFiles || []).map((f) => f.id) : [])
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
        setFiles((prev) => (prev || []).filter((f) => !selectedFiles.includes(f.id)))
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
    fetchFiles()
  }, [fetchFiles])

  // hanlde auth loading state
  if (isAuthLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

   const layoutUser = {
    name: user.username || "User", // Map username to name
    email: user.email || "",        // Provide a fallback
    role: (user.userRole as "user" | "admin") || "user", // Map userRole to role
  }

  return (
    <MainLayout user={layoutUser} notificationCount={3}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">My Files</h1>
            <p className="text-muted-foreground">
              Manage and organize your uploaded files. {(filteredFiles || []).length} of {(files || []).length} files shown.
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
{/* 
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )} */}

        {/* File display */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(filteredFiles || []).map((file) => (
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
            files={filteredFiles || []}
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
        {(filteredFiles || []).length === 0 && !isLoading && (
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
