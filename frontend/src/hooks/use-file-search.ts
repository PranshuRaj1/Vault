"use client"

import * as React from "react"
import type { FileMetadata } from "@/types/file"
import type { SearchFilters, SearchResultMeta, SavedSearch, SearchHistoryEntry } from "@/types/search"

/**
 * Search configuration interface
 */
interface UseFileSearchConfig {
  /** Files to search through */
  files: FileMetadata[]
  /** Initial search filters */
  initialFilters?: Partial<SearchFilters>
  /** Enable search history */
  enableHistory?: boolean
  /** Maximum history entries */
  maxHistoryEntries?: number
  /** Debounce delay for search queries */
  debounceDelay?: number
}

/**
 * Default search filters
 */
const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  fileType: "all",
  visibility: "all",
  ownership: "all",
  dateRange: "all",
  sizeRange: "all",
  tags: [],
  includeDuplicates: true,
}

/**
 * File type MIME type mappings
 */
const FILE_TYPE_MAPPINGS = {
  images: ["image/"],
  documents: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument", "text/"],
  videos: ["video/"],
  audio: ["audio/"],
  archives: ["application/zip", "application/x-rar", "application/x-tar", "application/gzip"],
}

/**
 * Custom hook for file search functionality
 * Provides filtering, sorting, and search history management
 */
export function useFileSearch({
  files,
  initialFilters = {},
  enableHistory = true,
  maxHistoryEntries = 50,
  debounceDelay = 300,
}: UseFileSearchConfig) {
  const [filters, setFilters] = React.useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })
  const [savedSearches, setSavedSearches] = React.useState<SavedSearch[]>([])
  const [searchHistory, setSearchHistory] = React.useState<SearchHistoryEntry[]>([])
  const [isSearching, setIsSearching] = React.useState(false)

  /**
   * Debounced search query to prevent excessive filtering
   */
  const [debouncedQuery, setDebouncedQuery] = React.useState(filters.query)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query)
    }, debounceDelay)

    return () => clearTimeout(timer)
  }, [filters.query, debounceDelay])

  /**
   * Check if file matches file type filter
   */
  const matchesFileType = React.useCallback((file: FileMetadata, fileType: SearchFilters["fileType"]): boolean => {
    if (fileType === "all") return true

    const mimeType = file.mimeType.toLowerCase()
    const mappings = FILE_TYPE_MAPPINGS[fileType as keyof typeof FILE_TYPE_MAPPINGS]

    if (mappings) {
      return mappings.some((mapping) => mimeType.startsWith(mapping))
    }

    // "other" category - files that don't match any specific category
    if (fileType === "other") {
      return !Object.values(FILE_TYPE_MAPPINGS)
        .flat()
        .some((mapping) => mimeType.startsWith(mapping))
    }

    return false
  }, [])

  /**
   * Check if file matches date range filter
   */
  const matchesDateRange = React.useCallback(
    (
      file: FileMetadata,
      dateRange: SearchFilters["dateRange"],
      customRange?: SearchFilters["customDateRange"],
    ): boolean => {
      if (dateRange === "all") return true

      const fileDate = new Date(file.uploadedAt)
      const now = new Date()

      switch (dateRange) {
        case "today":
          return fileDate.toDateString() === now.toDateString()
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return fileDate >= weekAgo
        case "month":
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          return fileDate >= monthAgo
        case "quarter":
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          return fileDate >= quarterAgo
        case "year":
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          return fileDate >= yearAgo
        case "custom":
          if (!customRange) return true
          const fromDate = customRange.from ? new Date(customRange.from) : new Date(0)
          const toDate = customRange.to ? new Date(customRange.to) : new Date()
          return fileDate >= fromDate && fileDate <= toDate
        default:
          return true
      }
    },
    [],
  )

  /**
   * Check if file matches size range filter
   */
  const matchesSizeRange = React.useCallback(
    (
      file: FileMetadata,
      sizeRange: SearchFilters["sizeRange"],
      customRange?: SearchFilters["customSizeRange"],
    ): boolean => {
      if (sizeRange === "all") return true

      const fileSize = file.size

      switch (sizeRange) {
        case "small":
          return fileSize <= 1024 * 1024 // 1MB
        case "medium":
          return fileSize > 1024 * 1024 && fileSize <= 10 * 1024 * 1024 // 1-10MB
        case "large":
          return fileSize > 10 * 1024 * 1024 && fileSize <= 100 * 1024 * 1024 // 10-100MB
        case "huge":
          return fileSize > 100 * 1024 * 1024 // 100MB+
        case "custom":
          if (!customRange) return true
          return fileSize >= (customRange.min || 0) && fileSize <= (customRange.max || Number.MAX_SAFE_INTEGER)
        default:
          return true
      }
    },
    [],
  )

  /**
   * Check if file matches text query
   */
  const matchesQuery = React.useCallback((file: FileMetadata, query: string): boolean => {
    if (!query) return true

    const searchTerms = query.toLowerCase().split(/\s+/)
    const searchableText = [
      file.name,
      file.originalName,
      file.description || "",
      file.uploadedBy.name,
      file.uploadedBy.email,
      ...file.tags,
    ]
      .join(" ")
      .toLowerCase()

    return searchTerms.every((term) => searchableText.includes(term))
  }, [])

  /**
   * Filter files based on current search criteria
   */
  const filteredFiles = React.useMemo(() => {
    setIsSearching(true)
    const startTime = performance.now()

    const filtered = files.filter((file) => {
      // Text query filter
      if (!matchesQuery(file, debouncedQuery)) return false

      // File type filter
      if (!matchesFileType(file, filters.fileType)) return false

      // Visibility filter
      if (filters.visibility !== "all" && file.visibility !== filters.visibility) return false

      // Ownership filter
      switch (filters.ownership) {
        case "owned":
          if (!file.isOwner) return false
          break
        case "shared_with_me":
          if (file.isOwner || file.visibility !== "shared") return false
          break
        case "public_files":
          if (file.visibility !== "public") return false
          break
      }

      // Date range filter
      if (!matchesDateRange(file, filters.dateRange, filters.customDateRange)) return false

      // Size range filter
      if (!matchesSizeRange(file, filters.sizeRange, filters.customSizeRange)) return false

      // Uploader filter
      if (filters.uploadedBy && file.uploadedBy.id !== filters.uploadedBy) return false

      // Tags filter
      if (filters.tags.length > 0) {
        const hasAllTags = filters.tags.every((tag) => file.tags.includes(tag))
        if (!hasAllTags) return false
      }

      // Duplicates filter
      if (!filters.includeDuplicates && file.isDuplicate) return false

      // Minimum downloads filter
      if (filters.minDownloads && file.downloadCount < filters.minDownloads) return false

      return true
    })

    const endTime = performance.now()
    setIsSearching(false)

    // Add to search history if query is not empty
    if (enableHistory && debouncedQuery && debouncedQuery !== searchHistory[0]?.query) {
      const historyEntry: SearchHistoryEntry = {
        id: `search_${Date.now()}`,
        query: debouncedQuery,
        filters: { ...filters },
        resultCount: filtered.length,
        searchedAt: new Date().toISOString(),
      }

      setSearchHistory((prev) => [historyEntry, ...prev.slice(0, maxHistoryEntries - 1)])
    }

    return filtered
  }, [
    files,
    debouncedQuery,
    filters,
    matchesQuery,
    matchesFileType,
    matchesDateRange,
    matchesSizeRange,
    enableHistory,
    searchHistory,
    maxHistoryEntries,
  ])

  /**
   * Search result metadata
   */
  const searchMeta: SearchResultMeta = React.useMemo(() => {
    const activeFilters: Partial<SearchFilters> = {}
    if (filters.query) activeFilters.query = filters.query
    if (filters.fileType !== "all") activeFilters.fileType = filters.fileType
    if (filters.visibility !== "all") activeFilters.visibility = filters.visibility
    if (filters.ownership !== "all") activeFilters.ownership = filters.ownership
    if (filters.dateRange !== "all") activeFilters.dateRange = filters.dateRange
    if (filters.sizeRange !== "all") activeFilters.sizeRange = filters.sizeRange
    if (filters.uploadedBy) activeFilters.uploadedBy = filters.uploadedBy
    if (filters.tags.length > 0) activeFilters.tags = filters.tags
    if (!filters.includeDuplicates) activeFilters.includeDuplicates = filters.includeDuplicates
    if (filters.minDownloads) activeFilters.minDownloads = filters.minDownloads

    return {
      totalResults: files.length,
      filteredResults: filteredFiles.length,
      searchTime: 0, // Would be calculated in real implementation
      appliedFilters: activeFilters,
    }
  }, [files.length, filteredFiles.length, filters])

  /**
   * Save current search
   */
  const saveSearch = React.useCallback(
    (name: string, description?: string) => {
      const savedSearch: SavedSearch = {
        id: `saved_${Date.now()}`,
        name,
        description,
        filters: { ...filters },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resultCount: filteredFiles.length,
      }

      setSavedSearches((prev) => [savedSearch, ...prev])
    },
    [filters, filteredFiles.length],
  )

  /**
   * Load saved search
   */
  const loadSavedSearch = React.useCallback((search: SavedSearch) => {
    setFilters(search.filters)
  }, [])

  /**
   * Delete saved search
   */
  const deleteSavedSearch = React.useCallback((searchId: string) => {
    setSavedSearches((prev) => prev.filter((search) => search.id !== searchId))
  }, [])

  /**
   * Clear search filters
   */
  const clearFilters = React.useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  /**
   * Update filters
   */
  const updateFilters = React.useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  /**
   * Get available filter options from current files
   */
  const availableOptions = React.useMemo(() => {
    const tags = new Set<string>()
    const uploaders = new Map<string, { id: string; name: string; email: string }>()

    files.forEach((file) => {
      file.tags.forEach((tag) => tags.add(tag))
      uploaders.set(file.uploadedBy.id, file.uploadedBy)
    })

    return {
      tags: Array.from(tags).sort(),
      uploaders: Array.from(uploaders.values()).sort((a, b) => a.name.localeCompare(b.name)),
    }
  }, [files])

  return {
    // State
    filters,
    filteredFiles,
    savedSearches,
    searchHistory,
    searchMeta,
    isSearching,
    availableOptions,

    // Actions
    setFilters: updateFilters,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    clearFilters,
  }
}
