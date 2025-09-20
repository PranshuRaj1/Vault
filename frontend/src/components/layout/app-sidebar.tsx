"use client"

import * as React from "react"
import { Files, Upload, Search, BarChart3, Settings, Shield, Home, FolderOpen, Share2, HardDrive } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

/**
 * Navigation items for the main application features
 * Each item includes icon, label, URL, and optional badge for notifications
 */
const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    badge: null,
  },
  {
    title: "My Files",
    url: "/files",
    icon: Files,
    badge: null,
  },
  {
    title: "Upload",
    url: "/upload",
    icon: Upload,
    badge: null,
  },
  {
    title: "Shared Files",
    url: "/shared",
    icon: Share2,
    badge: null,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
    badge: null,
  },
]

/**
 * Management items for system administration and analytics
 */
const managementItems = [
  {
    title: "Storage Stats",
    url: "/stats",
    icon: HardDrive,
    badge: null,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    badge: null,
  },
]

/**
 * Admin-only navigation items
 * These are only visible to users with admin privileges
 */
const adminItems = [
  {
    title: "Admin Panel",
    url: "/admin",
    icon: Shield,
    badge: "Admin",
  },
  {
    title: "System Settings",
    url: "/admin/settings",
    icon: Settings,
    badge: null,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  /** Current user information for display in sidebar footer */
  user?: {
    name: string
    email: string
    avatar?: string
    role: "user" | "admin"
  }
}

/**
 * Main application sidebar component
 * Provides navigation for all major features and admin functions
 * Responsive design with collapsible functionality
 */
export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  /**
   * Memoized navigation sections to prevent unnecessary re-renders
   * Filters admin items based on user role
   */
  const navigationSections = React.useMemo(() => {
    const sections = [
      {
        label: "Navigation",
        items: navigationItems,
      },
      {
        label: "Management",
        items: managementItems,
      },
    ]

    // Add admin section only for admin users
    if (user?.role === "admin") {
      sections.push({
        label: "Administration",
        items: adminItems,
      })
    }

    return sections
  }, [user?.role])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FolderOpen className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">SecureVault</span>
            <span className="truncate text-xs text-muted-foreground">File Management</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <div className="flex items-center gap-2 px-4 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
            {user.role === "admin" && (
              <Badge variant="outline" className="text-xs">
                Admin
              </Badge>
            )}
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
