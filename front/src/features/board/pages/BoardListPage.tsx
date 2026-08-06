import { useEffect, useState } from 'react'
import { ChevronLeft, FilePlus, Search, Tags } from 'lucide-react'
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
import { CategoryManagementTrigger } from '@/features/category/components/CategoryManagementTrigger'
import { useBoardListQuery } from '../api/useBoardListQuery'
import { BoardCategoryFilter } from '../components/BoardCategoryFilter'
import { BoardCreateForm } from '../components/BoardCreateForm'
import { BoardDetailView } from '../components/BoardDetailView'
import { BoardListTable } from '../components/BoardListTable'

const SEARCH_DEBOUNCE_MS = 300

export function BoardListPage() {
  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  const [isComposing, setIsComposing] = useState(false)

  const [selectedBoardId, setSelectedBoardId] = useState<number | undefined>(undefined)

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined)
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const { page, size, onPageChange, resetPage } = usePageState({ initialSize: 20 })

  useEffect(() => {
    if (selectedCategoryId === undefined && categories.length > 0) {
      setSelectedCategoryId(categories[0].categoryId)
    }
  }, [categories, selectedCategoryId])

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
    setSelectedBoardId(undefined)
  }

  function handleRowClick(boardId: number) {
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
    <div className="flex w-full flex-col p-4 sm:p-6 lg:h-full lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">게시판</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          사내 공지와 소통 게시글을 카테고리별로 확인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[320px_1fr]">
        <div className="flex h-fit flex-col gap-4">
          <Card className="h-fit">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Tags className="size-4 text-muted-foreground" aria-hidden="true" />
                카테고리
              </CardTitle>
              <CardAction>
                <CategoryManagementTrigger />
              </CardAction>
            </CardHeader>
            <CardContent>
              {categories.length > 0 && (
                <BoardCategoryFilter
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onSelect={handleCategoryChange}
                />
              )}
            </CardContent>
          </Card>
          <Button type="button" size="lg" className="w-full" onClick={() => setIsComposing(true)}>
            <FilePlus />
            게시글 작성
          </Button>
          {(isComposing || selectedBoardId !== undefined) && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => {
                setIsComposing(false)
                setSelectedBoardId(undefined)
              }}
            >
              <ChevronLeft />
              목록
            </Button>
          )}
        </div>

        {isComposing ? (
          <Card className="flex flex-col lg:min-h-0 lg:flex-1">
            <CardHeader className="border-b">
              <CardTitle>게시글 작성</CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">
              <BoardCreateForm
                onSuccess={() => setIsComposing(false)}
                defaultCategoryId={selectedCategoryId}
              />
            </CardContent>
          </Card>
        ) : selectedBoardId !== undefined ? (
          <BoardDetailView boardId={selectedBoardId} inline />
        ) : (
          <Card className="lg:min-h-[22rem] lg:flex-1">
            <CardHeader className="border-b">
              <CardTitle>게시글 목록</CardTitle>
              <CardAction className="flex items-center gap-2">
                <div className="relative">
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
                    className="h-8 w-32 pl-8 sm:w-48"
                  />
                </div>
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {pageInfo.totalElements}건
                </Badge>
              </CardAction>
            </CardHeader>

            <div className="px-(--card-spacing) pt-(--card-spacing) lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {categoriesQuery.isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
              ) : categories.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  노출된 카테고리가 없습니다.
                </p>
              ) : selectedCategoryId === undefined || boardListQuery.isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
              ) : boardListQuery.error ? (
                isNotFound(normalizeApiError(boardListQuery.error)) ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    게시글을 찾을 수 없습니다.
                  </p>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    게시글 목록을 불러오지 못했습니다.
                  </p>
                )
              ) : (
                <BoardListTable data={boardListQuery.data?.content ?? []} onRowClick={handleRowClick} />
              )}
            </div>

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
  )
}
