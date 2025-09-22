"use client"

import * as React from "react"
import type { UploadFile, UploadStatus } from "@/components/upload/file-upload-zone"

// Define the API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

/**
 * Configuration for file upload hook
 */
interface UseFileUploadConfig {
  /** API endpoint for file upload */
  uploadEndpoint?: string
  /** Maximum concurrent uploads */
  maxConcurrentUploads?: number
}

/**
 * Upload statistics interface
 */
interface UploadStats {
  totalFiles: number
  completedFiles: number
  failedFiles: number
  overallProgress: number
  isComplete: boolean
}

/**
* Helper function to immutably create a new UploadFile
* This is the core of the fix.
*/
function createNewUploadFile(
  f: UploadFile,
  newStatus: UploadStatus,
  newProgress: number,
  newError?: string,
): UploadFile {
  // 1. Create a new File object from the old one
  const newFile = new File([f], f.name, { type: f.type, lastModified: f.lastModified }) as UploadFile
  
  // 2. Copy over all our custom properties
  newFile.id = f.id // Preserve the original ID
  newFile.status = newStatus
  newFile.progress = newProgress
  newFile.error = newError
  
  return newFile
}

/**
 * Custom hook for managing file uploads with progress tracking
 * Handles multiple files, duplicate detection, and error recovery
 */
export function useFileUpload(config: UseFileUploadConfig = {}) {
  const {
    uploadEndpoint = `${API_BASE_URL}/api/files`,
    maxConcurrentUploads = 3,
  } = config

  const [files, setFiles] = React.useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = React.useState(false)
  const uploadQueueRef = React.useRef<string[]>([])
  const activeUploadsRef = React.useRef<Set<string>>(new Set())
  const uploadOptionsRef = React.useRef({ visibility: "private" })

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
      // This fix is from last time, and it's correct.
      const uploadFiles = newFiles.map((file) => {
        const uploadFile = file as UploadFile
        uploadFile.id = generateFileId()
        uploadFile.status = "pending"
        uploadFile.progress = 0
        return uploadFile
      })

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
    setIsUploading(false)
  }, [])

  /**
   * Upload a single file with progress tracking
   */
  const uploadFile = React.useCallback(
    async (fileId: string): Promise<void> => {
      const file = files.find((f) => f.id === fileId)
      if (!file || file.status === "uploading") return

      try {
  
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? createNewUploadFile(f, "uploading", 50) : f,
          ),
        )

        // Create form data
        const formData = new FormData()
        formData.append("files", file)

        formData.append("visibility", uploadOptionsRef.current.visibility)

        // Perform the actual upload
        const response = await fetch(uploadEndpoint, {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Upload failed")
        }

 
        // Mark as completed
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? createNewUploadFile(f, "completed", 100) : f,
          ),
        )
      } catch (error) {
     
        // Mark as error
        const errorMsg = error instanceof Error ? error.message : "Upload failed"
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? createNewUploadFile(f, "error", 0, errorMsg) : f,
          ),
        )
      } finally {
        activeUploadsRef.current.delete(fileId)
        processUploadQueue()
      }
    },
    [files, uploadEndpoint], 
  )

  /**
   * Process upload queue with concurrency control
   */
  const processUploadQueue = React.useCallback(async () => {
    if (activeUploadsRef.current.size >= maxConcurrentUploads) {
      return
    }

    const fileId = uploadQueueRef.current.shift()
    if (!fileId) {
      if (activeUploadsRef.current.size === 0) {
        setIsUploading(false)
      }
      return
    }

    activeUploadsRef.current.add(fileId)
    await uploadFile(fileId)
  }, [uploadFile, maxConcurrentUploads])

  /**
   * Start upload process
   */
  const startUpload = React.useCallback(async (options: { visibility: string }) => {
    if (files.length === 0 || isUploading) return

    uploadOptionsRef.current = options


    setIsUploading(true)
    uploadQueueRef.current = files.filter((f) => f.status === "pending" || f.status === "error").map((f) => f.id)


    // Reset error files to pending
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "error" ? createNewUploadFile(f, "pending", 0) : f,
      ),
    )

    for (let i = 0; i < maxConcurrentUploads; i++) {
      processUploadQueue()
    }
  }, [files, isUploading, maxConcurrentUploads, processUploadQueue])

  /**
   * Cancel ongoing uploads
   */
  const cancelUpload = React.useCallback(() => {
    setIsUploading(false)
    uploadQueueRef.current = []
    activeUploadsRef.current.clear()

    // Reset uploading files to pending
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "uploading" ? createNewUploadFile(f, "pending", 0) : f,
      ),
    )
  }, [])

  /**
   * Retry failed uploads (now just an alias for startUpload)
   */
  const retryFailedUploads = React.useCallback(() => {
    startUpload({ visibility: uploadOptionsRef.current.visibility || "private" })
  }, [startUpload])

  /**
   * Calculate upload statistics
   */
  const stats: UploadStats = React.useMemo(() => {
    const totalFiles = files.length
    if (totalFiles === 0) {
      return { totalFiles: 0, completedFiles: 0, failedFiles: 0, overallProgress: 0, isComplete: false }
    }
    
    const completedFiles = files.filter((f) => f.status === "completed").length
    const failedFiles = files.filter((f) => f.status === "error").length
    const processedFiles = completedFiles + failedFiles
    const overallProgress = (processedFiles / totalFiles) * 100
    const isComplete = totalFiles > 0 && processedFiles === totalFiles

    return {
      totalFiles,
      completedFiles,
      failedFiles,
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