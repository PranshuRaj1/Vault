"use client"

import { useState, useMemo, useCallback } from "react"
import { Search, Download, Eye, Calendar, User, HardDrive, Filter, Grid, List, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FilePreviewModal } from "@/components/files/file-preview-modal"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import type { FileItem } from "@/types/file"

/**
 * Mock data for publicly shared files
 * In a real app, this would come from your Go backend API
 */
const mockSharedFiles: FileItem[] = [
  {
    id: "1",
    name: "Project Proposal.pdf",
    size: 2048576,
    type: "application/pdf",
    uploadDate: "2024-01-15T10:30:00Z",
    uploader: {
      id: "user1",
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    visibility: "public",
    downloadCount: 156,
    tags: ["proposal", "business"],
    sharedWith: [],
    isDuplicate: false,
    hash: "abc123",
    publicUrl: "https://vault.example.com/shared/abc123",
  },
  {
    id: "2",
    name: "Design System.figma",
    size: 5242880,
    type: "application/figma",
    uploadDate: "2024-01-20T14:15:00Z",
    uploader: {
      id: "user2",
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    visibility: "public",
    downloadCount: 89,
    tags: ["design", "ui", "system"],
    sharedWith: [],
    isDuplicate: false,
    hash: "def456",
    publicUrl: "https://vault.example.com/shared/def456",
  },
  {
    id: "3",
    name: "API Documentation.md",
    size: 102400,
    type: "text/markdown",
    uploadDate: "2024-01-25T09:45:00Z",
    uploader: {
      id: "user3",
      name: "Mike Johnson",
      email: "mike@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    visibility: "public",
    downloadCount: 234,
    tags: ["documentation", "api", "technical"],
    sharedWith: [],
    isDuplicate: false,
    hash: "ghi789",
    publicUrl: "https://vault.example.com/shared/ghi789",
  },
]

/**
 * SharedFilesPage Component
 *
 * Displays publicly shared files that are accessible to anyone with the link.
 * Features include:
 * - File search and filtering
 * - Download counters for public files
 * - Grid and list view modes
 * - File preview functionality
 * - Responsive design with proper accessibility
 */
export default function SharedFilesPage() {
  // State management for search, filters, and view mode
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("downloadCount")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)

  /**
   * Filter and sort shared files based on search query and selected filters
   * Memoized for performance optimization
   */
  const filteredFiles = useMemo(() => {
    const filtered = mockSharedFiles.filter((file) => {
      const matchesSearch =
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesType = selectedType === "all" || file.type.includes(selectedType)

      return matchesSearch && matchesType
    })

    // Sort files based on selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "downloadCount":
          return b.downloadCount - a.downloadCount
        case "name":
          return a.name.localeCompare(b.name)
        case "uploadDate":
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        case "size":
          return b.size - a.size
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, selectedType, sortBy])

  /**
   * Handle file download with counter increment
   * In a real app, this would make an API call to increment download count
   */
  const handleDownload = useCallback(async (file: FileItem) => {
    try {
      console.log(`[v0] Downloading file: ${file.name}`)

      // In a real app, you would:
      // 1. Make API call to increment download counter
      // 2. Get signed download URL from backend
      // 3. Trigger actual file download

      // For demo purposes, we'll just show the action
      const link = document.createElement("a")
      link.href = file.publicUrl || "#"
      link.download = file.name
      link.click()

      // Update local state (in real app, this would come from API response)
      // This is just for demo purposes
    } catch (error) {
      console.error("[v0] Download failed:", error)
    }
  }, [])

  /**
   * Handle file preview
   */
  const handlePreview = useCallback((file: FileItem) => {
    setPreviewFile(file)
  }, [])

  /**
   * Copy public link to clipboard
   */
  const handleCopyLink = useCallback(async (file: FileItem) => {
    try {
      await navigator.clipboard.writeText(file.publicUrl || "")
      // In a real app, you'd show a toast notification here
      console.log("[v0] Link copied to clipboard")
    } catch (error) {
      console.error("[v0] Failed to copy link:", error)
    }
  }, [])

  /**
   * Format file size for display
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  /**
   * Get unique file types for filter dropdown
   */
  const fileTypes = useMemo(() => {
    const types = new Set(mockSharedFiles.map((file) => file.type.split("/")[0]))
    return Array.from(types)
  }, [])

  return (
    <div className="flex-1 space-y-6 p-6">
      <Breadcrumbs />

      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shared Files</h1>
            <p className="text-muted-foreground">Browse publicly shared files from the community</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredFiles.length} files available
          </Badge>
        </div>

        {/* Search and Filter Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search files by name or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* File Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="File type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {fileTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Options */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="downloadCount">Most Downloaded</SelectItem>
                  <SelectItem value="uploadDate">Newest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="size">Largest First</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
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
          </CardContent>
        </Card>
      </div>

      {/* Files Display */}
      <div className="space-y-4">
        {filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">No shared files found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={viewMode} className="w-full">
            <TabsContent value="grid" className="mt-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* File Icon and Name */}
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <HardDrive className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate" title={file.name}>
                              {file.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>

                        {/* File Metadata */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{file.uploader.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Download className="h-3 w-3" />
                            <span>{file.downloadCount} downloads</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {file.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {file.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{file.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          <Button size="sm" variant="outline" onClick={() => handlePreview(file)} className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" onClick={() => handleDownload(file)} className="flex-1">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleCopyLink(file)}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="p-4 font-medium">Name</th>
                          <th className="p-4 font-medium">Uploader</th>
                          <th className="p-4 font-medium">Size</th>
                          <th className="p-4 font-medium">Downloads</th>
                          <th className="p-4 font-medium">Date</th>
                          <th className="p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFiles.map((file) => (
                          <tr key={file.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                  <HardDrive className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{file.name}</div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {file.tags.slice(0, 2).map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={file.uploader.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{file.uploader.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{file.uploader.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">{formatFileSize(file.size)}</td>
                            <td className="p-4">
                              <div className="flex items-center space-x-1">
                                <Download className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{file.downloadCount}</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {new Date(file.uploadDate).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="flex space-x-1">
                                <Button size="sm" variant="ghost" onClick={() => handlePreview(file)}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDownload(file)}>
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleCopyLink(file)}>
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  )
}
