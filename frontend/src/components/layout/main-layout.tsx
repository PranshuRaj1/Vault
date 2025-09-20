"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { Header } from "./header"
import type { Breadcrumbs } from "./breadcrumbs"

interface MainLayoutProps {
  children: React.ReactNode
  /** Current user information */
  user?: {
    name: string
    email: string
    avatar?: string
    role: "user" | "admin"
  }
  /** Number of unread notifications */
  notificationCount?: number
  /** Custom breadcrumb configuration */
  breadcrumbProps?: React.ComponentProps<typeof Breadcrumbs>
}

/**
 * Main application layout wrapper
 * Provides consistent sidebar, header, and content structure
 * Handles responsive behavior and theme integration
 */
export function MainLayout({ children, user, notificationCount, breadcrumbProps }: MainLayoutProps) {
  /**
   * Memoized user data to prevent unnecessary sidebar re-renders
   */
  const memoizedUser = React.useMemo(() => user, [user])

  return (
    <SidebarProvider>
      <AppSidebar user={memoizedUser} />
      <SidebarInset>
        <Header user={memoizedUser} notificationCount={notificationCount} breadcrumbProps={breadcrumbProps} />
        <main className="flex-1 space-y-4 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
