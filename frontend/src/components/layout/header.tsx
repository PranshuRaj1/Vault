"use client"

import * as React from "react"
import { Moon, Sun, Bell, User } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumbs } from "./breadcrumbs"

interface HeaderProps {
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
 * Application header component
 * Contains sidebar trigger, breadcrumbs, theme toggle, notifications, and user menu
 * Responsive design with proper spacing and alignment
 */
export function Header({ user, notificationCount = 0, breadcrumbProps }: HeaderProps) {
  const { setTheme, theme } = useTheme()

  /**
   * Memoized theme toggle handler to prevent unnecessary re-renders
   */
  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  /**
   * Memoized notification handler
   */
  const handleNotificationClick = React.useCallback(() => {
    // TODO: Implement notification panel
    console.log("Opening notifications...")
  }, [])

  /**
   * Memoized user menu handlers
   */
  const userMenuHandlers = React.useMemo(
    () => ({
      profile: () => console.log("Opening profile..."),
      settings: () => console.log("Opening settings..."),
      logout: () => console.log("Logging out..."),
    }),
    [],
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left section: Sidebar trigger and breadcrumbs */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <div className="hidden md:block">
            <Breadcrumbs {...breadcrumbProps} />
          </div>
        </div>

        {/* Right section: Theme toggle, notifications, and user menu */}
        <div className="flex items-center gap-2">
          {/* Theme toggle button */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9" aria-label="Toggle theme">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Notifications button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNotificationClick}
            className="relative h-9 w-9"
            aria-label={`Notifications ${notificationCount > 0 ? `(${notificationCount} unread)` : ""}`}
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                {notificationCount > 99 ? "99+" : notificationCount}
              </Badge>
            )}
          </Button>

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="User menu">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    {user.role === "admin" && (
                      <Badge variant="outline" className="w-fit text-xs mt-1">
                        Administrator
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={userMenuHandlers.profile}>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={userMenuHandlers.settings}>Preferences</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={userMenuHandlers.logout} className="text-destructive focus:text-destructive">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile breadcrumbs */}
      <div className="block md:hidden border-t px-4 py-2">
        <Breadcrumbs {...breadcrumbProps} />
      </div>
    </header>
  )
}
