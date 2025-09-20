"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface PageNavigationProps {
  /** Current page number (1-based) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Number of items per page */
  itemsPerPage: number
  /** Total number of items */
  totalItems: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Show page size selector */
  showPageSize?: boolean
  /** Available page sizes */
  pageSizes?: number[]
  /** Callback when page size changes */
  onPageSizeChange?: (size: number) => void
  /** Show items count */
  showItemsCount?: boolean
}

/**
 * Advanced pagination component with page size controls
 * Provides comprehensive navigation for large datasets
 */
export default function PageNavigation({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  showPageSize = true,
  pageSizes = [10, 25, 50, 100],
  onPageSizeChange,
  showItemsCount = true,
}: PageNavigationProps) {
  /**
   * Generate page numbers to display
   * Shows current page with context pages around it
   */
  const pageNumbers = useMemo(() => {
    const delta = 2 // Number of pages to show on each side of current page
    const range = []
    const rangeWithDots = []

    // Calculate range around current page
    const start = Math.max(1, currentPage - delta)
    const end = Math.min(totalPages, currentPage + delta)

    for (let i = start; i <= end; i++) {
      range.push(i)
    }

    // Add first page and dots if needed
    if (start > 1) {
      rangeWithDots.push(1)
      if (start > 2) {
        rangeWithDots.push("...")
      }
    }

    // Add main range
    rangeWithDots.push(...range)

    // Add last page and dots if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push("...")
      }
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }, [currentPage, totalPages])

  /**
   * Calculate items range for current page
   */
  const itemsRange = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage + 1
    const end = Math.min(currentPage * itemsPerPage, totalItems)
    return { start, end }
  }, [currentPage, itemsPerPage, totalItems])

  /**
   * Handle page change with bounds checking
   */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }

  // Don't render if there's only one page
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
      {/* Items Count */}
      {showItemsCount && (
        <div className="text-sm text-muted-foreground">
          Showing {itemsRange.start} to {itemsRange.end} of {totalItems.toLocaleString()} results
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <div key={index}>
              {page === "..." ? (
                <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page as number)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page Size Selector */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onPageSizeChange(Number.parseInt(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      )}
    </div>
  )
}
