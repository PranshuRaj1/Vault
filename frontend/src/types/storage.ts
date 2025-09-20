/**
 * Storage statistics and analytics types
 */

/**
 * Storage usage breakdown by category
 */
export interface StorageBreakdown {
  category: string
  size: number
  percentage: number
  fileCount: number
  color: string
}

/**
 * Deduplication statistics
 */
export interface DeduplicationStats {
  totalFiles: number
  uniqueFiles: number
  duplicateFiles: number
  originalSize: number
  deduplicatedSize: number
  savedBytes: number
  savedPercentage: number
  duplicateGroups: number
}

/**
 * Storage usage over time data point
 */
export interface StorageTimePoint {
  date: string
  totalSize: number
  deduplicatedSize: number
  fileCount: number
  uploadCount: number
}

/**
 * File type distribution
 */
export interface FileTypeDistribution {
  type: string
  mimeType: string
  count: number
  size: number
  percentage: number
  averageSize: number
  color: string
}

/**
 * User storage statistics
 */
export interface UserStorageStats {
  userId: string
  userName: string
  userEmail: string
  totalFiles: number
  totalSize: number
  deduplicatedSize: number
  savedBytes: number
  lastUpload: string
  quota: number
  quotaUsed: number
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  limit: number
  used: number
  available: number
  percentage: number
  isNearLimit: boolean
  isOverLimit: boolean
}

/**
 * Top files by various metrics
 */
export interface TopFile {
  id: string
  name: string
  size: number
  downloadCount: number
  uploadedBy: string
  uploadedAt: string
  mimeType: string
}

/**
 * Storage analytics summary
 */
export interface StorageAnalytics {
  totalStorage: number
  deduplicatedStorage: number
  totalFiles: number
  uniqueFiles: number
  duplicateFiles: number
  storageQuota: StorageQuota
  deduplicationStats: DeduplicationStats
  storageBreakdown: StorageBreakdown[]
  fileTypeDistribution: FileTypeDistribution[]
  storageOverTime: StorageTimePoint[]
  userStats: UserStorageStats[]
  topFilesBySize: TopFile[]
  topFilesByDownloads: TopFile[]
  recentUploads: TopFile[]
}

/**
 * Storage trend data
 */
export interface StorageTrend {
  period: "day" | "week" | "month" | "year"
  growth: number
  growthPercentage: number
  uploadTrend: number
  deduplicationTrend: number
}
