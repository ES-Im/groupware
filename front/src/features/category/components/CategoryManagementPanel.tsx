import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Input } from '@/shared/ui/input'
import { useCategoryManagementQuery } from '../api/useCategoryManagementQuery'
import { useCategoryRegisterMutation } from '../api/useCategoryRegisterMutation'
import type { CategoryNameFormValues } from '../model/categorySchema'
import { CategoryManagementRow } from './CategoryManagementRow'
import { CategoryNameForm } from './CategoryNameForm'

type VisibilityFilter = 'all' | 'true' | 'false'

const SEARCH_DEBOUNCE_MS = 300

export function CategoryManagementPanel() {
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
  const { page, size, onPageChange, resetPage } = usePageState()

  const registerMutation = useCategoryRegisterMutation()

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => {
      setKeyword(trimmed)
      resetPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword, resetPage])

  const managementQuery = useCategoryManagementQuery({
    keyword: keyword || undefined,
    isVisible: visibilityFilter === 'all' ? undefined : visibilityFilter === 'true',
    page,
    size,
  })

  useEffect(() => {
    if (!managementQuery.error) {
      return
    }
    toast.error(normalizeApiError(managementQuery.error).message)
  }, [managementQuery.error])

  function handleVisibilityFilterChange(value: VisibilityFilter) {
    setVisibilityFilter(value)
    resetPage()
  }

  async function handleRegister(values: CategoryNameFormValues) {
    await registerMutation.mutateAsync(values.categoryName)
    toast.success('카테고리를 등록했습니다')
  }

  const categories = managementQuery.data?.content ?? []
  const pageInfo: PageMeta = managementQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  return (
    <div className="flex flex-col gap-4">
      <CategoryNameForm submitLabel="추가" placeholder="새 카테고리명" onSubmit={handleRegister} />

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="category-management-search" className="sr-only">
            카테고리명 검색
          </label>
          <Input
            id="category-management-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="카테고리명 검색"
            className="pl-8"
          />
        </div>
        <label htmlFor="category-management-visibility" className="sr-only">
          노출여부 필터
        </label>
        <select
          id="category-management-visibility"
          value={visibilityFilter}
          onChange={(event) => handleVisibilityFilterChange(event.target.value as VisibilityFilter)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="all">전체</option>
          <option value="true">노출</option>
          <option value="false">숨김</option>
        </select>
      </div>

      <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {managementQuery.isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            조회 조건에 해당하는 카테고리가 없습니다.
          </p>
        ) : (
          categories.map((category) => (
            <CategoryManagementRow key={category.categoryId} category={category} />
          ))
        )}
      </ul>

      <PaginationControls pageInfo={pageInfo} page={page} onPageChange={onPageChange} unit="건" />
    </div>
  )
}
