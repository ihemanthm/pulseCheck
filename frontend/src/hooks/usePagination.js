import { useState, useMemo } from 'react'

export function usePagination(items, pageSize = 50) {
  const [currentPage, setCurrentPage] = useState(1)

  const { startIndex, endIndex, paginatedItems, totalPages } = useMemo(() => {
    if (!items) return { startIndex: 0, endIndex: 0, paginatedItems: [], totalPages: 0 }

    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    const total = Math.ceil(items.length / pageSize)

    return {
      startIndex: start,
      endIndex: Math.min(end, items.length),
      paginatedItems: items.slice(start, end),
      totalPages: total
    }
  }, [items, pageSize, currentPage])

  const goToPage = (page) => {
    const max = Math.ceil((items?.length || 0) / pageSize)
    const validPage = Math.max(1, Math.min(page, max))
    setCurrentPage(validPage)
  }

  const nextPage = () => {
    goToPage(currentPage + 1)
  }

  const prevPage = () => {
    goToPage(currentPage - 1)
  }

  return {
    currentPage,
    pageSize,
    startIndex,
    endIndex,
    paginatedItems,
    totalPages,
    totalItems: items?.length || 0,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  }
}
