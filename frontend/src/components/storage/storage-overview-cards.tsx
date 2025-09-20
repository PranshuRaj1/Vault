"use client"

import * as React from "react"
import { HardDrive, Files, TrendingUp, TrendingDown, Database, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { StorageAnalytics, StorageTrend } from "@/types/storage"
import { cn } from "@/lib/utils"

interface StorageOverviewCardsProps {
  /** Storage analytics data */
  analytics: StorageAnalytics
  /** Storage trend data */
  trends: StorageTrend
  /** Loading state */
  isLoading?: boolean
}

/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Format percentage with proper sign and color
 */
const formatPercentage = (percentage: number): { text: string; color: string; icon: React.ReactNode } => {
  const isPositive = percentage > 0
  const isNeutral = percentage === 0

  return {
    text: `${isPositive ? "+" : ""}${percentage.toFixed(1)}%`,
    color: isNeutral ? "text-muted-foreground" : isPositive ? "text-green-600" : "text-red-600",
    icon: isNeutral ? null : isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />,
  }
}

/**
 * Storage overview cards component
 * Displays key storage metrics and trends in a grid layout
 */
export function StorageOverviewCards({ analytics, trends, isLoading = false }: StorageOverviewCardsProps) {
  /**
   * Memoized card data to prevent unnecessary recalculations
   */
  const cardData = React.useMemo(() => {
    const growthTrend = formatPercentage(trends.growthPercentage)
    const deduplicationTrend = formatPercentage(trends.deduplicationTrend)
    const uploadTrend = formatPercentage(trends.uploadTrend)

    return [
      {
        title: "Total Storage",
        value: formatBytes(analytics.totalStorage),
        description: `${formatBytes(analytics.deduplicatedStorage)} after deduplication`,
        icon: HardDrive,
        trend: growthTrend,
        progress: analytics.storageQuota.percentage,
        progressColor: analytics.storageQuota.isNearLimit
          ? "bg-amber-500"
          : analytics.storageQuota.isOverLimit
            ? "bg-red-500"
            : "bg-blue-500",
      },
      {
        title: "Total Files",
        value: analytics.totalFiles.toLocaleString(),
        description: `${analytics.uniqueFiles.toLocaleString()} unique, ${analytics.duplicateFiles.toLocaleString()} duplicates`,
        icon: Files,
        trend: uploadTrend,
        progress: null,
      },
      {
        title: "Storage Saved",
        value: formatBytes(analytics.deduplicationStats.savedBytes),
        description: `${analytics.deduplicationStats.savedPercentage.toFixed(1)}% reduction via deduplication`,
        icon: Database,
        trend: deduplicationTrend,
        progress: analytics.deduplicationStats.savedPercentage,
        progressColor: "bg-green-500",
      },
      {
        title: "Active Users",
        value: analytics.userStats.length.toLocaleString(),
        description: `${analytics.userStats.filter((u) => new Date(u.lastUpload) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} active this week`,
        icon: Users,
        trend: null,
        progress: null,
      },
    ]
  }, [analytics, trends])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardData.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                  {card.trend && (
                    <div className={cn("flex items-center gap-1 text-xs", card.trend.color)}>
                      {card.trend.icon}
                      <span>{card.trend.text}</span>
                    </div>
                  )}
                </div>
                {card.progress !== null && (
                  <div className="space-y-1">
                    <Progress
                      value={card.progress}
                      className="h-1"
                      // Apply custom color if provided
                      style={
                        card.progressColor
                          ? ({
                              "--progress-background": card.progressColor,
                            } as React.CSSProperties)
                          : undefined
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{card.progress.toFixed(1)}%</span>
                      {card.title === "Total Storage" && (
                        <span>{formatBytes(analytics.storageQuota.available)} available</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
