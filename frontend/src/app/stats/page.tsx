"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { StorageOverviewCards } from "@/components/storage/storage-overview-cards"
import { StorageCharts } from "@/components/storage/storage-charts"
import { TopFilesTable } from "@/components/storage/top-files-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Download, TrendingUp, AlertTriangle, Info } from "lucide-react"
import type { StorageAnalytics, StorageTrend } from "@/types/storage"

/**
 * Mock user data
 */
const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "/diverse-user-avatars.png",
  role: "admin" as const,
}

/**
 * Mock storage analytics data
 */
const mockAnalytics: StorageAnalytics = {
  totalStorage: 15728640000, // ~14.6 GB
  deduplicatedStorage: 11796480000, // ~11 GB
  totalFiles: 1247,
  uniqueFiles: 1089,
  duplicateFiles: 158,
  storageQuota: {
    limit: 21474836480, // 20 GB
    used: 11796480000, // ~11 GB
    available: 9678356480, // ~9 GB
    percentage: 54.9,
    isNearLimit: false,
    isOverLimit: false,
  },
  deduplicationStats: {
    totalFiles: 1247,
    uniqueFiles: 1089,
    duplicateFiles: 158,
    originalSize: 15728640000,
    deduplicatedSize: 11796480000,
    savedBytes: 3932160000, // ~3.66 GB
    savedPercentage: 25.0,
    duplicateGroups: 89,
  },
  storageBreakdown: [
    { category: "Images", size: 4718592000, percentage: 40.0, fileCount: 456, color: "#3b82f6" },
    { category: "Documents", size: 3538944000, percentage: 30.0, fileCount: 234, color: "#ef4444" },
    { category: "Videos", size: 2359296000, percentage: 20.0, fileCount: 89, color: "#22c55e" },
    { category: "Archives", size: 1179648000, percentage: 10.0, fileCount: 67, color: "#f59e0b" },
  ],
  fileTypeDistribution: [
    {
      type: "JPEG",
      mimeType: "image/jpeg",
      count: 234,
      size: 2359296000,
      percentage: 20.0,
      averageSize: 10080000,
      color: "#3b82f6",
    },
    {
      type: "PNG",
      mimeType: "image/png",
      count: 156,
      size: 1569792000,
      percentage: 13.3,
      averageSize: 10064000,
      color: "#06b6d4",
    },
    {
      type: "PDF",
      mimeType: "application/pdf",
      count: 123,
      size: 2949120000,
      percentage: 25.0,
      averageSize: 23968000,
      color: "#ef4444",
    },
    {
      type: "MP4",
      mimeType: "video/mp4",
      count: 45,
      size: 2359296000,
      percentage: 20.0,
      averageSize: 52428800,
      color: "#22c55e",
    },
    {
      type: "ZIP",
      mimeType: "application/zip",
      count: 67,
      size: 1179648000,
      percentage: 10.0,
      averageSize: 17607000,
      color: "#f59e0b",
    },
    {
      type: "DOCX",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      count: 89,
      size: 589824000,
      percentage: 5.0,
      averageSize: 6628000,
      color: "#8b5cf6",
    },
  ],
  storageOverTime: [
    { date: "2024-01-01", totalSize: 10737418240, deduplicatedSize: 8589934592, fileCount: 1000, uploadCount: 50 },
    { date: "2024-01-08", totalSize: 11811160064, deduplicatedSize: 9663676416, fileCount: 1050, uploadCount: 45 },
    { date: "2024-01-15", totalSize: 13958643712, deduplicatedSize: 10737418240, fileCount: 1120, uploadCount: 67 },
    { date: "2024-01-22", totalSize: 15032385536, deduplicatedSize: 11274289152, fileCount: 1180, uploadCount: 52 },
    { date: "2024-01-29", totalSize: 15728640000, deduplicatedSize: 11796480000, fileCount: 1247, uploadCount: 43 },
  ],
  userStats: [
    {
      userId: "user_1",
      userName: "John Doe",
      userEmail: "john.doe@example.com",
      totalFiles: 234,
      totalSize: 2359296000,
      deduplicatedSize: 1769472000,
      savedBytes: 589824000,
      lastUpload: "2024-01-29T10:30:00Z",
      quota: 5368709120,
      quotaUsed: 32.9,
    },
    {
      userId: "user_2",
      userName: "Jane Smith",
      userEmail: "jane.smith@example.com",
      totalFiles: 189,
      totalSize: 1887436800,
      deduplicatedSize: 1415577600,
      savedBytes: 471859200,
      lastUpload: "2024-01-28T15:45:00Z",
      quota: 5368709120,
      quotaUsed: 26.4,
    },
    {
      userId: "user_3",
      userName: "Bob Wilson",
      userEmail: "bob.wilson@example.com",
      totalFiles: 156,
      totalSize: 1569792000,
      deduplicatedSize: 1177344000,
      savedBytes: 392448000,
      lastUpload: "2024-01-27T09:15:00Z",
      quota: 5368709120,
      quotaUsed: 21.9,
    },
  ],
  topFilesBySize: [
    {
      id: "file_1",
      name: "4K_Video_Demo.mp4",
      size: 524288000,
      downloadCount: 23,
      uploadedBy: "John Doe",
      uploadedAt: "2024-01-15T10:30:00Z",
      mimeType: "video/mp4",
    },
    {
      id: "file_2",
      name: "Database_Backup_Jan.zip",
      size: 314572800,
      downloadCount: 5,
      uploadedBy: "Jane Smith",
      uploadedAt: "2024-01-20T14:20:00Z",
      mimeType: "application/zip",
    },
    {
      id: "file_3",
      name: "High_Res_Photos.zip",
      size: 209715200,
      downloadCount: 12,
      uploadedBy: "Bob Wilson",
      uploadedAt: "2024-01-18T11:45:00Z",
      mimeType: "application/zip",
    },
  ],
  topFilesByDownloads: [
    {
      id: "file_4",
      name: "User_Manual_v2.pdf",
      size: 10485760,
      downloadCount: 89,
      uploadedBy: "Alice Johnson",
      uploadedAt: "2024-01-10T16:30:00Z",
      mimeType: "application/pdf",
    },
    {
      id: "file_5",
      name: "Product_Demo.mp4",
      size: 52428800,
      downloadCount: 67,
      uploadedBy: "Charlie Brown",
      uploadedAt: "2024-01-12T09:15:00Z",
      mimeType: "video/mp4",
    },
    {
      id: "file_6",
      name: "Company_Logo.png",
      size: 2097152,
      downloadCount: 45,
      uploadedBy: "Diana Prince",
      uploadedAt: "2024-01-08T13:20:00Z",
      mimeType: "image/png",
    },
  ],
  recentUploads: [
    {
      id: "file_7",
      name: "Meeting_Notes_Jan29.docx",
      size: 1048576,
      downloadCount: 3,
      uploadedBy: "John Doe",
      uploadedAt: "2024-01-29T14:30:00Z",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    {
      id: "file_8",
      name: "Screenshot_2024.png",
      size: 3145728,
      downloadCount: 1,
      uploadedBy: "Jane Smith",
      uploadedAt: "2024-01-29T11:15:00Z",
      mimeType: "image/png",
    },
    {
      id: "file_9",
      name: "Budget_Q1_2024.xlsx",
      size: 2097152,
      downloadCount: 7,
      uploadedBy: "Bob Wilson",
      uploadedAt: "2024-01-28T16:45:00Z",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  ],
}

/**
 * Mock storage trend data
 */
const mockTrends: StorageTrend = {
  period: "month",
  growth: 3932160000, // ~3.66 GB
  growthPercentage: 33.3,
  uploadTrend: 12.5,
  deduplicationTrend: 8.7,
}

/**
 * Storage statistics page component
 * Provides comprehensive storage analytics and insights
 */
export default function StorageStatsPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [analytics, setAnalytics] = React.useState<StorageAnalytics>(mockAnalytics)
  const [trends, setTrends] = React.useState<StorageTrend>(mockTrends)

  /**
   * Refresh analytics data
   */
  const handleRefresh = React.useCallback(async () => {
    setIsLoading(true)
    // TODO: Implement actual API call
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }, [])

  /**
   * Export analytics data
   */
  const handleExport = React.useCallback(() => {
    const dataStr = JSON.stringify(analytics, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `storage-analytics-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [analytics])

  /**
   * Storage health alerts
   */
  const storageAlerts = React.useMemo(() => {
    const alerts = []

    if (analytics.storageQuota.isOverLimit) {
      alerts.push({
        type: "error" as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        message: "Storage quota exceeded. Please free up space or increase your quota.",
      })
    } else if (analytics.storageQuota.isNearLimit) {
      alerts.push({
        type: "warning" as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        message: "Storage quota is nearly full. Consider cleaning up old files.",
      })
    }

    if (analytics.deduplicationStats.savedPercentage > 30) {
      alerts.push({
        type: "info" as const,
        icon: <TrendingUp className="h-4 w-4" />,
        message: `Excellent deduplication efficiency! You're saving ${analytics.deduplicationStats.savedPercentage.toFixed(1)}% of storage space.`,
      })
    }

    return alerts
  }, [analytics])

  return (
    <MainLayout user={mockUser} notificationCount={3}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Storage Statistics</h1>
            <p className="text-muted-foreground">
              Comprehensive analytics and insights about your file storage usage and efficiency.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Storage alerts */}
        {storageAlerts.length > 0 && (
          <div className="space-y-2">
            {storageAlerts.map((alert, index) => (
              <Alert key={index} variant={alert.type === "error" ? "destructive" : "default"}>
                {alert.icon}
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Overview cards */}
        <StorageOverviewCards analytics={analytics} trends={trends} isLoading={isLoading} />

        {/* Charts section */}
        <StorageCharts analytics={analytics} isLoading={isLoading} />

        {/* Top files table */}
        <TopFilesTable
          topFilesBySize={analytics.topFilesBySize}
          topFilesByDownloads={analytics.topFilesByDownloads}
          recentUploads={analytics.recentUploads}
          isLoading={isLoading}
        />

        {/* Additional insights */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Storage Efficiency</CardTitle>
              <CardDescription>How well your storage is optimized</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Deduplication Rate</span>
                  <span className="text-sm font-medium">
                    {analytics.deduplicationStats.savedPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Duplicate Files</span>
                  <span className="text-sm font-medium">
                    {analytics.duplicateFiles} of {analytics.totalFiles}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage Saved</span>
                  <span className="text-sm font-medium text-green-600">
                    {(analytics.deduplicationStats.savedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>Storage growth over the past month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage Growth</span>
                  <span className="text-sm font-medium text-blue-600">+{trends.growthPercentage.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Upload Activity</span>
                  <span className="text-sm font-medium text-green-600">+{trends.uploadTrend.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Deduplication Efficiency</span>
                  <span className="text-sm font-medium text-purple-600">+{trends.deduplicationTrend.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data freshness info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                Data last updated: {new Date().toLocaleString()}. Statistics are calculated in real-time and may take a
                few minutes to reflect recent changes.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
