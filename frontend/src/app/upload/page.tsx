"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { FileUploadZone } from "@/components/upload/file-upload-zone"
import { UploadProgressModal } from "@/components/upload/upload-progress-modal"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileCheck,
  AlertTriangle,
  Info,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"

/**
 * Upload configuration constants
 */
const UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
  acceptedTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/zip",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
}

/**
 * File upload page component
 */
export default function UploadPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const { files, isUploading, stats, addFiles, removeFile, clearFiles, startUpload, cancelUpload, retryFailedUploads } =
    useFileUpload({
      maxConcurrentUploads: 3,
    })

  const [showProgressModal, setShowProgressModal] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = React.useState<string | null>(null)

  // Auth check effect
  React.useEffect(() => {
    if (isAuthLoading) {
      return // Wait for auth check
    }
    if (!user) {
      console.log("No user, redirecting to /auth")
      router.push("/auth")
    }
  }, [user, isAuthLoading, router])

  // Effect to show success/error message when upload completes
  React.useEffect(() => {
    if (stats.isComplete && !isUploading) {
      if (stats.failedFiles > 0) {
        setUploadError(
          `${stats.failedFiles} file(s) failed to upload. ${stats.completedFiles} succeeded.`,
        )
        setUploadSuccess(null)
      } else if (stats.completedFiles > 0) {
        setUploadSuccess(`${stats.completedFiles} file(s) uploaded successfully!`)
        setUploadError(null)
      }
    }
  }, [stats.isComplete, stats.failedFiles, stats.completedFiles, isUploading])

  /**
   * Handle upload start with progress modal
   */
  const handleStartUpload = React.useCallback(() => {
    if (files.length === 0) return
    // Clear previous messages
    setUploadError(null)
    setUploadSuccess(null)
    setShowProgressModal(true)
    startUpload()
  }, [files.length, startUpload])

  /**
   * Handle progress modal close
   */
  const handleProgressModalClose = React.useCallback(
    (open: boolean) => {
      if (!isUploading || stats.isComplete) {
        setShowProgressModal(open)
        // If upload is complete, clear the file list
        if (stats.isComplete) {
          clearFiles()
        }
      }
    },
    [isUploading, stats.isComplete, clearFiles],
  )

  /**
   * Memoized upload summary for performance
   */
  const uploadSummary = React.useMemo(() => {
    if (files.length === 0) return null

    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const formatSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    return {
      fileCount: files.length,
      totalSize: formatSize(totalSize),
    }
  }, [files])

  // Show loading spinner while checking auth
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // Show spinner if redirecting
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // NOTE: This assumes your `user` object from `useAuth`
  // has `name`, `email`, and `role`. If not, you may need
  // to fetch stats like you do on the DashboardPage or
  // update your /api/me endpoint and AuthContext.
  const layoutUser = {
    name: user.username || "User",
    email: user.email || "",
    role: (user.userRole as "user" | "admin") || "user",
  }

  return (
    <MainLayout user={layoutUser} notificationCount={3}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Upload Files</h1>
          <p className="text-muted-foreground">
            Upload single or multiple files with drag & drop support. Files are automatically checked for
            duplicates to save storage space.
          </p>
        </div>

        {/* --- ALERTS --- */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        {uploadSuccess && (
          <Alert variant="default" className="border-green-600 bg-green-50 text-green-700">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>{uploadSuccess}</AlertDescription>
          </Alert>
        )}
        {/* --- END ALERTS --- */}


        {/* Upload guidelines */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Upload Guidelines:</strong> Maximum file size is 50MB. Up to 10 files can be uploaded at
            once. Supported formats include images, documents, PDFs, and archives.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main upload area */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  File Upload
                </CardTitle>
                <CardDescription>
                  Select files to upload or drag and drop them into the area below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  maxFileSize={UPLOAD_CONFIG.maxFileSize}
                  maxFiles={UPLOAD_CONFIG.maxFiles}
                  acceptedTypes={UPLOAD_CONFIG.acceptedTypes}
                  files={files}
                  onFilesAdded={addFiles}
                  onFileRemove={removeFile}
                  isUploading={isUploading}
                />
              </CardContent>
            </Card>

            {/* Upload actions */}
            {files.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Ready to upload</p>
                      <p className="text-xs text-muted-foreground">{files.length} files selected</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={clearFiles} disabled={isUploading}>
                        Clear All
                      </Button>
                      <Button
                        onClick={handleStartUpload}
                        disabled={isUploading || files.length === 0}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Start Upload"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Upload summary sidebar */}
          <div className="space-y-6">
            {/* Current session summary */}
            {uploadSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Files</span>
                      <span className="text-sm font-medium">{uploadSummary.fileCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Size</span>
                      <span className="text-sm font-medium">{uploadSummary.totalSize}</span>
                    </div>
                  </div>

                  {stats.isComplete && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Upload Complete</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats.completedFiles} successful, {stats.failedFiles} failed
                      </div>
                      {stats.failedFiles > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={retryFailedUploads}
                          className="w-full bg-transparent"
                        >
                          Retry Failed
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upload tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <FileCheck className="h-4 w-4 mt-0.5 text-green-600" />
                  <span>Files are automatically scanned for duplicates to save storage space</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600" />
                  <span>File extensions are validated against content to prevent mismatched uploads</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upload progress modal */}
        <UploadProgressModal
          open={showProgressModal}
          onOpenChange={handleProgressModalClose}
          files={files}
          overallProgress={stats.overallProgress}
          isComplete={stats.isComplete}
          successCount={stats.completedFiles}
          errorCount={stats.failedFiles}
          onRetry={retryFailedUploads}
          onCancel={cancelUpload}
        />
      </div>
    </MainLayout>
  )
}