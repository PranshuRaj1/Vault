"use client"

import * as React from "react"
import { CheckCircle, XCircle, AlertCircle, Upload, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
// Removed Badge import
import type { UploadFile } from "./file-upload-zone"

interface UploadProgressModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void
  /** Files being uploaded */
  files: UploadFile[]
  /** Overall upload progress (0-100) */
  overallProgress: number
  /** Whether upload is complete */
  isComplete: boolean
  /** Number of successful uploads */
  successCount: number
  /** Number of failed uploads */
  errorCount: number
  /** Callback to retry failed uploads */
  onRetry?: () => void
  /** Callback to cancel upload */
  onCancel?: () => void
}

/**
 * Modal component for displaying upload progress
 */
export function UploadProgressModal({
  open,
  onOpenChange,
  files,
  overallProgress,
  isComplete,
  successCount,
  errorCount,
  onRetry,
  onCancel,
}: UploadProgressModalProps) {
  /**
   * Get status icon based on file upload status
   */
  const getStatusIcon = React.useCallback((status: UploadFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "uploading":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }, [])

  /**
   * Memoized file list for performance
   */
  const fileList = React.useMemo(
    () =>
      files.map((file) => (
        <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border">
          <div className="flex-shrink-0">{getStatusIcon(file.status)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress
                value={file.progress}
                className="flex-1 h-1"
                variant={file.status === "completed" ? "success" : "default"}
              />
              <span className="text-xs text-muted-foreground">{file.progress}%</span>
            </div>
            {file.error && <p className="text-xs text-destructive mt-1">{file.error}</p>}
          </div>
        </div>
      )),
    [files, getStatusIcon],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {isComplete ? "Upload Complete" : "Uploading Files"}
          </DialogTitle>
          <DialogDescription>
            {isComplete
              ? `Upload finished: ${successCount} successful, ${errorCount} failed`
              : `Uploading ${files.length} files...`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto p-1">
          {/* Overall progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <Progress
              value={overallProgress}
              className="h-2"
              variant={isComplete && errorCount === 0 ? "success" : "default"}
            />
          </div>

          {/* File list */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Files</h4>
            <div className="space-y-2">{fileList}</div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          {!isComplete && onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel Upload
            </Button>
          )}
          {isComplete && errorCount > 0 && onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Retry Failed
            </Button>
          )}
          {isComplete && <Button onClick={() => onOpenChange(false)}>{errorCount > 0 ? "Close" : "Done"}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}