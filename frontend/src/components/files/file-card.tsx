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
  Copy,
  MoreHorizontal,
  ExternalLink,
  Tag,
  Calendar,
  HardDrive,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { FileMetadata } from "@/types/file"
import { cn } from "@/lib/utils"

interface FileCardProps {
  /** File metadata */
  file: FileMetadata
  /** Whether the card is selected */
  isSelected?: boolean
  /** Selection mode for bulk operations */
  selectionMode?: boolean
  /** Callback when file is selected/deselected */
  onSelectionChange?: (fileId: string, selected: boolean) => void
  /** Callback when file is clicked */
  onClick?: (file: FileMetadata) => void
  /** File operation callbacks */
  onDownload?: (file: FileMetadata) => void
  onShare?: (file: FileMetadata) => void
  onDelete?: (file: FileMetadata) => void
  onPreview?: (file: FileMetadata) => void
  onCopyLink?: (file: FileMetadata) => void
  /** Custom className */
  className?: string
}

/**
 * Get appropriate icon for file type
 */
const getFileIcon = (mimeType: string, size: "sm" | "md" | "lg" = "md") => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  const iconClass = sizeClasses[size]

  if (mimeType.startsWith("image/")) return <ImageIcon className={iconClass} />
  if (mimeType.startsWith("video/")) return <Video className={iconClass} />
  if (mimeType.startsWith("audio/")) return <Music className={iconClass} />
  if (mimeType.includes("pdf") || mimeType.includes("document")) return <FileText className={iconClass} />
  if (mimeType.includes("zip") || mimeType.includes("archive")) return <Archive className={iconClass} />
  return <File className={iconClass} />
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
 * Format date to relative time
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

/**
 * File card component for displaying file information and actions
 * Supports selection mode, preview, and various file operations
 */
export function FileCard({
  file,
  isSelected = false,
  selectionMode = false,
  onSelectionChange,
  onClick,
  onDownload,
  onShare,
  onDelete,
  onPreview,
  onCopyLink,
  className,
}: FileCardProps) {
  /**
   * Memoized file operation handlers
   */
  const handlers = React.useMemo(
    () => ({
      download: () => onDownload?.(file),
      share: () => onShare?.(file),
      delete: () => onDelete?.(file),
      preview: () => onPreview?.(file),
      copyLink: () => onCopyLink?.(file),
      toggleSelection: () => onSelectionChange?.(file.id, !isSelected),
      cardClick: () => {
        if (selectionMode) {
          onSelectionChange?.(file.id, !isSelected)
        } else {
          onClick?.(file)
        }
      },
    }),
    [file, isSelected, selectionMode, onSelectionChange, onClick, onDownload, onShare, onDelete, onPreview, onCopyLink],
  )

  /**
   * Get visibility icon and color
   */
  const visibilityConfig = React.useMemo(() => {
    switch (file.visibility) {
      case "public":
        return { icon: Eye, color: "text-green-600", label: "Public" }
      case "shared":
        return { icon: Share2, color: "text-blue-600", label: "Shared" }
      default:
        return { icon: EyeOff, color: "text-muted-foreground", label: "Private" }
    }
  }, [file.visibility])

  const VisibilityIcon = visibilityConfig.icon

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-md",
          isSelected && "ring-2 ring-primary ring-offset-2",
          selectionMode && "hover:ring-1 hover:ring-primary/50",
          className,
        )}
        onClick={handlers.cardClick}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header with icon, name, and actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* File icon or preview */}
                <div className="flex-shrink-0">
                  {file.previewUrl && file.mimeType.startsWith("image/") ? (
                    <img
                      src={file.previewUrl || "/placeholder.svg"}
                      alt={file.name}
                      className="h-8 w-8 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                        e.currentTarget.nextElementSibling?.classList.remove("hidden")
                      }}
                    />
                  ) : null}
                  <div className={file.previewUrl && file.mimeType.startsWith("image/") ? "hidden" : ""}>
                    {getFileIcon(file.mimeType, "lg")}
                  </div>
                </div>

                {/* File name and metadata */}
                <div className="min-w-0 flex-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="font-medium text-sm truncate">{file?.name || "Untitled"}</h3>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{file.name}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{(file?.extension || "Untitled").toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {file.visibility === "public" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlers.copyLink()
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy public link</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlers.download()
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>

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
                    <DropdownMenuItem onClick={handlers.share}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlers.copyLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {file.isOwner && (
                      <DropdownMenuItem onClick={handlers.delete} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* File status and badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", visibilityConfig.color)}>
                <VisibilityIcon className="h-3 w-3 mr-1" />
                {visibilityConfig.label}
              </Badge>

              {file.isDuplicate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs">
                      <HardDrive className="h-3 w-3 mr-1" />
                      Deduplicated
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Saved {file.duplicateInfo?.savings ? formatFileSize(file.duplicateInfo.savings) : "storage"} via
                      deduplication
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}

              {file.downloadCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {file.downloadCount} downloads
                </Badge>
              )}

              {(file.tags || []).length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {file.tags.length}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tags: {file.tags.join(", ")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Footer with uploader and date */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-2">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={`/placeholder_icon.png?height=16&width=16`} />
                  <AvatarFallback className="text-xs">
                    {file.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{file.isOwner ? "You" : file.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatRelativeTime(file.uploadedAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
