import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { FileClock, FilePlus2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useCategoriesQuery } from '@/features/category/api/useCategoriesQuery'
import { useBoardListQuery } from '../api/useBoardListQuery'
import { BoardCategoryFilter } from '../components/BoardCategoryFilter'
import { BoardListTable } from '../components/BoardListTable'

/** 검색 디바운스 지연(ms). DepartmentsPage(T6.3)와 동일한 값을 재사용한다. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * 게시판 목록 페이지(F301, ROADMAP T10.3, docs/prd/4.board-slice-prd.md §게시판 목록 페이지).
 *
 * 카테고리 pill 필터(F302 `useCategoriesQuery`, 레퍼런스 목업의 카테고리 버튼 그룹을 재해석한
 * `BoardCategoryFilter`)로 조회 대상 카테고리를 고르고, 그 categoryId로 `useBoardListQuery`(F301)를
 * 호출한다. pill은 순수 시각/인터랙션 패턴만 기존 `<select>`에서 바꾼 것으로, 바인딩되는 상태/로직
 * (selectedCategoryId·handleCategoryChange·categoriesQuery)은 그대로 유지한다. 카테고리 목록이
 * 도착하면 첫 항목을 기본 선택한다(그 이후에는 사용자가 직접 바꾸기 전까지 유지). 제목 keyword
 * 검색은 DepartmentsPage와 동일하게 로컬 입력값을 300ms 디바운스한 뒤에만 쿼리 파라미터로 반영한다.
 *
 * 페이징은 신규 UI를 만들지 않고 T10.1이 확립한 공유 표준(`usePageState` + `PaginationControls`)을
 * 그대로 소비한다. 카테고리 변경·검색어 확정 시 모두 페이지를 0으로 리셋해 존재하지 않는 페이지를
 * 조회하는 것을 막는다(페이지 크기 변경 리셋은 usePageState 내부 onSizeChange가 처리).
 *
 * "글쓰기"는 T12.2에서 `/boards/new`(BoardCreatePage)로 연결했다. "임시저장함"은 T15.1에서
 * `/boards/drafts`(BoardDraftsPage)로 연결했다.
 */
export function BoardListPage() {
  const navigate = useNavigate()
  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined)
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const { page, size, onPageChange, resetPage } = usePageState()

  // 카테고리 목록이 도착하면 첫 항목을 기본 선택한다(이미 선택된 값이 있으면 덮어쓰지 않는다).
  useEffect(() => {
    if (selectedCategoryId === undefined && categories.length > 0) {
      setSelectedCategoryId(categories[0].categoryId)
    }
  }, [categories, selectedCategoryId])

  // 검색 입력 디바운스: 300ms 유예 후에만 확정된 keyword로 반영하고 페이지를 0으로 리셋한다.
  // resetPage는 usePageState 내부에서 useCallback으로 안정화돼 있어(T10.3 리뷰 지적으로 T10.1
  // 공유 훅을 수정) 이 effect가 무관한 리렌더마다 재실행되지 않는다.
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

  const boardListQuery = useBoardListQuery(selectedCategoryId, { keyword, page, size })

  // 조회 실패 중 not-found가 아닌 경우만 토스트로 알린다(not-found는 아래에서 전용 UX로 렌더).
  useEffect(() => {
    if (!categoriesQuery.error) {
      return
    }
    const apiError = normalizeApiError(categoriesQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [categoriesQuery.error])

  useEffect(() => {
    if (!boardListQuery.error) {
      return
    }
    const apiError = normalizeApiError(boardListQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [boardListQuery.error])

  function handleCategoryChange(value: number) {
    setSelectedCategoryId(value)
    resetPage()
  }

  function handleRowClick(boardId: number) {
    navigate(`/boards/${boardId}`)
  }

  const pageInfo: PageMeta = boardListQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">게시판</h1>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => navigate('/boards/new')}>
            <FilePlus2 />
            글쓰기
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => navigate('/boards/drafts')}>
            <FileClock />
            임시저장함
          </Button>
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader className="border-b">
          <CardTitle>게시글 목록</CardTitle>
          <CardDescription>카테고리별 게시글을 페이징 목록으로 표시합니다.</CardDescription>
          {/* 우측 카운트 배지(레퍼런스의 "N건") — 현재 필터 기준 총 게시글 수를 표기한다. */}
          <CardAction>
            <Badge variant="secondary" className="tabular-nums">
              {pageInfo.totalElements}건
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 툴바: 카테고리 pill 필터 + 제목 검색. 카테고리가 있을 때만 pill을 노출한다. */}
          {categories.length > 0 && (
            <BoardCategoryFilter
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={handleCategoryChange}
            />
          )}
          <div className="sm:flex sm:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="board-search" className="sr-only">
                제목 검색
              </label>
              <Input
                id="board-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="게시글 검색"
                className="pl-8"
              />
            </div>
          </div>

          {/* 표 영역: 카테고리 로딩/빈 상태 → 안내 문구, 목록 조회 로딩/에러/빈 상태 → 순서대로 분기.
              placeholderData: keepPreviousData(useBoardListQuery)가 검색·카테고리·페이지 변경 중에도
              이전 목록을 유지하므로, isLoading은 최초 로딩에서만 true가 되어 깜빡임이 발생하지 않는다. */}
          {categoriesQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              노출된 카테고리가 없습니다.
            </p>
          ) : selectedCategoryId === undefined || boardListQuery.isLoading ? (
            // 카테고리 목록 도착 직후~기본 선택 useEffect가 selectedCategoryId를 세팅하기 전
            // 1프레임 동안은 useBoardListQuery가 enabled:false(=isLoading false)로 빠져 있다.
            // 이 틱을 명시적으로 로딩으로 취급해 "게시글이 없습니다" 오표시 플래시를 막는다.
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : boardListQuery.error ? (
            isNotFound(normalizeApiError(boardListQuery.error)) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                게시글을 찾을 수 없습니다.
              </p>
            ) : (
              // not-found가 아닌 실패는 위 useEffect가 토스트로 알렸으므로, 화면은 빈 상태로만 표시한다.
              <p className="py-8 text-center text-sm text-muted-foreground">
                게시글 목록을 불러오지 못했습니다.
              </p>
            )
          ) : (
            <BoardListTable data={boardListQuery.data?.content ?? []} onRowClick={handleRowClick} />
          )}

          {/* 하단 페이지네이션(ROADMAP T10.1, 공유 표준 컴포넌트 재사용) */}
          <PaginationControls
            className="border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="건"
          />
        </CardContent>
      </Card>
    </div>
  )
}
