"use client"

import type * as React from "react"
import { Download, HardDrive, TrendingUp, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TopFile } from "@/types/storage"

interface TopFilesTableProps {
  /** Top files by size */
  topFilesBySize: TopFile[]
  /** Top files by downloads */
  topFilesByDownloads: TopFile[]
  /** Recent uploads */
  recentUploads: TopFile[]
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
 * Format date to relative time
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

/**
 * Get file type badge color
 */
const getFileTypeBadge = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return { label: "Image", variant: "default" as const }
  if (mimeType.startsWith("video/")) return { label: "Video", variant: "secondary" as const }
  if (mimeType.startsWith("audio/")) return { label: "Audio", variant: "outline" as const }
  if (mimeType.includes("pdf")) return { label: "PDF", variant: "destructive" as const }
  if (mimeType.includes("document")) return { label: "Document", variant: "default" as const }
  if (mimeType.includes("zip") || mimeType.includes("archive"))
    return { label: "Archive", variant: "secondary" as const }
  return { label: "Other", variant: "outline" as const }
}

/**
 * File row component for reusability
 */
const FileRow = ({
  file,
  showMetric,
  metricIcon,
  metricValue,
}: {
  file: TopFile
  showMetric: "size" | "downloads" | "date"
  metricIcon: React.ReactNode
  metricValue: string | number
}) => {
  const fileTypeBadge = getFileTypeBadge(file.mimeType)

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{metricIcon}</div>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{file.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={fileTypeBadge.variant} className="text-xs">
                {fileTypeBadge.label}
              </Badge>
              {showMetric === "size" && <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`/placeholder-24px.png?height=24&width=24`} />
            <AvatarFallback className="text-xs">
              {file.uploadedBy
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{file.uploadedBy}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {showMetric === "downloads" && <Download className="h-4 w-4 text-muted-foreground" />}
          {showMetric === "size" && <HardDrive className="h-4 w-4 text-muted-foreground" />}
          {showMetric === "date" && <Calendar className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium">{metricValue}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <span className="text-xs text-muted-foreground">{formatRelativeTime(file.uploadedAt)}</span>
      </TableCell>
    </TableRow>
  )
}

/**
 * Top files table component
 * Displays top files by various metrics in tabbed interface
 */
export function TopFilesTable({
  topFilesBySize,
  topFilesByDownloads,
  recentUploads,
  isLoading = false,
}: TopFilesTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Analytics</CardTitle>
        <CardDescription>Top performing files and recent activity</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="size" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="size" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Largest Files
            </TabsTrigger>
            <TabsTrigger value="downloads" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Most Downloaded
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent Uploads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="size" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topFilesBySize.slice(0, 10).map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      showMetric="size"
                      metricIcon={<HardDrive className="h-4 w-4 text-blue-600" />}
                      metricValue={formatBytes(file.size)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="downloads" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead className="text-right">Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topFilesByDownloads.slice(0, 10).map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      showMetric="downloads"
                      metricIcon={<TrendingUp className="h-4 w-4 text-green-600" />}
                      metricValue={file.downloadCount.toLocaleString()}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUploads.slice(0, 10).map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <Calendar className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getFileTypeBadge(file.mimeType).variant} className="text-xs">
                                {getFileTypeBadge(file.mimeType).label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={`/placeholder-24px.png?height=24&width=24`} />
                            <AvatarFallback className="text-xs">
                              {file.uploadedBy
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{file.uploadedBy}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{formatRelativeTime(file.uploadedAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground">{formatBytes(file.size)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
