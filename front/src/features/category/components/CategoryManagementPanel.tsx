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

/** 노출여부 필터 값. 'all'은 isVisible 쿼리 파라미터 생략(전체)을 의미한다
 * (FranchiseInquiryListPage의 AnsweredFilter 동형). */
type VisibilityFilter = 'all' | 'true' | 'false'

/** 검색 디바운스 지연(ms). 다른 목록 페이지와 동일 값(BoardListPage SEARCH_DEBOUNCE_MS). */
const SEARCH_DEBOUNCE_MS = 300

/**
 * 카테고리 관리 모달 본문(`CATEGORY_MANAGEMENT`, ADMIN 전용).
 *
 * CategoryManagementDialog가 Dialog chrome(제목/설명)만 소유하고, 검색·필터·페이징·등록 상태는
 * 전부 이 컴포넌트가 소유한다 — Radix Dialog는 닫히면 DialogContent의 children을 언마운트하므로
 * (FranchiseEducationCreateDialog 주석 참조), 이 컴포넌트를 별도 자식으로 분리해두면 모달을 다시
 * 열 때마다 검색어/필터/페이지가 항상 초기 상태로 새로 마운트된다(별도 reset 로직 불필요).
 *
 * 등록/이름변경은 공용 CategoryNameForm을 재사용하고, 행별 이름변경·노출토글은
 * CategoryManagementRow가 캡슐화한다. 페이징은 신규 UI 없이 공유 표준(usePageState +
 * PaginationControls)을 그대로 소비한다(BoardListPage/FranchiseInquiryListPage 동형).
 */
export function CategoryManagementPanel() {
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
  const { page, size, onPageChange, resetPage } = usePageState()

  const registerMutation = useCategoryRegisterMutation()

  // 검색 입력 디바운스: 300ms 유예 후에만 확정된 keyword로 반영하고 페이지를 0으로 리셋한다
  // (BoardListPage/FranchiseInquiryListPage 동일 컨벤션).
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
      {/* 등록: 인라인 입력 + 등록 버튼(공용 CategoryNameForm 재사용, 취소 버튼 없음). */}
      <CategoryNameForm submitLabel="추가" placeholder="새 카테고리명" onSubmit={handleRegister} />

      {/* 검색 + 노출여부 필터. select는 이 저장소에 shadcn Select가 없어 FranchiseInquiryListPage와
          동일하게 네이티브 select를 그대로 스타일링해 재사용한다. */}
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

      {/* 목록: 최대 높이를 두고 내부 스크롤(모달 자체 스크롤과 이중 스크롤을 피하기 위해 적당히 제한). */}
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
