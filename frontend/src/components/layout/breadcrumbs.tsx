"use client"

import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

/**
 * Route configuration for breadcrumb generation
 * Maps URL segments to human-readable labels and icons
 */
const routeConfig: Record<string, { label: string; icon?: React.ComponentType<any> }> = {
  "": { label: "Dashboard", icon: Home },
  files: { label: "My Files" },
  upload: { label: "Upload Files" },
  shared: { label: "Shared Files" },
  search: { label: "Search" },
  stats: { label: "Storage Statistics" },
  analytics: { label: "Analytics" },
  admin: { label: "Admin Panel" },
  settings: { label: "Settings" },
}

interface BreadcrumbsProps {
  /** Additional custom breadcrumb items to append */
  customItems?: Array<{
    label: string
    href?: string
    isCurrentPage?: boolean
  }>
  /** Override the automatic breadcrumb generation */
  overrideItems?: Array<{
    label: string
    href?: string
    isCurrentPage?: boolean
  }>
}

/**
 * Dynamic breadcrumb navigation component
 * Automatically generates breadcrumbs based on current route
 * Supports custom items and route overrides
 */
export function Breadcrumbs({ customItems, overrideItems }: BreadcrumbsProps) {
  const pathname = usePathname()

  /**
   * Generate breadcrumb items from current pathname
   * Memoized to prevent unnecessary recalculations
   */
  const breadcrumbItems = React.useMemo(() => {
    // Use override items if provided
    if (overrideItems) {
      return overrideItems
    }

    // Split pathname and filter empty segments
    const segments = pathname.split("/").filter(Boolean)
    const items: Array<{
      label: string
      href?: string
      isCurrentPage?: boolean
    }> = []

    // Always include home/dashboard as first item
    items.push({
      label: routeConfig[""].label,
      href: "/",
      isCurrentPage: segments.length === 0,
    })

    // Generate items for each path segment
    let currentPath = ""
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      const config = routeConfig[segment] || { label: segment.charAt(0).toUpperCase() + segment.slice(1) }

      items.push({
        label: config.label,
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast,
      })
    })

    // Append custom items if provided
    if (customItems) {
      items.push(...customItems)
    }

    return items
  }, [pathname, customItems, overrideItems])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => {
          const IconComponent = index === 0 ? routeConfig[""].icon : null

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {item.isCurrentPage ? (
                  <BreadcrumbPage className="font-medium">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href || "#"}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
