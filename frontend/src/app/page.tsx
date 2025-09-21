"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Files, Upload, HardDrive, TrendingUp, Share2, Shield, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// Define the structure of our dashboard data
interface DashboardStats {
  username: string
  email: string
  role: "user" | "admin"
  totalFiles: number
  totalStorage: number // in bytes
}

// Helper to format bytes into KB, MB, GB
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

/**
 * Mock dashboard statistics
 * In a real application, this would be fetched from the Go backend API
 */
const dashboardStats = {
  // These mocks aren't used when the fetch is active, which is good.
  totalFiles: 1247,
  totalStorage: "8.4 GB",
  savedStorage: "2.1 GB",
  savingsPercentage: 25,
  publicFiles: 89,
  privateFiles: 1158,
  recentUploads: 23,
}

/**
 * Dashboard page component
 * Provides overview of file vault statistics and quick actions
 * Responsive grid layout with informative cards
 */
export default function DashboardPage() {
  // user details
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  // State for our fetched dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Upload logic
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard-stats`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to fetch dashboard data")
      }

      const data: DashboardStats = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch dashboard data when auth is ready
  useEffect(() => {
    if (isAuthLoading) {
      return
    }
    if (!user) {
      console.log("No user, redirecting to /auth")
      router.push("/auth")
      return
    }

 
    fetchDashboardData()
  }, [user, isAuthLoading, router, fetchDashboardData]) // Re-run when auth state changes

  const handleUpload = async (files: FileList) => {
    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i])
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/files`, {
        method: "POST",
        credentials: "include", // Sends the httpOnly auth cookie
        body: formData,
     
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      const fileCount = files.length
      setUploadSuccess(`${fileCount} file(s) uploaded successfully!`)

      // Refresh dashboard stats to show new file count and storage
      await fetchDashboardData()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsUploading(false)
    }
  }


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUpload(files)
    }
    // Clear the input value so selecting the same file again still triggers onChange
    if (e.target) {
      e.target.value = ""
    }
  }


  /**
   * Memoized quick action handlers to prevent unnecessary re-renders
   */
  const quickActions = useMemo(
    () => ({
      uploadFiles: () => {
        fileInputRef.current?.click()
      },
      viewFiles: () => {
        console.log("Navigating to files...")
      },
      viewStats: () => {
        console.log("Navigating to statistics...")
      },
      adminPanel: () => {
        console.log("Navigating to admin panel...")
      },
    }),
    [], // No dependencies needed here
  )

  // --- Render Logic ---

  // 1. Show spinner if EITHER auth is checking OR we are fetching data
  if (isAuthLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // 2. Auth is done, not loading data, but we have an error
  if (error) {
    return (
      <div className="container mx-auto max-w-lg p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }


  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // 4. If we get here, user exists, but stats are null (e.g., fetch failed)
  if (!stats) {
    return (
      <div className="container mx-auto max-w-lg p-4">
        <Alert variant="destructive">
          <AlertDescription>
            Could not load dashboard data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // 5. Happy Path: Auth is done, user exists, and we have stats!
  return (
    <>

    <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple // Allow multiple file selection
        disabled={isUploading}
      />

    <MainLayout user={{ name: stats.username, email: stats.email, role: stats.role }} notificationCount={3}>
      <div className="space-y-6">

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
        {/* Welcome section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {stats.username}</h1>
          <p className="text-muted-foreground">Here's an overview of your file vault activity and storage usage.</p>
        </div>

        {/* Statistics grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Files Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <Files className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles.toLocaleString()}</div>
              {/* <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{stats.totalFiles.recentUploads}</span> from last week
              </p> */}
            </CardContent>
          </Card>

          {/* Storage Usage Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.totalStorage)}</div>
              {/* <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">{dashboardStats.savedStorage} saved</span> via deduplication
              </p> */}
            </CardContent>
          </Card>

          {/* Storage Savings Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{dashboardStats.savingsPercentage}%</div> */}
              <p className="text-xs text-muted-foreground">Efficiency through deduplication</p>
            </CardContent>
          </Card>

          {/* File Sharing Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shared Files</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.publicFiles}</div>
              <p className="text-xs text-muted-foreground">{dashboardStats.privateFiles} private files</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                isUploading && "cursor-not-allowed opacity-60",
              )}
              onClick={!isUploading ? quickActions.uploadFiles : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Files
              </CardTitle>
              <CardDescription>Upload single or multiple files with drag & drop support</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled= {isUploading}>{isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Start Upload"
                  )}</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={quickActions.viewFiles}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Files className="h-5 w-5" />
                Manage Files
              </CardTitle>
              <CardDescription>View, organize, and manage your uploaded files</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                View Files
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={quickActions.viewStats}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Analytics
              </CardTitle>
              <CardDescription>Detailed storage usage and deduplication statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                View Statistics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin Quick Access (only for admin users) */}
        {stats.role === "admin" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Administrator Panel
                <Badge variant="outline" className="ml-auto">
                  Admin
                </Badge>
              </CardTitle>
              <CardDescription>Access system administration, user management, and advanced analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={quickActions.adminPanel} className="w-full md:w-auto">
                Open Admin Panel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
    </>
  )
}