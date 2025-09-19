"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Files, Upload, HardDrive, TrendingUp, Share2, Shield } from "lucide-react"

/**
 * Mock user data for demonstration
 * In a real application, this would come from authentication context
 */
const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "/diverse-user-avatars.png",
  role: "admin" as const,
}

/**
 * Mock dashboard statistics
 * In a real application, this would be fetched from the Go backend API
 */
const dashboardStats = {
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
  /**
   * Memoized quick action handlers to prevent unnecessary re-renders
   */
  const quickActions = React.useMemo(
    () => ({
      uploadFiles: () => {
        // TODO: Navigate to upload page or open upload modal
        console.log("Navigating to upload...")
      },
      viewFiles: () => {
        // TODO: Navigate to files page
        console.log("Navigating to files...")
      },
      viewStats: () => {
        // TODO: Navigate to statistics page
        console.log("Navigating to statistics...")
      },
      adminPanel: () => {
        // TODO: Navigate to admin panel
        console.log("Navigating to admin panel...")
      },
    }),
    [],
  )

  return (
    <MainLayout user={mockUser} notificationCount={3}>
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {mockUser.name}</h1>
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
              <div className="text-2xl font-bold">{dashboardStats.totalFiles.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{dashboardStats.recentUploads}</span> from last week
              </p>
            </CardContent>
          </Card>

          {/* Storage Usage Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalStorage}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">{dashboardStats.savedStorage} saved</span> via deduplication
              </p>
            </CardContent>
          </Card>

          {/* Storage Savings Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.savingsPercentage}%</div>
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
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={quickActions.uploadFiles}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Files
              </CardTitle>
              <CardDescription>Upload single or multiple files with drag & drop support</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Upload</Button>
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
        {mockUser.role === "admin" && (
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
  )
}
