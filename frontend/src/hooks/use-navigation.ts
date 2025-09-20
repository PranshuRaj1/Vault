"use client"

import { useCallback, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

/**
 * Navigation utilities hook
 * Provides helpers for URL manipulation and navigation state
 */
export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /**
   * Update URL search parameters while preserving existing ones
   */
  const updateSearchParams = useCallback(
    (updates: Record<string, string | number | boolean | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      })

      const newUrl = `${pathname}?${params.toString()}`
      router.push(newUrl)
    },
    [router, pathname, searchParams],
  )

  /**
   * Navigate to a new path with optional search parameters
   */
  const navigateWithParams = useCallback(
    (path: string, params?: Record<string, string | number | boolean>) => {
      if (params) {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            searchParams.set(key, String(value))
          }
        })
        const newUrl = `${path}?${searchParams.toString()}`
        router.push(newUrl)
      } else {
        router.push(path)
      }
    },
    [router],
  )

  /**
   * Get current search parameter value
   */
  const getSearchParam = useCallback(
    (key: string, defaultValue?: string): string | null => {
      return searchParams.get(key) ?? defaultValue ?? null
    },
    [searchParams],
  )

  /**
   * Check if current path matches a pattern
   */
  const isActivePath = useCallback(
    (path: string, exact = false): boolean => {
      if (exact) {
        return pathname === path
      }
      return pathname.startsWith(path)
    },
    [pathname],
  )

  /**
   * Get breadcrumb items for current path
   */
  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    const items = [{ label: "Dashboard", href: "/" }]

    let currentPath = ""
    segments.forEach((segment) => {
      currentPath += `/${segment}`
      const label = segment.charAt(0).toUpperCase() + segment.slice(1)
      items.push({ label, href: currentPath })
    })

    return items
  }, [pathname])

  /**
   * Navigate back in history
   */
  const goBack = useCallback(() => {
    router.back()
  }, [router])

  /**
   * Navigate forward in history
   */
  const goForward = useCallback(() => {
    router.forward()
  }, [router])

  /**
   * Refresh current page
   */
  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  return {
    // Current state
    pathname,
    searchParams,
    breadcrumbItems,

    // Navigation methods
    updateSearchParams,
    navigateWithParams,
    goBack,
    goForward,
    refresh,

    // Utility methods
    getSearchParam,
    isActivePath,
  }
}

/**
 * Pagination hook for managing paginated data
 */
export function usePagination({
  totalItems,
  itemsPerPage: initialItemsPerPage = 25,
  initialPage = 1,
}: {
  totalItems: number
  itemsPerPage?: number
  initialPage?: number
}) {
  const { updateSearchParams, getSearchParam } = useNavigation()

  // Get current page and items per page from URL
  const currentPage = Number.parseInt(getSearchParam("page") ?? String(initialPage))
  const itemsPerPage = Number.parseInt(getSearchParam("limit") ?? String(initialItemsPerPage))

  // Calculate pagination values
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  /**
   * Change current page
   */
  const setPage = useCallback(
    (page: number) => {
      updateSearchParams({ page: page > 1 ? page : null })
    },
    [updateSearchParams],
  )

  /**
   * Change items per page
   */
  const setItemsPerPage = useCallback(
    (limit: number) => {
      updateSearchParams({
        limit: limit !== initialItemsPerPage ? limit : null,
        page: null, // Reset to first page when changing page size
      })
    },
    [updateSearchParams, initialItemsPerPage],
  )

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setPage(currentPage + 1)
    }
  }, [currentPage, totalPages, setPage])

  /**
   * Go to previous page
   */
  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setPage(currentPage - 1)
    }
  }, [currentPage, setPage])

  return {
    // Current state
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,

    // Navigation methods
    setPage,
    setItemsPerPage,
    nextPage,
    previousPage,

    // Computed values
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
  }
}
