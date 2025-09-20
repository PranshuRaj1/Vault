"use client"

import * as React from "react"
import type { UploadFile, UploadStatus } from "@/components/upload/file-upload-zone"

/**
 * Configuration for file upload hook
 */
interface UseFileUploadConfig {
  /** API endpoint for file upload */
  uploadEndpoint?: string
  /** Maximum concurrent uploads */
  maxConcurrentUploads?: number
  /** Chunk size for large file uploads (in bytes) */
  chunkSize?: number
  /** Enable duplicate detection */
  enableDuplicateDetection?: boolean
}

/**
 * Upload statistics interface
 */
interface UploadStats {
  totalFiles: number
  completedFiles: number
  failedFiles: number
  totalBytes: number
  uploadedBytes: number
  overallProgress: number
  isComplete: boolean
}

/**
 * Custom hook for managing file uploads with progress tracking
 * Handles multiple files, duplicate detection, and error recovery
 */
export function useFileUpload(config: UseFileUploadConfig = {}) {
  const {
    uploadEndpoint = "/api/files/upload",
    maxConcurrentUploads = 3,
    chunkSize = 1024 * 1024, // 1MB chunks
    enableDuplicateDetection = true,
  } = config

  const [files, setFiles] = React.useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = React.useState(false)
  const uploadQueueRef = React.useRef<string[]>([])
  const activeUploadsRef = React.useRef<Set<string>>(new Set())

  /**
   * Generate unique ID for files
   */
  const generateFileId = React.useCallback(() => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  /**
   * Add files to upload queue
   */
  const addFiles = React.useCallback(
    (newFiles: File[]) => {
      const uploadFiles: UploadFile[] = newFiles.map((file) => ({
        ...file,
        id: generateFileId(),
        status: "pending" as UploadStatus,
        progress: 0,
      }))

      setFiles((prev) => [...prev, ...uploadFiles])
      uploadQueueRef.current.push(...uploadFiles.map((f) => f.id))
    },
    [generateFileId],
  )

  /**
   * Remove file from queue
   */
  const removeFile = React.useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
    uploadQueueRef.current = uploadQueueRef.current.filter((id) => id !== fileId)
    activeUploadsRef.current.delete(fileId)
  }, [])

  /**
   * Clear all files
   */
  const clearFiles = React.useCallback(() => {
    setFiles([])
    uploadQueueRef.current = []
    activeUploadsRef.current.clear()
  }, [])

  /**
   * Simulate duplicate detection (in real app, this would call the backend)
   */
  const checkForDuplicates = React.useCallback(
    async (file: UploadFile): Promise<UploadFile> => {
      if (!enableDuplicateDetection) return file

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Simulate 20% chance of duplicate detection
      const isDuplicate = Math.random() < 0.2

      if (isDuplicate) {
        return {
          ...file,
          isDuplicate: true,
          duplicateInfo: {
            originalUploader: "jane.doe@example.com",
            uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            savings: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          },
        }
      }

      return file
    },
    [enableDuplicateDetection],
  )

  /**
   * Upload a single file with progress tracking
   */
  const uploadFile = React.useCallback(
    async (fileId: string): Promise<void> => {
      const file = files.find((f) => f.id === fileId)
      if (!file) return

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: "uploading" as UploadStatus, progress: 0 } : f)),
        )

        // Check for duplicates first
        const checkedFile = await checkForDuplicates(file)
        if (checkedFile.isDuplicate) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    ...checkedFile,
                    status: "completed" as UploadStatus,
                    progress: 100,
                  }
                : f,
            ),
          )
          return
        }

        // Simulate file upload with progress
        const totalChunks = Math.ceil(file.size / chunkSize)
        for (let chunk = 0; chunk < totalChunks; chunk++) {
          // Simulate chunk upload delay
          await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200))

          const progress = Math.round(((chunk + 1) / totalChunks) * 100)
          setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress } : f)))

          // Simulate random upload errors (5% chance)
          if (Math.random() < 0.05) {
            throw new Error("Network error during upload")
          }
        }

        // Mark as completed
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "completed" as UploadStatus,
                  progress: 100,
                }
              : f,
          ),
        )
      } catch (error) {
        // Mark as error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error" as UploadStatus,
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f,
          ),
        )
      } finally {
        activeUploadsRef.current.delete(fileId)
      }
    },
    [files, chunkSize, checkForDuplicates],
  )

  /**
   * Process upload queue with concurrency control
   */
  const processUploadQueue = React.useCallback(async () => {
    while (uploadQueueRef.current.length > 0 && activeUploadsRef.current.size < maxConcurrentUploads) {
      const fileId = uploadQueueRef.current.shift()
      if (fileId) {
        activeUploadsRef.current.add(fileId)
        uploadFile(fileId)
      }
    }
  }, [uploadFile, maxConcurrentUploads])

  /**
   * Start upload process
   */
  const startUpload = React.useCallback(async () => {
    if (files.length === 0 || isUploading) return

    setIsUploading(true)
    uploadQueueRef.current = files.filter((f) => f.status === "pending").map((f) => f.id)

    // Process queue until all files are uploaded
    const processInterval = setInterval(() => {
      processUploadQueue()

      // Check if all uploads are complete
      const allComplete = files.every((f) => f.status === "completed" || f.status === "error")
      const noActiveUploads = activeUploadsRef.current.size === 0
      const queueEmpty = uploadQueueRef.current.length === 0

      if (allComplete && noActiveUploads && queueEmpty) {
        clearInterval(processInterval)
        setIsUploading(false)
      }
    }, 100)
  }, [files, isUploading, processUploadQueue])

  /**
   * Cancel ongoing uploads
   */
  const cancelUpload = React.useCallback(() => {
    setIsUploading(false)
    uploadQueueRef.current = []
    activeUploadsRef.current.clear()

    // Reset uploading files to pending
    setFiles((prev) =>
      prev.map((f) => (f.status === "uploading" ? { ...f, status: "pending" as UploadStatus, progress: 0 } : f)),
    )
  }, [])

  /**
   * Retry failed uploads
   */
  const retryFailedUploads = React.useCallback(() => {
    const failedFiles = files.filter((f) => f.status === "error")
    if (failedFiles.length === 0) return

    // Reset failed files to pending
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "error"
          ? {
              ...f,
              status: "pending" as UploadStatus,
              progress: 0,
              error: undefined,
            }
          : f,
      ),
    )

    // Add to queue and start upload
    uploadQueueRef.current.push(...failedFiles.map((f) => f.id))
    if (!isUploading) {
      startUpload()
    }
  }, [files, isUploading, startUpload])

  /**
   * Calculate upload statistics
   */
  const stats: UploadStats = React.useMemo(() => {
    const totalFiles = files.length
    const completedFiles = files.filter((f) => f.status === "completed").length
    const failedFiles = files.filter((f) => f.status === "error").length
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0)
    const uploadedBytes = files.reduce((sum, f) => sum + (f.size * f.progress) / 100, 0)
    const overallProgress = totalBytes > 0 ? (uploadedBytes / totalBytes) * 100 : 0
    const isComplete = totalFiles > 0 && completedFiles + failedFiles === totalFiles

    return {
      totalFiles,
      completedFiles,
      failedFiles,
      totalBytes,
      uploadedBytes,
      overallProgress,
      isComplete,
    }
  }, [files])

  return {
    files,
    isUploading,
    stats,
    addFiles,
    removeFile,
    clearFiles,
    startUpload,
    cancelUpload,
    retryFailedUploads,
  }
}
