"use client"

import * as React from "react"
import {
  File,
  ImageIcon,
  FileText,
  Archive,
  Video,
  Music,
  Download,
  Share2,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
  HardDrive,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { FileMetadata } from "@/types/file"
import { cn } from "@/lib/utils"

/**
 * Sort configuration for file list
 */
export type SortField = "name" | "size" | "uploadedAt" | "downloadCount" | "uploadedBy"
export type SortDirection = "asc" | "desc"

interface FileListViewProps {
  /** Array of files to display */
  files: FileMetadata[]
  /** Selected file IDs */
  selectedFiles: string[]
  /** Whether selection mode is active */
  selectionMode: boolean
  /** Current sort configuration */
  sortField: SortField
  sortDirection: SortDirection
  /** Callbacks */
  onSelectionChange: (fileId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onSort: (field: SortField) => void
  onFileClick: (file: FileMetadata) => void
  onDownload: (file: FileMetadata) => void
  onShare: (file: FileMetadata) => void
  onDelete: (file: FileMetadata) => void
  onPreview: (file: FileMetadata) => void
  /** Loading state */
  isLoading?: boolean
}

/**
 * Get appropriate icon for file type
 */
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return ImageIcon
  if (mimeType.startsWith("video/")) return Video
  if (mimeType.startsWith("audio/")) return Music
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText
  if (mimeType.includes("zip") || mimeType.includes("archive")) return Archive
  return File
}

/**
 * Format file size to human readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Format date to readable format
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Table-based file list view with sorting and bulk selection
 * Optimized for displaying large numbers of files
 */
export function FileListView({
  files,
  selectedFiles,
  selectionMode,
  sortField,
  sortDirection,
  onSelectionChange,
  onSelectAll,
  onSort,
  onFileClick,
  onDownload,
  onShare,
  onDelete,
  onPreview,
  isLoading = false,
}: FileListViewProps) {
  /**
   * Memoized sort icon component
   */
  const getSortIcon = React.useCallback(
    (field: SortField) => {
      if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
      return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
    },
    [sortField, sortDirection],
  )

  /**
   * Memoized file operation handlers
   */
  const createFileHandlers = React.useCallback(
    (file: FileMetadata) => ({
      download: (e: React.MouseEvent) => {
        e.stopPropagation()
        onDownload(file)
      },
      share: (e: React.MouseEvent) => {
        e.stopPropagation()
        onShare(file)
      },
      delete: (e: React.MouseEvent) => {
        e.stopPropagation()
        onDelete(file)
      },
      preview: (e: React.MouseEvent) => {
        e.stopPropagation()
        onPreview(file)
      },
      select: (checked: boolean) => {
        onSelectionChange(file.id, checked)
      },
      click: () => {
        if (selectionMode) {
          onSelectionChange(file.id, !selectedFiles.includes(file.id))
        } else {
          onFileClick(file)
        }
      },
    }),
    [onDownload, onShare, onDelete, onPreview, onSelectionChange, onFileClick, selectionMode, selectedFiles],
  )

  /**
   * Handle select all checkbox
   */
  const handleSelectAll = React.useCallback(
    (checked: boolean) => {
      onSelectAll(checked)
    },
    [onSelectAll],
  )

  /**
   * Get visibility configuration
   */
  const getVisibilityConfig = React.useCallback((visibility: FileMetadata["visibility"]) => {
    switch (visibility) {
      case "public":
        return { icon: Eye, color: "text-green-600", label: "Public" }
      case "shared":
        return { icon: Share2, color: "text-blue-600", label: "Shared" }
      default:
        return { icon: EyeOff, color: "text-muted-foreground", label: "Private" }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectionMode && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={files.length > 0 && selectedFiles.length === files.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all files"
                  />
                </TableHead>
              )}
              <TableHead>
                <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => onSort("name")}>
                  Name
                  {getSortIcon("name")}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => onSort("size")}>
                  Size
                  {getSortIcon("size")}
                </Button>
              </TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => onSort("uploadedBy")}
                >
                  Uploaded By
                  {getSortIcon("uploadedBy")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => onSort("uploadedAt")}
                >
                  Date
                  {getSortIcon("uploadedAt")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => onSort("downloadCount")}
                >
                  Downloads
                  {getSortIcon("downloadCount")}
                </Button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => {
              const FileIcon = getFileIcon(file.mimeType)
              const visibilityConfig = getVisibilityConfig(file.visibility)
              const VisibilityIcon = visibilityConfig.icon
              const handlers = createFileHandlers(file)
              const isSelected = selectedFiles.includes(file.id)

              return (
                <TableRow
                  key={file.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    isSelected && "bg-muted/50",
                    selectionMode && "select-none",
                  )}
                  onClick={handlers.click}
                >
                  {selectionMode && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={handlers.select}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${file.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {file.isDuplicate && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-xs">
                                  <HardDrive className="h-3 w-3 mr-1" />
                                  Deduplicated
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Storage saved via deduplication</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {file.tags.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {file.tags.length} tags
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{formatFileSize(file.size)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", visibilityConfig.color)}>
                      <VisibilityIcon className="h-3 w-3 mr-1" />
                      {visibilityConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`/ceholder-svg-height-24.jpg?height=24&width=24`} />
                        <AvatarFallback className="text-xs">
                          {file.uploadedBy.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{file.isOwner ? "You" : file.uploadedBy.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{formatDate(file.uploadedAt)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{file.downloadCount}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={handlers.preview}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handlers.download}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handlers.share}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {file.isOwner && (
                          <DropdownMenuItem
                            onClick={handlers.delete}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
