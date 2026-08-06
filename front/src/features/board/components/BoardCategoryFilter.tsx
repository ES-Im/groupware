import { Folder } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { CategoryItem } from '@/features/category/model/category'

interface BoardCategoryFilterProps {
  categories: CategoryItem[]
  selectedCategoryId: number | undefined
  onSelect: (categoryId: number) => void
  className?: string
}

export function BoardCategoryFilter({
  categories,
  selectedCategoryId,
  onSelect,
  className,
}: BoardCategoryFilterProps) {
  return (
    <nav aria-label="카테고리 필터" className={className}>
      <ul className="flex flex-col gap-1">
        {categories.map((category) => {
          const isSelected = category.categoryId === selectedCategoryId
          return (
            <li key={category.categoryId}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(category.categoryId)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  isSelected
                    ? 'bg-primary font-medium text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Folder className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{category.categoryName}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
