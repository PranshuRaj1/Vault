"use client"

import React from "react"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Search, Upload, FolderPlus, Share2, Settings, BarChart3, Users, FileText, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ComponentType<any>
  href: string
  keywords: string[]
  category: "files" | "admin" | "navigation" | "tools"
}

/**
 * Quick actions configuration
 * Defines all available quick actions with search keywords
 */
const quickActions: QuickAction[] = [
  {
    id: "upload-files",
    label: "Upload Files",
    description: "Upload new files to your vault",
    icon: Upload,
    href: "/upload",
    keywords: ["upload", "add", "new", "files"],
    category: "files",
  },
  {
    id: "search-files",
    label: "Search Files",
    description: "Find files by name, type, or content",
    icon: Search,
    href: "/search",
    keywords: ["search", "find", "filter", "query"],
    category: "files",
  },
  {
    id: "my-files",
    label: "My Files",
    description: "View and manage your files",
    icon: FileText,
    href: "/files",
    keywords: ["files", "documents", "manage", "browse"],
    category: "files",
  },
  {
    id: "create-folder",
    label: "Create Folder",
    description: "Organize files into folders",
    icon: FolderPlus,
    href: "/files?action=create-folder",
    keywords: ["folder", "organize", "create", "directory"],
    category: "files",
  },
  {
    id: "share-files",
    label: "Share Files",
    description: "Share files with others",
    icon: Share2,
    href: "/files?view=shared",
    keywords: ["share", "collaborate", "public", "link"],
    category: "files",
  },
  {
    id: "storage-stats",
    label: "Storage Statistics",
    description: "View storage usage and analytics",
    icon: BarChart3,
    href: "/stats",
    keywords: ["storage", "statistics", "usage", "analytics"],
    category: "tools",
  },
  {
    id: "admin-panel",
    label: "Admin Panel",
    description: "Manage users and system settings",
    icon: Users,
    href: "/admin",
    keywords: ["admin", "users", "management", "system"],
    category: "admin",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Configure your account preferences",
    icon: Settings,
    href: "/settings",
    keywords: ["settings", "preferences", "account", "profile"],
    category: "navigation",
  },
]

interface QuickActionsProps {
  /** Current user role to filter available actions */
  userRole?: "admin" | "user"
}

/**
 * Quick actions component with command palette
 * Provides fast access to common actions via keyboard shortcuts
 */
export default function QuickActions({ userRole = "user" }: QuickActionsProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  // Filter actions based on user role and search query
  const filteredActions = useMemo(() => {
    let actions = quickActions

    // Filter by user role
    if (userRole !== "admin") {
      actions = actions.filter((action) => action.category !== "admin")
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      actions = actions.filter(
        (action) =>
          action.label.toLowerCase().includes(query) ||
          action.description.toLowerCase().includes(query) ||
          action.keywords.some((keyword) => keyword.includes(query)),
      )
    }

    return actions
  }, [userRole, searchQuery])

  // Group actions by category
  const groupedActions = useMemo(() => {
    const groups: Record<string, QuickAction[]> = {}
    filteredActions.forEach((action) => {
      if (!groups[action.category]) {
        groups[action.category] = []
      }
      groups[action.category].push(action)
    })
    return groups
  }, [filteredActions])

  /**
   * Handle action selection
   */
  const handleActionSelect = (action: QuickAction) => {
    setOpen(false)
    setSearchQuery("")
    router.push(action.href)
  }

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      setOpen((open) => !open)
    }
  }

  // Register keyboard shortcut
  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const categoryLabels = {
    files: "Files & Documents",
    admin: "Administration",
    navigation: "Navigation",
    tools: "Tools & Analytics",
  }

  return (
    <>
      {/* Quick Actions Trigger */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="relative h-8 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline-flex">Search actions...</span>
          <span className="inline-flex lg:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Quick Action Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
              <Zap className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickActions.slice(0, 5).map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => handleActionSelect(action)}
                className="flex items-center gap-2"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {Object.entries(groupedActions).map(([category, actions]) => (
            <CommandGroup key={category} heading={categoryLabels[category as keyof typeof categoryLabels]}>
              {actions.map((action) => (
                <CommandItem
                  key={action.id}
                  value={`${action.label} ${action.description} ${action.keywords.join(" ")}`}
                  onSelect={() => handleActionSelect(action)}
                  className="flex items-center gap-3"
                >
                  <action.icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-sm text-muted-foreground">{action.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
