import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { UseQueryResult } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'
import {
  formatDraftDateTime,
  getApprovalStatusBadge,
  getFileAttachedIconInfo,
} from '../lib/approvalStatusBadge'
import type { DocumentBoxQueryParams, DocumentBoxRow, Page } from '../model/approval'

/** 검색 디바운스 지연(ms). BoardListPage(T10.3)와 동일한 값을 재사용한다. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * 4종 문서함이 전달하는 목록 조회 훅 타입(T1.5 use*DraftsQuery/useMyAccessibleDocumentsQuery).
 * keyword/page/size 파라미터를 받아 Page<DocumentBoxRow>를 반환한다.
 */
type DocumentBoxListQueryHook = (
  params: DocumentBoxQueryParams,
) => UseQueryResult<Page<DocumentBoxRow>>

/**
 * 4종 문서함 공용 목록 컴포넌트(ROADMAP(DRAFT) T1.4, F710·F712·F713·F714).
 *
 * 상신함·임시저장함·결재대기함·결재함은 동일한 DocumentBoxRow 구조와 keyword/page/size 계약을
 * 공유하므로(§참조 계약 매핑 "공용 행"), 반복되는 목록 로직 — 제목 keyword 검색(300ms 디바운스),
 * 페이지 상태(usePageState + PaginationControls, 페이징 number+1), 조회(주입된 훅), 조회 실패 토스트,
 * 로딩/빈/에러 분기, react-table 행 렌더 — 을 이 한 컴포넌트에 캡슐화한다. 그 결과 T1.6의 4종 페이지는
 * 각자의 조회 훅과 문구만 주입하는 얇은 래퍼가 된다.
 *
 * useListQuery는 각 페이지가 최상위에서 import한 **고정 참조 훅**을 그대로 전달하므로 렌더 간
 * 동일 참조가 보장된다(훅 호출 순서 안정 → Rules of Hooks 준수). react-table 컬럼 헬퍼 렌더는
 * BoardListTable(T10.3) 패턴을 복제한다(정렬/필터 로우모델 없음 — 검색은 서버 keyword 파라미터로만 처리).
 *
 * onRowClick은 상세 라우트가 생기는 M2 T2.5에서 상세 네비게이션으로 주입한다. M1에서는 주입하지
 * 않아(=undefined) 행이 비인터랙티브로 렌더된다(행 클릭 콜백 슬롯만 확보).
 */
const columnHelper = createColumnHelper<DocumentBoxRow>()

/** 첨부·보기 셀만 중앙 정렬한다(그 외 텍스트/배지 컬럼은 좌측 정렬). */
const COLUMN_ALIGN: Record<string, string> = {
  isFileAttached: 'text-center',
  view: 'text-center',
}

/** 셀 정렬 클래스(맵에 없으면 좌측 정렬). 헤더·본문 셀이 동일 규칙을 공유한다. */
function alignClass(columnId: string): string {
  return COLUMN_ALIGN[columnId] ?? 'text-left'
}

interface DocumentBoxTableProps {
  /** 4종 문서함 중 하나의 목록 조회 훅(고정 참조로 전달). */
  useListQuery: DocumentBoxListQueryHook
  /** 목록이 비었을 때 표시 문구. 문서함별로 다른 안내를 주입한다. */
  emptyMessage?: string
  /** 상위(문서함 홈)가 소유한 검색어. 실제 검색 입력은 상위 TabsList 행에서 렌더되며, 이 값이
   *  300ms 디바운스되어 서버 keyword로 반영된다(항상 부모가 값을 주므로 필수). */
  searchValue: string
  /** 행 클릭 콜백. M2 T2.5에서 상세 네비게이션을 주입한다. 없으면 행은 비인터랙티브. */
  onRowClick?: (draftId: number) => void
}

/**
 * 문서함 목록 표 + 페이징을 캡슐화한 공용 패널. 4종 페이지가 조회 훅만 바꿔 재사용한다.
 * 검색 입력은 상위 화면(TabsList 행)이 소유하고, 이 컴포넌트는 searchValue를 디바운스만 담당한다.
 */
export function DocumentBoxTable({
  useListQuery,
  emptyMessage = '문서가 없습니다.',
  searchValue,
  onRowClick,
}: DocumentBoxTableProps) {
  const [keyword, setKeyword] = useState('')
  const { page, size, onPageChange, resetPage } = usePageState()

  // onRowClick을 ref로 참조한다: 상위가 인라인 화살표 핸들러를 넘기면 매 렌더마다 identity가 바뀌는데,
  // 이를 columns 의존성에 직접 넣으면 columns가 매번 재생성돼 react-table이 표 서브트리를 리마운트한다
  // (검색 타이핑마다 표 깜빡임·포커스 손실). ref로 최신 핸들러만 갈아끼워 columns를 안정 참조로 유지한다.
  const onRowClickRef = useRef(onRowClick)
  useEffect(() => {
    onRowClickRef.current = onRowClick
  }, [onRowClick])

  // 검색어 디바운스: 상위가 주입한 searchValue를 300ms 유예 후 확정 keyword로 반영하고 페이지를 0으로 리셋한다.
  // resetPage는 usePageState 내부에서 useCallback으로 안정화돼 있어 무관한 리렌더마다 재실행되지 않는다.
  useEffect(() => {
    const trimmed = searchValue.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => {
      setKeyword(trimmed)
      resetPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchValue, keyword, resetPage])

  const listQuery = useListQuery({ keyword, page, size })

  // 조회 실패는 PRD 지시대로 토스트로 알린다(handleApiError 단일 진입점 — attendance MyAttendancePage
  // 컨벤션. 이 목록엔 not-found 전용 UX가 없어 board식 isNotFound 수동 분기 대신 handleApiError를 쓴다).
  useEffect(() => {
    if (!listQuery.error) {
      return
    }
    handleApiError(listQuery.error, { toast })
  }, [listQuery.error])

  const columns = useMemo(
    () => [
      columnHelper.accessor('draftTitle', {
        header: '제목',
        cell: (info) => (
          <span className="truncate font-medium text-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('drafterName', { header: '기안자' }),
      columnHelper.accessor('submittedAt', {
        header: '상신일시',
        // 미상신(임시저장) 문서는 submittedAt이 null → formatDraftDateTime이 "-"로 표기한다.
        cell: (info) => formatDraftDateTime(info.getValue()),
      }),
      columnHelper.accessor('latestApproverName', {
        header: '최근 결재자',
        // 아직 처리 결재자가 없으면 null → 대시로 표기.
        cell: (info) => info.getValue() ?? '-',
      }),
      columnHelper.accessor('approvalStatus', {
        header: '상태',
        // 서버가 표시명 문자열(예 "결재완료")로 내려주므로 표시명 기준 배지 헬퍼로 매핑한다.
        cell: (info) => {
          const { label, variant } = getApprovalStatusBadge(info.getValue())
          return <Badge variant={variant}>{label}</Badge>
        },
      }),
      columnHelper.accessor('isFileAttached', {
        header: '첨부',
        // 첨부 개수는 계약에 없고 boolean만 있다 — 존재 여부만 아이콘/대시로 표기(근거 없는 개수 발명 금지).
        cell: (info) => {
          const { Icon, ariaLabel } = getFileAttachedIconInfo(info.getValue())
          return Icon ? (
            <Icon className="inline size-4 text-muted-foreground" aria-label={ariaLabel} />
          ) : (
            <span className="text-muted-foreground/60" aria-label={ariaLabel}>
              -
            </span>
          )
        },
      }),
      // 보기: 행 전체 클릭과 별개인 명시적 상세 진입 버튼. onRowClick이 없으면(비인터랙티브) 셀을 비운다.
      // 최신 핸들러는 ref로 읽어(위 주석 참조) columns를 안정 참조로 유지한다.
      columnHelper.display({
        id: 'view',
        header: '보기',
        cell: ({ row }) => {
          const handleView = onRowClickRef.current
          return handleView ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation() // 행 클릭 핸들러와 중복 트리거 방지
                handleView(row.original.draftId)
              }}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="상세보기"
            >
              <Eye className="size-4" />
            </button>
          ) : null
        },
      }),
    ],
    [],
  )

  const rows = listQuery.data?.content ?? []

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const pageInfo: PageMeta = listQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const isInteractive = onRowClick != null

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* 표 영역: flex-1로 남는 높이를 채워 페이지네이션을 카드 하단에 고정한다.
          placeholderData: keepPreviousData가 검색·페이지 변경 중 이전 목록을 유지하므로
          isLoading은 최초 로딩에서만 true가 되어 깜빡임이 없다. */}
      <div className="flex-1">
        {listQuery.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : listQuery.error ? (
          // 실패는 위 useEffect가 토스트로 알렸으므로 화면은 빈 상태 문구만 표시한다.
          <p className="py-8 text-center text-sm text-muted-foreground">
            목록을 불러오지 못했습니다.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-3 py-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground',
                        alignClass(header.column.id),
                      )}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  role={isInteractive ? 'button' : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                  onClick={isInteractive ? () => onRowClick(row.original.draftId) : undefined}
                  onKeyDown={
                    isInteractive
                      ? (event) => {
                          if (event.key === 'Enter') {
                            onRowClick(row.original.draftId)
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    'border-b border-border transition-colors last:border-0',
                    isInteractive &&
                      'cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-3 py-3 align-middle whitespace-nowrap text-muted-foreground',
                        alignClass(cell.column.id),
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* 하단 페이지네이션(공유 표준 컴포넌트 재사용, 페이징 number+1) */}
      <PaginationControls
        className="border-t pt-4"
        pageInfo={pageInfo}
        page={page}
        onPageChange={onPageChange}
        unit="건"
      />
    </div>
  )
}
