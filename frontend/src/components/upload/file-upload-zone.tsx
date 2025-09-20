"use client"

import * as React from "react"
import { Upload, X, File, ImageIcon, FileText, Archive, Video, Music } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

/**
 * File upload status types for tracking upload progress
 */
export type UploadStatus = "pending" | "uploading" | "completed" | "error"

/**
 * Extended file interface with upload metadata
 */
export interface UploadFile extends File {
  id: string
  status: UploadStatus
  progress: number
  error?: string
  preview?: string
  isDuplicate?: boolean
  duplicateInfo?: {
    originalUploader: string
    uploadDate: string
    savings: string
  }
}

interface FileUploadZoneProps {
  /** Maximum file size in bytes (default: 50MB) */
  maxFileSize?: number
  /** Accepted file types (MIME types) */
  acceptedTypes?: string[]
  /** Maximum number of files allowed */
  maxFiles?: number
  /** Current uploaded files */
  files: UploadFile[]
  /** Callback when files are added */
  onFilesAdded: (files: File[]) => void
  /** Callback when a file is removed */
  onFileRemove: (fileId: string) => void
  /** Whether upload is in progress */
  isUploading?: boolean
  /** Custom className */
  className?: string
}

/**
 * File type icon mapping for better visual representation
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
 * Validate file type against MIME type to prevent mismatched uploads
 */
const validateFileType = (file: File): boolean => {
  // Basic MIME type validation
  // In a real application, this would include more sophisticated checks
  const extension = file.name.split(".").pop()?.toLowerCase()
  const mimeType = file.type.toLowerCase()

  // Common mismatches to check
  const mimeExtensionMap: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/gif": ["gif"],
    "application/pdf": ["pdf"],
    "text/plain": ["txt"],
    "application/zip": ["zip"],
  }

  if (mimeType && extension) {
    const expectedExtensions = mimeExtensionMap[mimeType]
    if (expectedExtensions && !expectedExtensions.includes(extension)) {
      return false
    }
  }

  return true
}

/**
 * Comprehensive file upload zone with drag & drop support
 * Includes file validation, progress tracking, and duplicate detection
 */
export function FileUploadZone({
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  acceptedTypes = [],
  maxFiles = 10,
  files,
  onFilesAdded,
  onFileRemove,
  isUploading = false,
  className,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  /**
   * Handle drag events for visual feedback
   */
  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  /**
   * Process dropped or selected files with validation
   */
  const processFiles = React.useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return

      const newFiles: File[] = []
      const errors: string[] = []

      Array.from(fileList).forEach((file) => {
        // Check file count limit
        if (files.length + newFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`)
          return
        }

        // Check file size
        if (file.size > maxFileSize) {
          errors.push(`${file.name} exceeds maximum size of ${formatFileSize(maxFileSize)}`)
          return
        }

        // Check accepted types
        if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
          errors.push(`${file.name} is not an accepted file type`)
          return
        }

        // Validate file type against extension
        if (!validateFileType(file)) {
          errors.push(`${file.name} appears to be a different file type than its extension suggests`)
          return
        }

        // Check for duplicates (by name and size)
        const isDuplicate = files.some(
          (existingFile) => existingFile.name === file.name && existingFile.size === file.size,
        )
        if (isDuplicate) {
          errors.push(`${file.name} is already in the upload queue`)
          return
        }

        newFiles.push(file)
      })

      // Show errors if any
      if (errors.length > 0) {
        console.error("File validation errors:", errors)
        // TODO: Show toast notifications for errors
      }

      // Add valid files
      if (newFiles.length > 0) {
        onFilesAdded(newFiles)
      }
    },
    [files, maxFiles, maxFileSize, acceptedTypes, onFilesAdded],
  )

  /**
   * Handle file drop
   */
  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      processFiles(e.dataTransfer.files)
    },
    [processFiles],
  )

  /**
   * Handle file input change
   */
  const handleFileInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files)
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [processFiles],
  )

  /**
   * Open file picker
   */
  const openFilePicker = React.useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  /**
   * Memoized file list rendering for performance
   */
  const fileListItems = React.useMemo(
    () =>
      files.map((file) => {
        const FileIcon = getFileIcon(file.type)
        return (
          <Card key={file.id} className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    {file.isDuplicate && (
                      <Badge variant="secondary" className="text-xs">
                        Duplicate
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  {file.status === "uploading" && (
                    <div className="mt-2">
                      <Progress value={file.progress} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">{file.progress}% uploaded</p>
                    </div>
                  )}
                  {file.status === "error" && <p className="text-xs text-destructive mt-1">{file.error}</p>}
                  {file.isDuplicate && file.duplicateInfo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Original uploaded by {file.duplicateInfo.originalUploader} on {file.duplicateInfo.uploadDate}
                      <br />
                      Storage saved: {file.duplicateInfo.savings}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onFileRemove(file.id)}
                  disabled={file.status === "uploading"}
                  className="flex-shrink-0 h-8 w-8"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      }),
    [files, onFileRemove],
  )

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-muted/25",
          isDragOver && "border-primary bg-primary/5",
          isUploading && "pointer-events-none opacity-50",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{isDragOver ? "Drop files here" : "Upload your files"}</h3>
            <p className="text-sm text-muted-foreground">Drag and drop files here, or click to browse</p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <span>Max size: {formatFileSize(maxFileSize)}</span>
              <span>•</span>
              <span>Max files: {maxFiles}</span>
              {acceptedTypes.length > 0 && (
                <>
                  <span>•</span>
                  <span>Accepted: {acceptedTypes.join(", ")}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Files to upload ({files.length}/{maxFiles})
            </h4>
            {files.length > 0 && !isUploading && (
              <Button variant="outline" size="sm" onClick={() => files.forEach((file) => onFileRemove(file.id))}>
                Clear All
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">{fileListItems}</div>
        </div>
      )}
    </div>
  )
}
