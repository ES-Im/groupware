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

/** 활성상태 필터 값. 'all'은 available 쿼리 파라미터 생략(전체)을 의미한다(DepartmentsPage 동일 패턴). */
type AvailableFilter = 'all' | 'available' | 'unavailable'

/** 향후예약 필터 값. 'all'은 bookedInFuture 쿼리 파라미터 생략(전체)을 의미한다. */
type BookedInFutureFilter = 'all' | 'booked' | 'notBooked'

const columnHelper = createColumnHelper<MeetingRoomManagementItem>()

/**
 * P6 회의실 관리 목록 페이지(F811+F812+F814, ROADMAP(MEETING-ROOMS) T6.3-a+T6.3-b 완성).
 *
 * T6.1(useMeetingRoomManagementListQuery)로 회의실 목록을 조회한다. available/bookedInFuture는
 * boolean이 false도 유효한 값이라 DepartmentsPage의 isActive 필터와 동일하게 tri-state
 * ('all'/특정값) select로 구성해 "생략"과 "false"를 구분한다. 두 필터 모두 선택 즉시 반영되며
 * (boolean은 디바운스 불필요), 값이 바뀌면 resetPage()로 페이지를 0으로 되돌린다.
 *
 * 행 클릭 시 P7 상세(`/meeting-rooms/management/:meetingRoomId`)로 라우트 문자열만
 * 내비게이션한다(코드 의존 없음, M2·M3·M5의 동일 패턴).
 *
 * `[회의실 등록]`(T6.2 F812, MeetingRoomCreateDialog)은 헤더에 트리거 버튼을 두고, 성공 시
 * 생성된 회의실의 P7으로 자동 이동한다. 마지막 "관리" 컬럼은 행별 활성/비활성 토글
 * (T6.2 F814, MeetingRoomActiveToggleButton)을 담당하며, 내부에서 stopPropagation으로 행
 * 내비게이션과의 중복 트리거를 막는다.
 */
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
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

      <Card>
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
        <CardContent>
          {roomManagementQuery.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : roomManagementQuery.error ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              회의실 목록을 불러오지 못했습니다.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
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

          <PaginationControls
            className="mt-2 border-t pt-4"
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
