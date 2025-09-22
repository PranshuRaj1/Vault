"use client"

import * as React from "react"
import { Download, Share2, ExternalLink, Calendar, HardDrive, Tag, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FileMetadata } from "@/types/file"

interface FilePreviewModalProps {
  /** File to preview */
  file: FileMetadata | null
  /** Whether modal is open */
  open: boolean
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void
  /** File operation callbacks */
  onDownload?: (file: FileMetadata) => void
  onShare?: (file: FileMetadata) => void
  onCopyLink?: (file: FileMetadata) => void
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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * File preview modal component
 * Displays file details, metadata, and preview when available
 */
export function FilePreviewModal({ file, open, onOpenChange, onDownload, onShare, onCopyLink }: FilePreviewModalProps) {
  /**
   * Memoized file operation handlers
   */
  const handlers = React.useMemo(() => {
    if (!file) return {}
    return {
      download: () => onDownload?.(file),
      share: () => onShare?.(file),
      copyLink: () => onCopyLink?.(file),
    }
  }, [file, onDownload, onShare, onCopyLink])

  /**
   * Render file preview based on type
   */
  const renderPreview = React.useCallback(() => {
    if (!file) return null

    if (file.mimeType.startsWith("image/")) {
      return (
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          <img
            src={file.previewUrl || file.downloadUrl}
            alt={file.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=400&width=600&text=Image+Preview+Not+Available"
            }}
          />
        </div>
      )
    }

    if (file.mimeType === "application/pdf") {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-4xl">📄</div>
            <p className="text-sm text-muted-foreground">PDF Preview</p>
            <p className="text-xs text-muted-foreground">Click download to view full document</p>
          </div>
        </div>
      )
    }

    if (file.mimeType.startsWith("video/")) {
      return (
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          <video controls className="w-full h-full">
            <source src={file.downloadUrl} type={file.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (file.mimeType.startsWith("audio/")) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-4xl">🎵</div>
            <audio controls className="w-full max-w-md">
              <source src={file.downloadUrl} type={file.mimeType} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      )
    }

    // Default preview for other file types
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl">📄</div>
          <p className="text-sm text-muted-foreground">Preview not available</p>
          <p className="text-xs text-muted-foreground">Download to view this file</p>
        </div>
      </div>
    )
  }, [file])

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <DialogTitle className="text-xl truncate">{file.name}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{(file.extension.string || "Untitled").toUpperCase()}</span>
                <span>•</span>
                <span>{file.mimeType}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {file.visibility === "public" && (
                <Button variant="outline" size="sm" onClick={handlers.copyLink}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handlers.share}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm" onClick={handlers.download}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Preview area */}
            <div className="lg:col-span-2">
              <ScrollArea className="h-full">{renderPreview()}</ScrollArea>
            </div>

            {/* Metadata sidebar */}
            <div className="space-y-6">
              <ScrollArea className="h-full">
                <div className="space-y-6">
                  {/* File status and visibility */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {file.visibility === "public" ? (
                          <Badge variant="outline" className="text-green-600">
                            <Eye className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        ) : file.visibility === "shared" ? (
                          <Badge variant="outline" className="text-blue-600">
                            <Share2 className="h-3 w-3 mr-1" />
                            Shared
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Eye className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>

                      {file.isDuplicate && (
                        <Badge variant="secondary" className="text-xs">
                          <HardDrive className="h-3 w-3 mr-1" />
                          Deduplicated
                        </Badge>
                      )}

                      {file.downloadCount > 0 && (
                        <div className="text-sm text-muted-foreground">Downloaded {file.downloadCount} times</div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Upload information */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">Upload Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/placeholder-32px.png?height=32&width=32`} />
                          <AvatarFallback className="text-xs">
                            {file.uploadedBy.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{file.isOwner ? "You" : file.uploadedBy.name}</p>
                          <p className="text-xs text-muted-foreground">{file.uploadedBy.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Uploaded {formatDate(file.uploadedAt)}</span>
                      </div>

                      {file.updatedAt !== file.uploadedAt && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Modified {formatDate(file.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deduplication info */}
                  {file.isDuplicate && file.duplicateInfo && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="font-medium text-sm">Deduplication</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>This file is a duplicate of an existing file.</p>
                          <p>Original uploaded by: {file.duplicateInfo.originalUploader}</p>
                          <p>Storage saved: {formatFileSize(file.duplicateInfo.savings)}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Tags */}
                  {(file.tags || []).length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Description */}
                  {file.description && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="font-medium text-sm">Description</h3>
                        <p className="text-sm text-muted-foreground">{file.description}</p>
                      </div>
                    </>
                  )}

                  {/* Shared with */}
                  {file.sharedWith && file.sharedWith.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="font-medium text-sm">Shared With</h3>
                        <div className="space-y-2">
                          {file.sharedWith.map((share) => (
                            <div key={share.userId} className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={`/ceholder-svg-height-24.jpg?height=24&width=24`} />
                                <AvatarFallback className="text-xs">
                                  {share.userName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm">{share.userName}</p>
                                <p className="text-xs text-muted-foreground">Shared {formatDate(share.sharedAt)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Technical details */}
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">Technical Details</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>File Hash:</span>
                        <span className="font-mono text-xs">{file.hash.substring(0, 16)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>File ID:</span>
                        <span className="font-mono text-xs">{file.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
