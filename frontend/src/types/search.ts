/**
 * Search filter types for file vault system
 */

/**
 * File type categories for filtering
 */
export type FileTypeFilter = "all" | "images" | "documents" | "videos" | "audio" | "archives" | "other"

/**
 * File visibility filter options
 */
export type VisibilityFilter = "all" | "private" | "public" | "shared"

/**
 * File ownership filter options
 */
export type OwnershipFilter = "all" | "owned" | "shared_with_me" | "public_files"

/**
 * Date range filter options
 */
export type DateRangeFilter = "all" | "today" | "week" | "month" | "quarter" | "year" | "custom"

/**
 * Size range filter options
 */
export type SizeRangeFilter = "all" | "small" | "medium" | "large" | "huge" | "custom"

/**
 * Search filter configuration interface
 */
export interface SearchFilters {
  /** Text query for filename, content, and metadata */
  query: string
  /** File type category filter */
  fileType: FileTypeFilter
  /** File visibility filter */
  visibility: VisibilityFilter
  /** File ownership filter */
  ownership: OwnershipFilter
  /** Date range filter */
  dateRange: DateRangeFilter
  /** Custom date range (when dateRange is 'custom') */
  customDateRange?: {
    from: string
    to: string
  }
  /** Size range filter */
  sizeRange: SizeRangeFilter
  /** Custom size range in bytes (when sizeRange is 'custom') */
  customSizeRange?: {
    min: number
    max: number
  }
  /** Specific uploader filter */
  uploadedBy?: string
  /** Tag filters */
  tags: string[]
  /** Include duplicates in results */
  includeDuplicates: boolean
  /** Minimum download count */
  minDownloads?: number
}

/**
 * Saved search interface
 */
export interface SavedSearch {
  id: string
  name: string
  description?: string
  filters: SearchFilters
  createdAt: string
  updatedAt: string
  isDefault?: boolean
  resultCount?: number
}

/**
 * Search result metadata
 */
export interface SearchResultMeta {
  totalResults: number
  filteredResults: number
  searchTime: number
  appliedFilters: Partial<SearchFilters>
  suggestions?: string[]
}

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
  id: string
  query: string
  filters: Partial<SearchFilters>
  resultCount: number
  searchedAt: string
}
