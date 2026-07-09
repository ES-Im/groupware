import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronDown, ChevronUp, FileClock, Search, Tags } from 'lucide-react'
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
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useCategoriesQuery } from '@/features/category/api/useCategoriesQuery'
import { useBoardListQuery } from '../api/useBoardListQuery'
import { BoardCategoryFilter } from '../components/BoardCategoryFilter'
import { BoardCreateForm } from '../components/BoardCreateForm'
import { BoardDetailView } from '../components/BoardDetailView'
import { BoardListTable } from '../components/BoardListTable'

/** 검색 디바운스 지연(ms). DepartmentsPage(T6.3)와 동일한 값을 재사용한다. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * 게시판 목록 페이지(F301, ROADMAP T10.3, docs/prd/4.board-slice-prd.md §게시판 목록 페이지).
 *
 * 카테고리 세로 nav 필터(F302 `useCategoriesQuery`, 레퍼런스 좌측 사이드바를 재해석한
 * `BoardCategoryFilter`, 좌측 카드에 배치)로 조회 대상 카테고리를 고르고, 그 categoryId로
 * `useBoardListQuery`(F301)를 호출한다. nav 목록은 순수 시각/인터랙션 패턴만 갈아 끼운 것으로,
 * 바인딩되는 상태/로직(selectedCategoryId·handleCategoryChange·categoriesQuery)은 그대로 유지한다.
 * 카테고리 목록이
 * 도착하면 첫 항목을 기본 선택한다(그 이후에는 사용자가 직접 바꾸기 전까지 유지). 제목 keyword
 * 검색은 DepartmentsPage와 동일하게 로컬 입력값을 300ms 디바운스한 뒤에만 쿼리 파라미터로 반영한다.
 *
 * 페이징은 신규 UI를 만들지 않고 T10.1이 확립한 공유 표준(`usePageState` + `PaginationControls`)을
 * 그대로 소비한다. 카테고리 변경·검색어 확정 시 모두 페이지를 0으로 리셋해 존재하지 않는 페이지를
 * 조회하는 것을 막는다(페이지 크기 변경 리셋은 usePageState 내부 onSizeChange가 처리).
 *
 * 게시글 작성은 별도 페이지(/boards/new) 대신 우측 컬럼 상단의 인라인 접이식 카드(BoardCreateForm
 * 재사용)로 제공한다 — 레퍼런스(UBold)와 동일하게 기본 펼침이며, 등록 성공 시 카드를 접어 갱신된
 * 목록에 집중하게 한다(폼은 매 마운트마다 defaultValues로 초기화). "임시저장함"은 T15.1에서
 * `/boards/drafts`(BoardDraftsPage)로 연결한 전용 페이지 기능으로 그대로 유지한다(인라인 폼 내부
 * "임시저장글" 토글과는 다른 기능).
 */
export function BoardListPage() {
  const navigate = useNavigate()
  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  // 인라인 게시글 작성 카드의 펼침 상태 — 레퍼런스처럼 기본 펼침으로 두고, 등록 성공 시 접는다.
  const [isComposeOpen, setIsComposeOpen] = useState(true)

  // 인라인 상세 전환(레퍼런스 UBold): 행 클릭 시 라우트 이동 없이 "게시글 목록" 카드 자리를
  // "게시글 상세"(BoardDetailView)로 교체한다. undefined면 목록, 값이 있으면 해당 글 상세를 렌더.
  const [selectedBoardId, setSelectedBoardId] = useState<number | undefined>(undefined)

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
    // 다른 카테고리로 필터링하는데 이전 상세가 남아 있으면 혼란스러우므로 상세 보기를 함께 닫는다.
    setSelectedBoardId(undefined)
  }

  function handleRowClick(boardId: number) {
    // 라우트 이동 대신 인라인 상세로 전환한다(URL 불변, 같은 카드 자리에서 내용만 교체).
    setSelectedBoardId(boardId)
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
    // lg 이상에서 페이지를 main 스크롤 컨테이너 높이(헤더~푸터 사이)에 꽉 채워, 우측 목록/상세 카드가
    // "게시글 작성 카드 아래 ~ 푸터 위"까지 정확히 차지하고 내부만 스크롤되게 한다(별도 calc 없이 flex로).
    <div className="flex w-full flex-col p-4 sm:p-6 lg:h-full lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">게시판</h1>
        <div className="flex items-center gap-2">
          {/* 글쓰기는 우측 인라인 작성 카드가 대체한다. 임시저장함은 별도 전용 페이지라 유지한다. */}
          <Button type="button" size="sm" variant="outline" onClick={() => navigate('/boards/drafts')}>
            <FileClock />
            임시저장함
          </Button>
        </div>
      </div>

      {/* 좌: 카테고리 사이드바 카드 / 우: 게시글 목록 카드. DepartmentDetailView와 동일한 2열 그리드
          패턴을 재사용해 lg 미만에서는 세로 스택(카테고리 카드가 위)으로 떨어진다. lg에서는 남는
          높이를 그리드가 채우고(min-h-0로 자식 스크롤 허용), 우측 목록/상세 카드가 그 높이를 물려받는다.
          모바일에서 grid-cols-1(=minmax(0,1fr))을 명시해야 한다 — 생략하면 암묵 auto 트랙이 max-content로
          커져 자식이 뷰포트 밖으로 넘치고, LayoutShell이 h-svh로 바뀌며 main이 overflow-y-auto가 된 뒤로는
          그 오버플로가 가로 스크롤바로 드러난다(자식 min-content는 작아 정상 축소 가능). lg 값은 불변. */}
      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[320px_1fr]">
        {/* 좌측: 카테고리 필터 카드(레퍼런스 좌측 사이드바) */}
        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Tags className="size-4 text-muted-foreground" aria-hidden="true" />
              카테고리
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 카테고리가 있을 때만 nav 목록을 노출한다(로딩/빈 상태 안내 문구는 우측 목록 카드에서 처리). */}
            {categories.length > 0 && (
              <BoardCategoryFilter
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelect={handleCategoryChange}
              />
            )}
          </CardContent>
        </Card>

        {/* 우측: 게시글 작성 인라인 카드(위) + 게시글 목록 카드(아래)를 세로로 스택한다. lg에서는
            그리드 셀 높이를 온전히 물려받아(min-h-0), 목록/상세 카드가 남는 높이를 채운다. */}
        <div className="flex flex-col gap-6 lg:min-h-0">
          {/* 게시글 작성 카드(레퍼런스 우측 상단): 헤더 우측 토글로 접고 펼친다(기본 펼침). */}
          <Card className="h-fit">
            <CardHeader className="border-b">
              <CardTitle>게시글 작성</CardTitle>
              <CardAction>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-expanded={isComposeOpen}
                  onClick={() => setIsComposeOpen((prev) => !prev)}
                >
                  {isComposeOpen ? <ChevronUp /> : <ChevronDown />}
                  {isComposeOpen ? '작성 닫기' : '작성 열기'}
                </Button>
              </CardAction>
            </CardHeader>
            {/* 펼친 상태에서만 폼을 렌더한다 — 접으면 언마운트되어 다음 펼침 시 defaultValues로 초기화된다.
                등록 성공 후에는 카드를 접어 갱신된 목록에 집중하게 한다(목록 리페치는 mutation onSuccess가 처리). */}
            {isComposeOpen && (
              <CardContent>
                <BoardCreateForm onSuccess={() => setIsComposeOpen(false)} />
              </CardContent>
            )}
          </Card>

          {/* 게시글 목록 ↔ 인라인 상세 전환(레퍼런스 UBold): 행 클릭 시 이 카드 자리가 상세 뷰로
              교체되고, 상세 헤더의 "← 목록" 버튼으로 다시 목록 카드로 복귀한다. 좌측 카테고리 카드와
              위 "게시글 작성" 카드는 전환과 무관하게 그대로 유지된다. */}
          {selectedBoardId !== undefined ? (
            <BoardDetailView boardId={selectedBoardId} onBack={() => setSelectedBoardId(undefined)} />
          ) : (
            // lg에서 카드 프레임을 남는 높이에 고정하고(min-h-0/flex-1), 헤더·검색·페이지네이션은
            // 스크롤 밖에 고정한 채 표 영역만 내부 스크롤되게 한다(Card 자체가 이미 flex flex-col).
            <Card className="lg:min-h-0 lg:flex-1">
              <CardHeader className="border-b">
                <CardTitle>게시글 목록</CardTitle>
                {/* 우측 카운트 배지(레퍼런스의 "N건") — 현재 필터 기준 총 게시글 수를 표기한다. */}
                <CardAction>
                  <Badge variant="secondary" className="tabular-nums">
                    {pageInfo.totalElements}건
                  </Badge>
                </CardAction>
              </CardHeader>

              {/* 검색 인풋: 항상 보이도록 스크롤 영역 밖(상단)에 고정한다. */}
              <CardContent>
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
              </CardContent>

              {/* 표 영역: lg에서 카드 높이가 고정되어 이 영역만 세로 스크롤된다(카드 프레임/검색/페이지네이션은
                  고정). 카테고리 로딩/빈 상태 → 안내 문구, 목록 조회 로딩/에러/빈 상태 → 순서대로 분기.
                  placeholderData: keepPreviousData(useBoardListQuery)가 검색·카테고리·페이지 변경 중에도
                  이전 목록을 유지하므로, isLoading은 최초 로딩에서만 true가 되어 깜빡임이 발생하지 않는다. */}
              <div className="px-(--card-spacing) lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
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
              </div>

              {/* 하단 페이지네이션(ROADMAP T10.1, 공유 표준 컴포넌트 재사용): 스크롤 영역 밖(하단)에 고정. */}
              <CardContent className="border-t pt-(--card-spacing)">
                <PaginationControls
                  pageInfo={pageInfo}
                  page={page}
                  onPageChange={onPageChange}
                  unit="건"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
