"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, Files, HardDrive, Activity, TrendingUp, Server } from "lucide-react"
import type { SystemStats, ActivityLog } from "@/types/admin"

interface SystemAnalyticsProps {
  stats: SystemStats
  activityLogs: ActivityLog[]
}

/**
 * System analytics dashboard component for admin panel
 * Displays comprehensive system metrics and activity charts
 */
export default function SystemAnalytics({ stats, activityLogs }: SystemAnalyticsProps) {
  // Memoized chart data for performance
  const activityChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split("T")[0]
    })

    return last7Days.map((date) => {
      const dayLogs = activityLogs.filter((log) => log.timestamp.startsWith(date))

      return {
        date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
        uploads: dayLogs.filter((log) => log.action === "upload").length,
        downloads: dayLogs.filter((log) => log.action === "download").length,
        logins: dayLogs.filter((log) => log.action === "login").length,
      }
    })
  }, [activityLogs])

  const actionDistribution = useMemo(() => {
    const actions = activityLogs.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(actions).map(([action, count]) => ({
      name: action.charAt(0).toUpperCase() + action.slice(1),
      value: count,
      color:
        {
          upload: "#8884d8",
          download: "#82ca9d",
          delete: "#ffc658",
          share: "#ff7300",
          login: "#00ff00",
          register: "#ff0000",
        }[action] || "#8884d8",
    }))
  }, [activityLogs])

  /**
   * Format bytes to human readable format
   */
  const formatBytes = (bytes: number): string => {
    const units = ["B", "KB", "MB", "GB", "TB"]
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  /**
   * Calculate percentage savings from deduplication
   */
  const getSavingsPercentage = (): number => {
    const totalWithoutDedup = stats.totalStorage + stats.deduplicationSavings
    return Math.round((stats.deduplicationSavings / totalWithoutDedup) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {stats.activeUsers} active
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {stats.uploadsToday} uploaded today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.totalStorage)}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {getSavingsPercentage()}% saved via dedup
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.apiCallsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <Server className="inline h-3 w-3 mr-1" />
              System performance normal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>7-Day Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="uploads" fill="#8884d8" name="Uploads" />
                <Bar dataKey="downloads" fill="#82ca9d" name="Downloads" />
                <Bar dataKey="logins" fill="#ffc658" name="Logins" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Action Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Action Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={actionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {actionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Storage Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatBytes(stats.totalStorage + stats.deduplicationSavings)}
              </div>
              <div className="text-sm text-muted-foreground">Original Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatBytes(stats.totalStorage)}</div>
              <div className="text-sm text-muted-foreground">Actual Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatBytes(stats.deduplicationSavings)}</div>
              <div className="text-sm text-muted-foreground">Space Saved</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
