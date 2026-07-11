import { useEffect, useId, useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Paperclip, Search, Send, Trash2, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'
import { useDeleteDraftMutation } from '../api/useDeleteDraftMutation'
import { useMessageDeleteMutation } from '../api/useMessageDeleteMutation'
import { useMessageRestoreMutation } from '../api/useMessageRestoreMutation'
import { useMessagesQuery } from '../api/useMessagesQuery'
import { useMessageTrashMutation } from '../api/useMessageTrashMutation'
import { useSendDraftMutation } from '../api/useSendDraftMutation'
import type { MailBox, MessagesResponse } from '../model/messageTypes'

/** 검색 디바운스 지연(ms). DocumentBoxTable·BoardListPage와 동일한 값을 재사용한다. */
const SEARCH_DEBOUNCE_MS = 300

/** 받은함 전용 읽음 필터 상태. 'all'은 isRead 파라미터 자체를 전송하지 않는 것을 뜻한다. */
type ReadFilter = 'all' | 'read' | 'unread'

const READ_FILTERS: { value: ReadFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'read', label: '읽음' },
  { value: 'unread', label: '안읽음' },
]

/** 박스별 빈 목록 안내 문구(F1501~F1504). */
const EMPTY_MESSAGES: Record<MailBox, string> = {
  received: '받은 쪽지가 없습니다.',
  sent: '보낸 쪽지가 없습니다.',
  drafts: '임시보관된 쪽지가 없습니다.',
  trash: '휴지통이 비어 있습니다.',
}

const columnHelper = createColumnHelper<MessagesResponse>()

/** 읽음·첨부·액션 셀만 중앙 정렬한다(그 외 텍스트 컬럼은 좌측 정렬 — DocumentBoxTable 정렬 규칙 동형). */
const COLUMN_ALIGN: Record<string, string> = {
  isRead: 'text-center',
  fileCount: 'text-center',
  actions: 'text-center',
}

function alignClass(columnId: string): string {
  return COLUMN_ALIGN[columnId] ?? 'text-left'
}

/**
 * 쪽지 일시(`yyyy-MM-dd'T'HH:mm:ss`) 표시 포맷. sentAt은 미발송(임시보관)에서 null → 대시 표기.
 * approval formatDraftDateTime과 동일 포맷이지만 cross-domain import 금지 원칙에 따라 로컬 정의한다.
 */
function formatMessageDateTime(value: string | null): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

/**
 * 상대방 표기(F1502): 보낸함은 대표 수신자 + "외 N명"(receiverCount는 대표를 포함한 전체
 * 수신자 수이므로 N = receiverCount - 1), 그 외 박스는 발신자(부서명 + 이름)를 표기한다
 * (휴지통의 내 발신 쪽지도 스펙대로 발신자 열을 유지한다 — isSentByMe 분기는 상세 뷰 몫).
 */
function formatCounterpart(box: MailBox, row: MessagesResponse): string {
  if (box === 'sent') {
    if (!row.representativeReceiverName) {
      return '-'
    }
    return row.receiverCount > 1
      ? `${row.representativeReceiverName} 외 ${row.receiverCount - 1}명`
      : row.representativeReceiverName
  }
  return row.senderDeptName ? `${row.senderDeptName} ${row.senderName}` : row.senderName
}

/** 액션 컬럼(휴지통이동/복구/완전삭제 T3.4-b, 임시보관 발송/삭제 퀵액션 T5.3-b)이 소비하는
 * mutate 트리거. draft 삭제(onDeleteDraft)는 완전삭제(onDelete, isSentByMe 필요)와 다른
 * API(deleteDraft)·다른 시그니처(작성자 본인 단건)라 별도 필드로 둔다(이름 재사용 안 함). */
interface MessageRowActions {
  onTrash: (params: { messageId: number; isSentByMe: boolean }) => void
  onRestore: (params: { messageId: number; isSentByMe: boolean }) => void
  onDelete: (params: { messageId: number; isSentByMe: boolean }) => void
  onSendDraft: (messageId: number) => void
  onDeleteDraft: (messageId: number) => void
}

/**
 * box별 컬럼 구성: 제목 · 상대방(box 분기) · 수발신일시 · 읽음(받은함 전용) · 첨부 · 액션.
 * 체크박스 컬럼은 없다(벌크 미포함 결정, PRD 2026-07-10). 행 자체 클릭(상세/편집 진입)과
 * 별개인 명시적 버튼이라 각 버튼 onClick에서 stopPropagation으로 중복 트리거를 막는다
 * (DocumentBoxTable 'view' 컬럼 패턴 동형). mutate 함수는 TanStack Query v5에서 참조가
 * 안정적이라 useMemo 의존성에 넣어도 매 렌더 재계산되지 않는다.
 */
function buildColumns(box: MailBox, actions: MessageRowActions) {
  return [
    columnHelper.accessor('title', {
      header: '제목',
      cell: (info) => (
        <span
          className={cn(
            'truncate text-foreground',
            // 받은함 미읽음 쪽지는 제목을 굵게 구분한다(메일함 관례의 최소 구현).
            box === 'received' && info.row.original.isRead === false
              ? 'font-semibold'
              : 'font-medium',
          )}
        >
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'counterpart',
      header: box === 'sent' ? '받는 사람' : '보낸 사람',
      cell: ({ row }) => formatCounterpart(box, row.original),
    }),
    columnHelper.accessor('sentAt', {
      header: '수발신일시',
      // 임시보관(미발송) 쪽지는 sentAt이 null → 대시 표기.
      cell: (info) => formatMessageDateTime(info.getValue()),
    }),
    // 읽음 여부는 받은함에서만 유의미한 필드라 받은함에서만 컬럼을 노출한다. 미읽음을 채운 배지로 강조.
    ...(box === 'received'
      ? [
          columnHelper.accessor('isRead', {
            header: '읽음',
            cell: (info) =>
              info.getValue() ? <Badge variant="outline">읽음</Badge> : <Badge>안읽음</Badge>,
          }),
        ]
      : []),
    columnHelper.accessor('fileCount', {
      header: '첨부',
      // 클립 아이콘 + 개수를 함께 표기한다(레퍼런스 메일함 톤). 없으면 대시.
      cell: (info) => {
        const count = info.getValue()
        return count > 0 ? (
          <span
            className="inline-flex items-center justify-center gap-1 text-muted-foreground tabular-nums"
            aria-label={`첨부 ${count}개`}
          >
            <Paperclip className="size-4 shrink-0" aria-hidden="true" />
            {count}
          </span>
        ) : (
          <span className="text-muted-foreground/60" aria-label="첨부 없음">
            -
          </span>
        )
      },
    }),
    // 액션: 받은/보낸함=휴지통이동 1버튼, 휴지통=복구+완전삭제(AlertDialog 확인) 2버튼,
    // 임시보관함(T5.3-b)=발송(즉시)+삭제(AlertDialog 확인) 2버튼. 새 컬럼을 만들지 않고 기존
    // 'actions' 컬럼(id 고정)의 조건 분기만 box==='drafts'로 확장한다(T3.4-b 선례 — 임시보관함은
    // 처음에 "생명주기 액션 없음"으로 열 자체가 없었으나, 이번 태스크로 발송/삭제가 추가되며
    // 컬럼이 모든 box에서 렌더되도록 바뀐다).
    columnHelper.display({
      id: 'actions',
      header: '액션',
      cell: ({ row }) => {
        const { messageId, isSentByMe } = row.original

        if (box === 'drafts') {
          return (
            <div
              className="flex items-center justify-center gap-1"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="발송"
                onClick={() => actions.onSendDraft(messageId)}
              >
                <Send />
                <span className="sr-only">발송</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-sm" title="삭제">
                    <Trash2 />
                    <span className="sr-only">삭제</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>이 임시 쪽지를 삭제하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      삭제된 쪽지는 휴지통을 거치지 않고 즉시 삭제되며 복구할 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={() => actions.onDeleteDraft(messageId)}>
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )
        }

        if (box === 'trash') {
          return (
            // 행(tr) onKeyDown(Enter→handleRowActivate)과의 이중 발화 방지: onClick의
            // stopPropagation은 click만 막고 keydown 버블링은 막지 못하므로 별도로 막는다
            // (버튼=파괴적 생명주기 액션, 행=상세 진입으로 동작이 달라 DocumentBoxTable의
            // 무해한 이중 발화 선례와 다르다).
            <div
              className="flex items-center justify-center gap-1"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="복구"
                onClick={() => actions.onRestore({ messageId, isSentByMe })}
              >
                <Undo2 />
                <span className="sr-only">복구</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-sm" title="완전 삭제">
                    <X />
                    <span className="sr-only">완전 삭제</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>쪽지를 완전 삭제하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      삭제한 쪽지는 복구할 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={() => actions.onDelete({ messageId, isSentByMe })}>
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )
        }

        return (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="휴지통 이동"
            onClick={(event) => {
              event.stopPropagation()
              actions.onTrash({ messageId, isSentByMe })
            }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Trash2 />
            <span className="sr-only">휴지통 이동</span>
          </Button>
        )
      },
    }),
  ]
}

/**
 * T2.2-a(MessageBoxPage)가 고정한 슬롯 계약 그대로의 props. 행 클릭 분기는 이 테이블 책임:
 * received/sent/trash 행 → onOpenDetail, drafts 행 → onOpenCompose(messageId, true)(편집 모드).
 */
interface MessageBoxTableProps {
  box: MailBox
  onOpenDetail: (messageId: number) => void
  onOpenCompose: (messageId?: number, isEdit?: boolean) => void
}

/**
 * 쪽지함 4박스 공용 목록 테이블(ROADMAP(MESSAGE) T2.2-b, F1501~F1504).
 *
 * DocumentBoxTable(approval)의 목록 패턴 — 검색 300ms 디바운스, usePageState + PaginationControls
 * (페이징 number+1), react-table 코어 로우모델, 조회 실패 handleApiError 토스트 — 을 복제하되,
 * 문서함과 달리 검색창을 이 컴포넌트가 자체 소유한다(받은함 전용 isRead 필터가 box 조건부라
 * 검색+필터를 테이블이 함께 소유하는 편이 응집도가 높음 — 태스크 계획 결정).
 *
 * box 전환 시 이 컴포넌트는 리마운트되지 않고 box prop만 바뀐다(MessageBoxPage가 단일
 * TabsContent로 인스턴스를 유지) — useMessagesQuery의 keepPreviousData가 이전 박스 목록을
 * placeholder로 잠깐 유지하므로, isPlaceholderData 동안 목록을 dimming(투명도 감소 +
 * pointer-events 차단) 처리한다(2026-07-10 사용자 확정, useMessagesQuery.ts 주석 참고).
 */
export function MessageBoxTable({ box, onOpenDetail, onOpenCompose }: MessageBoxTableProps) {
  const searchInputId = useId()
  const [searchValue, setSearchValue] = useState('')
  const [keyword, setKeyword] = useState('')
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')
  const { page, size, onPageChange, resetPage } = usePageState()
  // 액션 컬럼(T3.4-b 휴지통 생명주기, T5.3-b 임시보관 발송/삭제)이 self-contained로 소비하는
  // mutation. 상위(MessageBoxPage)로 콜백을 bubbling하지 않는다 — 상세 뷰(MessageDetailView)나
  // 편집 뷰(MessageComposeView)와 달리 페이지 이동이 필요 없다(목록에 머문 채 invalidate로 갱신).
  const trashMutation = useMessageTrashMutation()
  const restoreMutation = useMessageRestoreMutation()
  const deleteMutation = useMessageDeleteMutation()
  const sendDraftMutation = useSendDraftMutation()
  const deleteDraftMutation = useDeleteDraftMutation()

  // box가 바뀌면(탭 전환) 검색어·읽음필터·페이지를 초기화한다(다른 박스의 검색 결과가 남으면 혼란 —
  // DocumentBoxHomePage가 탭 전환 시 searchValue를 비우는 것과 동일 이유). key 리마운트 대신
  // 렌더 중 상태 조정(React 공식 "props 변경 시 상태 초기화" 패턴)을 쓴다: 인스턴스를 유지해야
  // keepPreviousData의 이전 박스 placeholder가 살아 dimming 처리가 동작하기 때문이다.
  const [prevBox, setPrevBox] = useState(box)
  if (prevBox !== box) {
    setPrevBox(box)
    setSearchValue('')
    setKeyword('')
    setReadFilter('all')
    resetPage()
  }

  // 검색어 디바운스: 입력값을 300ms 유예 후 확정 keyword로 반영하고 페이지를 0으로 리셋한다
  // (DocumentBoxTable 디바운스 effect 복제 — resetPage는 useCallback으로 안정화돼 있다).
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

  // 받은함 외 박스에서는 isRead 키 자체를 params에 만들지 않는다 — queryKey에 무의미한 필드가
  // 섞여 동일 조회가 중복 캐시되는 것을 막는다(T2.1 리뷰 기록). '전체'도 파라미터 미전송이다.
  const isReadParam =
    box === 'received' && readFilter !== 'all' ? readFilter === 'read' : undefined
  const listQuery = useMessagesQuery(box, {
    keyword,
    page,
    size,
    ...(isReadParam != null ? { isRead: isReadParam } : {}),
  })

  // 조회 실패는 PRD 지시대로 토스트로 알린다(handleApiError 단일 진입점 — DocumentBoxTable 컨벤션).
  useEffect(() => {
    if (!listQuery.error) {
      return
    }
    handleApiError(listQuery.error, { toast })
  }, [listQuery.error])

  // box가 바뀌면 컬럼 구성도 바뀐다(받은함 전용 읽음 컬럼·상대방 열·액션 열 분기) — box를 의존성에
  // 포함. mutate 함수(TanStack Query v5, 참조 안정)도 명시해 린트 규칙을 만족한다.
  // onSendDraft·onDeleteDraft는 sendDraft(T4.3-a)·deleteDraft(T5.3-a) 훅이 onError 없이 전파하는
  // 컨벤션이라(다른 소비처가 submitWithErrorMapping으로 위임받는 구조), mutate 호출 시 handleApiError를
  // 옵션으로 직접 연결한다(신규 에러분기 발명 아님, 표준 진입점 재사용 — MessageBoxPage 동일 판단).
  const columns = useMemo(
    () =>
      buildColumns(box, {
        onTrash: trashMutation.mutate,
        onRestore: restoreMutation.mutate,
        onDelete: deleteMutation.mutate,
        onSendDraft: (messageId) =>
          sendDraftMutation.mutate(messageId, {
            onError: (error) => handleApiError(error, { toast }),
          }),
        onDeleteDraft: (messageId) =>
          deleteDraftMutation.mutate(
            { messageId },
            { onError: (error) => handleApiError(error, { toast }) },
          ),
      }),
    [
      box,
      trashMutation.mutate,
      restoreMutation.mutate,
      deleteMutation.mutate,
      sendDraftMutation.mutate,
      deleteDraftMutation.mutate,
    ],
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

  const isPlaceholder = listQuery.isPlaceholderData

  function handleReadFilterChange(next: ReadFilter) {
    if (next === readFilter) {
      return
    }
    setReadFilter(next)
    // 필터가 바뀌면 결과 집합이 달라지므로 페이지를 처음으로 되돌린다(검색어 확정 시와 동일 규칙).
    resetPage()
  }

  // 행 활성화(클릭/Enter) 분기: 임시보관함은 편집 모드 작성 뷰, 그 외 박스는 상세 뷰로 연다.
  function handleRowActivate(row: MessagesResponse) {
    // placeholder(이전 박스/페이지 데이터) 표시 중에는 잘못된 대상으로 이동하지 않도록 무시한다.
    if (isPlaceholder) {
      return
    }
    if (box === 'drafts') {
      onOpenCompose(row.messageId, true)
    } else {
      onOpenDetail(row.messageId)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* 도구줄: 검색 입력(좌) + 받은함 전용 읽음 필터(우). 검색 라벨의 "제목/내용/발신자"는
          안내용이고 서버는 단일 keyword로 위임한다(PRD F1501). */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor={searchInputId} className="sr-only">
            쪽지 검색
          </label>
          <Input
            id={searchInputId}
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="제목/내용/발신자 검색"
            className="pl-8"
          />
        </div>
        {box === 'received' && (
          <div className="flex items-center gap-1" role="group" aria-label="읽음 상태 필터">
            {READ_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                // 활성 표시는 페이지네이션 현재 페이지 버튼과 동일한 채움(default) 언어로 맞춘다.
                variant={filter.value === readFilter ? 'default' : 'ghost'}
                aria-pressed={filter.value === readFilter}
                onClick={() => handleReadFilterChange(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* 표 영역: flex-1로 남는 높이를 채워 페이지네이션을 카드 하단에 고정한다.
          isPlaceholderData(박스 전환·검색·페이지 변경 중 이전 데이터 유지) 동안에는
          목록을 흐리게 하고 클릭을 차단해 "이전 데이터"임을 드러낸다. */}
      <div
        aria-busy={isPlaceholder || undefined}
        className={cn(
          'flex-1 transition-opacity',
          isPlaceholder && 'pointer-events-none opacity-50',
        )}
      >
        {listQuery.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : listQuery.error ? (
          // 실패는 위 useEffect가 토스트로 알렸으므로 화면은 빈 상태 문구만 표시한다.
          <p className="py-8 text-center text-sm text-muted-foreground">
            목록을 불러오지 못했습니다.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{EMPTY_MESSAGES[box]}</p>
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
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowActivate(row.original)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleRowActivate(row.original)
                      }
                    }}
                    className={cn(
                      'cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none',
                      // 받은함 미읽음 쪽지는 행 전체를 옅게 강조해 스캔성을 높인다(레퍼런스 메일함의
                      // 미읽음 행 배경 강조 톤 — 굵은 제목·읽음 배지와 함께 세 번째 보조 신호).
                      box === 'received' &&
                        row.original.isRead === false &&
                        'bg-primary/[0.04]',
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
