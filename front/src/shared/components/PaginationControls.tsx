import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

export interface PageMeta {
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
}

interface PaginationControlsProps {
  pageInfo: PageMeta
  page: number
  onPageChange: (page: number) => void
  unit?: string
  className?: string
}

type PageWindowItem = number | 'ellipsis'

function buildPageWindow(current: number, total: number): PageWindowItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const items: PageWindowItem[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) {
    items.push('ellipsis')
  }
  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }
  if (end < total - 1) {
    items.push('ellipsis')
  }
  items.push(total)
  return items
}

export function PaginationControls({
  pageInfo,
  page,
  onPageChange,
  unit = '',
  className,
}: PaginationControlsProps) {
  const rangeStart = pageInfo.totalElements === 0 ? 0 : pageInfo.number * pageInfo.size + 1
  const rangeEnd = pageInfo.number * pageInfo.size + pageInfo.numberOfElements
  const totalPages = pageInfo.totalPages || 1
  const currentPage = pageInfo.number + 1
  const pageWindow = buildPageWindow(currentPage, totalPages)

  return (
    <nav
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      aria-label="페이지 이동"
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        {rangeStart}-{rangeEnd} / {pageInfo.totalElements}
        {unit}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={pageInfo.first}
          onClick={() => onPageChange(page - 1)}
          aria-label="이전 페이지"
        >
          <ChevronLeft />
        </Button>
        {pageWindow.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-sm text-muted-foreground select-none"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === currentPage ? 'default' : 'ghost'}
              size="icon-sm"
              className="tabular-nums"
              aria-label={`${item} 페이지`}
              aria-current={item === currentPage ? 'page' : undefined}
              onClick={() => onPageChange(item - 1)}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={pageInfo.last}
          onClick={() => onPageChange(page + 1)}
          aria-label="다음 페이지"
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
