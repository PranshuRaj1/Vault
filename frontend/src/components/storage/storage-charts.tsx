"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { StorageAnalytics } from "@/types/storage"

interface StorageChartsProps {
  /** Storage analytics data */
  analytics: StorageAnalytics
  /** Loading state */
  isLoading?: boolean
}

/**
 * Format bytes for chart display
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
}

/**
 * Custom tooltip for charts
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}:{" "}
            {typeof entry.value === "number" && entry.value > 1024
              ? formatBytes(entry.value)
              : entry.value?.toLocaleString?.() || entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

/**
 * Storage charts component
 * Displays various storage analytics in chart format
 */
export function StorageCharts({ analytics, isLoading = false }: StorageChartsProps) {
  /**
   * Prepare data for storage over time chart
   */
  const storageTimeData = React.useMemo(() => {
    return analytics.storageOverTime.map((point) => ({
      ...point,
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }))
  }, [analytics.storageOverTime])

  /**
   * Prepare data for file type distribution
   */
  const fileTypeData = React.useMemo(() => {
    return analytics.fileTypeDistribution.map((type) => ({
      ...type,
      displaySize: formatBytes(type.size),
    }))
  }, [analytics.fileTypeDistribution])

  /**
   * Prepare data for user storage comparison
   */
  const userStorageData = React.useMemo(() => {
    return analytics.userStats
      .sort((a, b) => b.totalSize - a.totalSize)
      .slice(0, 10)
      .map((user) => ({
        name: user.userName,
        totalSize: user.totalSize,
        deduplicatedSize: user.deduplicatedSize,
        savedBytes: user.savedBytes,
        files: user.totalFiles,
      }))
  }, [analytics.userStats])

  /**
   * Prepare deduplication impact data
   */
  const deduplicationData = React.useMemo(() => {
    return [
      {
        name: "Original Size",
        value: analytics.deduplicationStats.originalSize,
        color: "#ef4444",
      },
      {
        name: "After Deduplication",
        value: analytics.deduplicationStats.deduplicatedSize,
        color: "#22c55e",
      },
    ]
  }, [analytics.deduplicationStats])

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-48 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Storage Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage Over Time</CardTitle>
          <CardDescription>Track storage growth and deduplication savings over the past 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={storageTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatBytes} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="totalSize"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="Original Size"
                />
                <Area
                  type="monotone"
                  dataKey="deduplicatedSize"
                  stackId="2"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.8}
                  name="Deduplicated Size"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* File Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>File Type Distribution</CardTitle>
            <CardDescription>Storage usage breakdown by file type</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pie" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pie">Pie Chart</TabsTrigger>
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              </TabsList>

              <TabsContent value="pie" className="space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fileTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="size"
                        label={({ type, percentage }) => `${type} (${percentage.toFixed(1)}%)`}
                      >
                        {fileTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="bar" className="space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fileTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis tickFormatter={formatBytes} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="size" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">File Type Summary</h4>
              <div className="grid grid-cols-2 gap-2">
                {fileTypeData.slice(0, 4).map((type) => (
                  <div key={type.type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                      <span>{type.type}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {type.count} files
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deduplication Impact */}
        <Card>
          <CardHeader>
            <CardTitle>Deduplication Impact</CardTitle>
            <CardDescription>Storage savings through file deduplication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deduplicationData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={formatBytes} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={(entry) => entry.color} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Storage Saved</p>
                  <p className="text-xs text-muted-foreground">Through deduplication</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {formatBytes(analytics.deduplicationStats.savedBytes)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {analytics.deduplicationStats.savedPercentage.toFixed(1)}% reduction
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center p-2 border rounded">
                  <p className="font-medium">{analytics.deduplicationStats.duplicateGroups}</p>
                  <p className="text-xs text-muted-foreground">Duplicate Groups</p>
                </div>
                <div className="text-center p-2 border rounded">
                  <p className="font-medium">{analytics.deduplicationStats.duplicateFiles}</p>
                  <p className="text-xs text-muted-foreground">Duplicate Files</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Top Users by Storage Usage</CardTitle>
          <CardDescription>Storage consumption by user (top 10)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userStorageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatBytes} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="totalSize" fill="#ef4444" name="Original Size" />
                <Bar dataKey="deduplicatedSize" fill="#22c55e" name="After Deduplication" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
