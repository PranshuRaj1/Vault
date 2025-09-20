/**
 * Admin-related type definitions for the file vault system
 */

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  storageUsed: number
  storageQuota: number
  filesCount: number
  lastActive: string
  createdAt: string
  isActive: boolean
}

export interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalFiles: number
  totalStorage: number
  deduplicationSavings: number
  apiCallsToday: number
  uploadsToday: number
  downloadsToday: number
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: "upload" | "download" | "delete" | "share" | "login" | "register"
  fileId?: string
  fileName?: string
  timestamp: string
  ipAddress: string
  userAgent: string
}

export interface AdminSettings {
  defaultStorageQuota: number
  maxFileSize: number
  allowedFileTypes: string[]
  rateLimitPerSecond: number
  enablePublicSharing: boolean
  enableUserRegistration: boolean
  maintenanceMode: boolean
}
