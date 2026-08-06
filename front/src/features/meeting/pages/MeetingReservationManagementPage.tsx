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

const SEARCH_DEBOUNCE_MS = 300

const columnHelper = createColumnHelper<MeetingManagementItem>()

export function MeetingReservationManagementPage() {
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))

  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')

  const [meetingRoomIdInput, setMeetingRoomIdInput] = useState('')
  const [meetingRoomId, setMeetingRoomId] = useState<number | undefined>(undefined)

  const [selectedMeetingId, setSelectedMeetingId] = useState<number | undefined>(undefined)

  const { page, size, onPageChange, resetPage } = usePageState()

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
          <div className="flex min-h-[34rem] flex-col">
            {managementQuery.isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              </div>
            ) : managementQuery.error ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">예약 목록을 불러오지 못했습니다.</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">조회 조건에 해당하는 예약이 없습니다.</p>
              </div>
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
          </div>

          <PaginationControls
            className="mt-2 border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="건"
          />
        </CardContent>
      </Card>

      <MeetingReservationDetailPanel meetingId={selectedMeetingId} orientation="split" />
    </div>
  )
}
