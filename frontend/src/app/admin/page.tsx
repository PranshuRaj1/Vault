"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Users, BarChart3, Activity, Shield, AlertTriangle, Save, RefreshCw } from "lucide-react"
import UserManagementTable from "@/components/admin/user-management-table"
import SystemAnalytics from "@/components/admin/system-analytics"
import type { User, SystemStats, ActivityLog, AdminSettings } from "@/types/admin"

/**
 * Admin dashboard page component
 * Provides comprehensive administrative interface for system management
 */
export default function AdminPage() {
  // State management for admin data
  const [users, setUsers] = useState<User[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Mock data for demonstration (replace with actual API calls)
  useEffect(() => {
    const loadAdminData = async () => {
      setIsLoading(true)

      // Simulate API calls
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock users data
      const mockUsers: User[] = [
        {
          id: "1",
          email: "john.doe@example.com",
          name: "John Doe",
          role: "user",
          storageUsed: 1024 * 1024 * 50, // 50MB
          storageQuota: 1024 * 1024 * 100, // 100MB
          filesCount: 25,
          lastActive: "2024-01-15T10:30:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          isActive: true,
        },
        {
          id: "2",
          email: "jane.smith@example.com",
          name: "Jane Smith",
          role: "admin",
          storageUsed: 1024 * 1024 * 200, // 200MB
          storageQuota: 1024 * 1024 * 500, // 500MB
          filesCount: 150,
          lastActive: "2024-01-16T14:20:00Z",
          createdAt: "2023-12-15T00:00:00Z",
          isActive: true,
        },
        {
          id: "3",
          email: "bob.wilson@example.com",
          name: "Bob Wilson",
          role: "user",
          storageUsed: 1024 * 1024 * 5, // 5MB
          storageQuota: 1024 * 1024 * 100, // 100MB
          filesCount: 8,
          lastActive: "2024-01-10T09:15:00Z",
          createdAt: "2024-01-05T00:00:00Z",
          isActive: false,
        },
      ]

      // Mock system stats
      const mockStats: SystemStats = {
        totalUsers: 1250,
        activeUsers: 890,
        totalFiles: 45678,
        totalStorage: 1024 * 1024 * 1024 * 2.5, // 2.5GB
        deduplicationSavings: 1024 * 1024 * 1024 * 0.8, // 800MB
        apiCallsToday: 12450,
        uploadsToday: 234,
        downloadsToday: 567,
      }

      // Mock activity logs
      const mockLogs: ActivityLog[] = Array.from({ length: 100 }, (_, i) => ({
        id: `log-${i}`,
        userId: mockUsers[i % mockUsers.length].id,
        userName: mockUsers[i % mockUsers.length].name,
        action: ["upload", "download", "delete", "share", "login"][Math.floor(Math.random() * 5)] as any,
        fileId: `file-${i}`,
        fileName: `document-${i}.pdf`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }))

      // Mock admin settings
      const mockSettings: AdminSettings = {
        defaultStorageQuota: 1024 * 1024 * 100, // 100MB
        maxFileSize: 1024 * 1024 * 50, // 50MB
        allowedFileTypes: ["pdf", "doc", "docx", "jpg", "png", "txt"],
        rateLimitPerSecond: 2,
        enablePublicSharing: true,
        enableUserRegistration: true,
        maintenanceMode: false,
      }

      setUsers(mockUsers)
      setSystemStats(mockStats)
      setActivityLogs(mockLogs)
      setAdminSettings(mockSettings)
      setIsLoading(false)
    }

    loadAdminData()
  }, [])

  /**
   * Handle user updates (role changes, activation, etc.)
   */
  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...updates } : user)))

    // TODO: Make API call to update user
    console.log("[v0] Updating user:", userId, updates)
  }

  /**
   * Handle user deletion
   */
  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      setUsers((prev) => prev.filter((user) => user.id !== userId))

      // TODO: Make API call to delete user
      console.log("[v0] Deleting user:", userId)
    }
  }

  /**
   * Handle admin settings save
   */
  const handleSaveSettings = async () => {
    if (!adminSettings) return

    setIsSaving(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // TODO: Make actual API call to save settings
    console.log("[v0] Saving admin settings:", adminSettings)

    setIsSaving(false)
  }

  /**
   * Format bytes to human readable format
   */
  const formatBytes = (bytes: number): string => {
    const units = ["B", "KB", "MB", "GB"]
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading admin dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, monitor system performance, and configure settings</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Administrator
        </Badge>
      </div>

      {/* System Status Alert */}
      {adminSettings?.maintenanceMode && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">System is currently in maintenance mode</span>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {systemStats && <SystemAnalytics stats={systemStats} activityLogs={activityLogs} />}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <UserManagementTable users={users} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.slice(0, 20).map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{log.action}</Badge>
                      <div>
                        <div className="font-medium">{log.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.fileName && `${log.fileName} • `}
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{log.ipAddress}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          {adminSettings && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Storage Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Storage Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="storage-quota">Default Storage Quota</Label>
                    <Input
                      id="storage-quota"
                      value={formatBytes(adminSettings.defaultStorageQuota)}
                      onChange={(e) => {
                        // TODO: Parse and convert back to bytes
                        console.log("[v0] Storage quota changed:", e.target.value)
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-file-size">Maximum File Size</Label>
                    <Input
                      id="max-file-size"
                      value={formatBytes(adminSettings.maxFileSize)}
                      onChange={(e) => {
                        // TODO: Parse and convert back to bytes
                        console.log("[v0] Max file size changed:", e.target.value)
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate-limit">Rate Limit (calls per second)</Label>
                    <Input
                      id="rate-limit"
                      type="number"
                      value={adminSettings.rateLimitPerSecond}
                      onChange={(e) =>
                        setAdminSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                rateLimitPerSecond: Number.parseInt(e.target.value),
                              }
                            : null,
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Public Sharing</Label>
                      <div className="text-sm text-muted-foreground">Allow users to share files publicly</div>
                    </div>
                    <Switch
                      checked={adminSettings.enablePublicSharing}
                      onCheckedChange={(checked) =>
                        setAdminSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                enablePublicSharing: checked,
                              }
                            : null,
                        )
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>User Registration</Label>
                      <div className="text-sm text-muted-foreground">Allow new user registrations</div>
                    </div>
                    <Switch
                      checked={adminSettings.enableUserRegistration}
                      onCheckedChange={(checked) =>
                        setAdminSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                enableUserRegistration: checked,
                              }
                            : null,
                        )
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <div className="text-sm text-muted-foreground">Temporarily disable system access</div>
                    </div>
                    <Switch
                      checked={adminSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setAdminSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                maintenanceMode: checked,
                              }
                            : null,
                        )
                      }
                    />
                  </div>

                  <Separator />

                  <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
