import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { Search } from 'lucide-react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'
import { useManagementReservationsQuery } from '../api/useManagementReservationsQuery'
import { MeetingReservationDetailPanel } from '../components/MeetingReservationDetailPanel'
import { CapacityLabel, CountPill, InitialAvatar, StatusPill } from '../components/meetingUiKit'
import type { MeetingManagementItem } from '../model/meeting'

/** 검색/회의실ID 입력 디바운스 지연(ms). BoardListPage/DeptLeavePage와 동일 값을 재사용한다. */
const SEARCH_DEBOUNCE_MS = 300

const columnHelper = createColumnHelper<MeetingManagementItem>()

/**
 * P5 회의 예약 관리 페이지(F810, ROADMAP(MEETING-ROOMS) T5.2).
 *
 * T5.1(useManagementReservationsQuery)로 전사 회의 예약 목록을 조회한다. FACILITY 이상 권한
 * 전용 화면이지만, 별도 role 분기 없이 M4에서 이미 구현된 게이팅(canManageReservation이
 * reserverId 불일치 시 액션 영역을 자연히 숨김)에 기대어 P3 상세로는 조회 전용으로만 진입한다.
 *
 * 필터 3종:
 * - yearMonth: `type="month"` 네이티브 입력이라 키 입력 단위로 값이 바뀌지 않으므로(선택 즉시
 *   확정) 디바운스 없이 바로 반영한다(DeptLeavePage 동일 패턴). 기본값은 당월.
 * - keyword: 로컬 입력값을 300ms 디바운스한 뒤에만 확정 반영한다(BoardListPage/DeptLeavePage 동일).
 * - meetingRoomId: 예약 가능 회의실 검색(getAvailableMeetingRooms)은 date/startAt/endAt/capacity가
 *   전부 필수라 이 화면의 "회의실 선택 필터" 옵션 소스로 재사용할 수 없고, 회의실 관리 목록
 *   (T6.1)은 아직 이 태스크 시점에 존재하지 않는다 — 태스크 가이드가 명시한 폴백대로 단순
 *   숫자 입력으로 최소 구현한다. `type="number"` 역시 키 입력마다 값이 바뀌므로 keyword와
 *   동일하게 300ms 디바운스한다(DeptLeavePage의 year 필터 디바운스와 동일 이유).
 *
 * 세 필터 모두 변경 시 resetPage()로 페이지를 0으로 되돌린다. 행 클릭 시 P3 상세
 * (`/meetings/:meetingId`, T4.3-c)로 라우트 문자열 내비게이션만 수행한다(코드 결합 없음,
 * M3 T3.3-a·M2 T2.4-b와 동형).
 *
 * 라우팅은 아직 미배선(M8)이므로 직접 URL(`/meetings/management`)로만 검증한다.
 */
export function MeetingReservationManagementPage() {
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))

  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')

  const [meetingRoomIdInput, setMeetingRoomIdInput] = useState('')
  const [meetingRoomId, setMeetingRoomId] = useState<number | undefined>(undefined)

  // 행 선택 시 상세 "페이지"로 이동하지 않고, 표 아래 인라인 상세 패널로 표시한다(P3 페이지 대체).
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | undefined>(undefined)

  const { page, size, onPageChange, resetPage } = usePageState()

  // 검색어 디바운스: 300ms 유예 후에만 확정 keyword로 반영 + page 리셋.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, keyword])

  // 회의실 ID 입력 디바운스: 숫자 입력도 keyword와 동일하게 키 입력마다 재요청되는 것을 막는다.
  useEffect(() => {
    const trimmed = meetingRoomIdInput.trim()
    const parsed = trimmed === '' ? undefined : Number(trimmed)
    const nextValue = parsed !== undefined && Number.isNaN(parsed) ? meetingRoomId : parsed
    if (nextValue === meetingRoomId) {
      return
    }
    const timer = setTimeout(() => {
      setMeetingRoomId(nextValue)
      resetPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingRoomIdInput, meetingRoomId])

  function handleYearMonthChange(value: string) {
    setYearMonth(value)
    resetPage()
  }

  const managementQuery = useManagementReservationsQuery({
    yearMonth,
    keyword: keyword || undefined,
    meetingRoomId,
    page,
    size,
  })

  useEffect(() => {
    if (!managementQuery.error) {
      return
    }
    handleApiError(managementQuery.error, { toast })
  }, [managementQuery.error])

  const rows = managementQuery.data?.content ?? []
  const pageInfo: PageMeta = managementQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('meetingRoomName', {
        header: '회의실',
        cell: (info) => <span className="font-semibold text-foreground">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'reserver',
        header: '예약자',
        cell: (info) => (
          <div className="flex items-center gap-2.5">
            <InitialAvatar name={info.row.original.reserverEmpName} />
            <div className="leading-tight">
              <p className="font-medium text-foreground">{info.row.original.reserverEmpName}</p>
              <p className="text-xs text-muted-foreground">{info.row.original.reserverDeptName}</p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('title', {
        header: '제목',
        cell: (info) => <span className="font-medium text-foreground">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'schedule',
        header: '일시',
        cell: (info) => {
          const item = info.row.original
          const start = dayjs(`${item.meetingDate}T${item.startAt}`).format('YYYY-MM-DD HH:mm')
          const end = dayjs(`${item.meetingDate}T${item.endAt}`).format('HH:mm')
          return (
            <span className="font-mono text-xs text-muted-foreground">
              {start} ~ {end}
            </span>
          )
        },
      }),
      columnHelper.accessor('participantCount', {
        header: '참여자',
        cell: (info) => (
          <div className="flex justify-center">
            <CapacityLabel value={info.getValue()} />
          </div>
        ),
      }),
      columnHelper.accessor('isCanceled', {
        header: '상태',
        cell: (info) => (
          <StatusPill tone={info.getValue() ? 'slate' : 'indigo'}>
            {info.getValue() ? '취소됨' : '예약중'}
          </StatusPill>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const alignByColumn: Record<string, string> = {
    participantCount: 'text-center',
    isCanceled: 'text-right',
  }
  const monthLabel = yearMonth ? `${dayjs(yearMonth).format('YYYY년 M월')} · ` : ''

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">회의 예약 관리</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          전사 회의 예약 내역을 조회하고 관리합니다 (FACILITY)
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2.5">
            <CardTitle>예약 목록</CardTitle>
            <CountPill>
              {monthLabel}
              {pageInfo.totalElements}건
            </CountPill>
          </div>
          {/* 필터 툴바: 조회 월 + 제목/예약자 검색 + 회의실 ID */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label htmlFor="meeting-management-month" className="sr-only">
              조회 월
            </label>
            <Input
              id="meeting-management-month"
              type="month"
              value={yearMonth}
              onChange={(event) => handleYearMonthChange(event.target.value)}
              className="h-9 w-auto"
            />
            <div className="relative w-full sm:w-56">
              <label htmlFor="meeting-management-keyword" className="sr-only">
                제목/예약자 검색
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="meeting-management-keyword"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="제목 · 예약자 검색"
                className="h-9 pl-9"
              />
            </div>
            <label htmlFor="meeting-management-room-id" className="sr-only">
              회의실 ID
            </label>
            <Input
              id="meeting-management-room-id"
              type="number"
              min={1}
              value={meetingRoomIdInput}
              onChange={(event) => setMeetingRoomIdInput(event.target.value)}
              placeholder="회의실 ID"
              className="h-9 w-full sm:w-32"
            />
          </div>
        </CardHeader>
        <CardContent>
          {managementQuery.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : managementQuery.error ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              예약 목록을 불러오지 못했습니다.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              조회 조건에 해당하는 예약이 없습니다.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-border">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={cn(
                            'px-3 py-2.5 text-left text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground',
                            alignByColumn[header.column.id],
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
                      onClick={() => setSelectedMeetingId(row.original.meetingId)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          setSelectedMeetingId(row.original.meetingId)
                        }
                      }}
                      className={cn(
                        'cursor-pointer border-b border-border transition-colors last:border-0',
                        'hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={cn(
                            'px-3 py-3.5 align-middle whitespace-nowrap text-muted-foreground',
                            alignByColumn[cell.column.id],
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

          <PaginationControls
            className="mt-2 border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="건"
          />
        </CardContent>
      </Card>

      <MeetingReservationDetailPanel meetingId={selectedMeetingId} />
    </div>
  )
}
