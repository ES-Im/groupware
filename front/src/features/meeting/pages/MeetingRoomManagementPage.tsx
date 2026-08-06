import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'
import { useMeetingRoomManagementListQuery } from '../api/useMeetingRoomManagementListQuery'
import { MeetingRoomActiveToggleButton } from '../components/MeetingRoomActiveToggleButton'
import { MeetingRoomCreateDialog } from '../components/MeetingRoomCreateDialog'
import { CapacityLabel, CountPill, StatusPill } from '../components/meetingUiKit'
import type { MeetingRoomManagementItem } from '../model/meeting'

type AvailableFilter = 'all' | 'available' | 'unavailable'

type BookedInFutureFilter = 'all' | 'booked' | 'notBooked'

const columnHelper = createColumnHelper<MeetingRoomManagementItem>()

export function MeetingRoomManagementPage() {
  const navigate = useNavigate()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [availableFilter, setAvailableFilter] = useState<AvailableFilter>('all')
  const [bookedInFutureFilter, setBookedInFutureFilter] = useState<BookedInFutureFilter>('all')

  const { page, size, onPageChange, resetPage } = usePageState()

  function handleAvailableFilterChange(value: AvailableFilter) {
    setAvailableFilter(value)
    resetPage()
  }

  function handleBookedInFutureFilterChange(value: BookedInFutureFilter) {
    setBookedInFutureFilter(value)
    resetPage()
  }

  const available = availableFilter === 'all' ? undefined : availableFilter === 'available'
  const bookedInFuture =
    bookedInFutureFilter === 'all' ? undefined : bookedInFutureFilter === 'booked'

  const roomManagementQuery = useMeetingRoomManagementListQuery({
    available,
    bookedInFuture,
    page,
    size,
  })

  useEffect(() => {
    if (!roomManagementQuery.error) {
      return
    }
    handleApiError(roomManagementQuery.error, { toast })
  }, [roomManagementQuery.error])

  const rows = roomManagementQuery.data?.content ?? []
  const pageInfo: PageMeta = roomManagementQuery.data ?? {
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
      columnHelper.accessor('name', {
        header: '이름',
        cell: (info) => (
          <span className="font-semibold text-foreground underline-offset-4 group-hover/row:underline">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('capacity', {
        header: '수용인원',
        cell: (info) => <CapacityLabel value={info.getValue()} />,
      }),
      columnHelper.accessor('isAvailable', {
        header: '활성여부',
        cell: (info) => (
          <StatusPill tone={info.getValue() ? 'green' : 'slate'}>
            {info.getValue() ? '활성' : '비활성'}
          </StatusPill>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '관리',
        cell: ({ row }) => (
          <MeetingRoomActiveToggleButton
            meetingRoomId={row.original.meetingRoomId}
            isAvailable={row.original.isAvailable}
            variant="switch"
          />
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

  const selectClassName =
    'h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-muted-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

  return (
    <div className="flex w-full flex-col p-4 sm:p-6 lg:h-full lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">회의실 관리</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            회의실 등록·수용 인원·활성 상태를 관리합니다 (FACILITY)
          </p>
        </div>
        <Button type="button" onClick={() => setCreateDialogOpen(true)}>
          <Plus />
          회의실 등록
        </Button>
      </div>

      <Card className="flex flex-col lg:min-h-0 lg:flex-1">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2.5">
            <CardTitle>회의실 목록</CardTitle>
            <CountPill>총 {pageInfo.totalElements}개</CountPill>
          </div>
          <CardAction className="flex flex-wrap gap-2">
            <label htmlFor="meeting-room-management-available" className="sr-only">
              활성상태 필터
            </label>
            <select
              id="meeting-room-management-available"
              value={availableFilter}
              onChange={(event) => handleAvailableFilterChange(event.target.value as AvailableFilter)}
              className={selectClassName}
            >
              <option value="all">활성상태 전체</option>
              <option value="available">활성</option>
              <option value="unavailable">비활성</option>
            </select>
            <label htmlFor="meeting-room-management-booked" className="sr-only">
              향후예약 필터
            </label>
            <select
              id="meeting-room-management-booked"
              value={bookedInFutureFilter}
              onChange={(event) =>
                handleBookedInFutureFilterChange(event.target.value as BookedInFutureFilter)
              }
              className={selectClassName}
            >
              <option value="all">향후예약 전체</option>
              <option value="booked">향후예약 있음</option>
              <option value="notBooked">향후예약 없음</option>
            </select>
          </CardAction>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex min-h-[20rem] flex-col overflow-y-auto lg:min-h-0 lg:flex-1">
            {roomManagementQuery.isLoading ? (
              <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                불러오는 중...
              </p>
            ) : roomManagementQuery.error ? (
              <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                회의실 목록을 불러오지 못했습니다.
              </p>
            ) : rows.length === 0 ? (
              <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                조회 조건에 해당하는 회의실이 없습니다.
              </p>
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
                              'px-3 py-2.5 text-left text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground',
                              header.column.id === 'actions' && 'text-right',
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
                        onClick={() => navigate(`/meeting-rooms/management/${row.original.meetingRoomId}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            navigate(`/meeting-rooms/management/${row.original.meetingRoomId}`)
                          }
                        }}
                        className={cn(
                          'group/row cursor-pointer border-b border-border transition-colors last:border-0',
                          'hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none',
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={cn(
                              'px-3 py-3.5 align-middle whitespace-nowrap text-muted-foreground',
                              cell.column.id === 'actions' && 'text-right',
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
            className="shrink-0 border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="개"
          />
        </CardContent>
      </Card>

      <MeetingRoomCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
