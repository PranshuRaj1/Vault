/**
 * File sharing visibility options
 */
export type FileVisibility = "private" | "public" | "shared"

/**
 * File status for tracking upload and processing state
 */
export type FileStatus = "processing" | "ready" | "error"

/**
 * File metadata interface for the file vault system
 */
export interface FileMetadata {
  id: string
  name: string
  originalName: string
  size: number
  mimeType: string
  extension: string
  hash: string
  visibility: FileVisibility
  status: FileStatus
  uploadedAt: string
  updatedAt: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
  downloadCount: number
  isOwner: boolean
  isDuplicate: boolean
  duplicateInfo?: {
    originalFileId: string
    originalUploader: string
    uploadDate: string
    savings: number
  }
  sharedWith?: Array<{
    userId: string
    userName: string
    userEmail: string
    sharedAt: string
  }>
  tags: string[]
  description?: string
  previewUrl?: string
  downloadUrl: string
  folder?: {
    id: string
    name: string
    path: string
  }
}

/**
 * Folder structure for file organization
 */
export interface FolderStructure {
  id: string
  name: string
  path: string
  parentId?: string
  createdAt: string
  updatedAt: string
  fileCount: number
  totalSize: number
  isOwner: boolean
  visibility: FileVisibility
}

/**
 * File operation result interface
 */
export interface FileOperationResult {
  success: boolean
  message: string
  affectedFiles?: string[]
}
