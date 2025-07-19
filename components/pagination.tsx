'use client'

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems?: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  loading?: boolean
  showPageSizeSelector?: boolean
  showInfo?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  loading = false,
  showPageSizeSelector = true,
  showInfo = true
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems || currentPage * pageSize)

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 7

    if (totalPages <= maxVisiblePages) {
      // 如果总页数少于最大显示页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 复杂的页码显示逻辑
      if (currentPage <= 4) {
        // 当前页在前面
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // 当前页在后面
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* 信息显示 */}
      {showInfo && (
        <div className="text-sm text-gray-600">
          {totalItems ? (
            <>显示 {startItem}-{endItem} 条，共 {totalItems.toLocaleString()} 条记录</>
          ) : (
            <>第 {currentPage} 页，共 {totalPages} 页</>
          )}
        </div>
      )}

      {/* 分页控件 */}
      <div className="flex items-center gap-2">
        {/* 每页显示数量选择器 */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">每页</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              disabled={loading}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">条</span>
          </div>
        )}

        {/* 分页按钮 */}
        <div className="flex items-center gap-1">
          {/* 首页 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || loading}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* 上一页 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* 页码 */}
          {pageNumbers.map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-2 py-1 text-sm text-gray-500">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}

          {/* 下一页 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* 末页 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// 简化版分页组件
export function SimplePagination({
  currentPage,
  hasMore,
  onPageChange,
  loading = false
}: {
  currentPage: number
  hasMore: boolean
  onPageChange: (page: number) => void
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        上一页
      </Button>
      
      <span className="px-4 py-2 text-sm text-gray-600">
        第 {currentPage} 页
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMore || loading}
      >
        下一页
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}
