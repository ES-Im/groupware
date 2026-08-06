import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import type { EventClickArg } from '@fullcalendar/core'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useDeptAttendanceMonthlyQuery } from '../api/useDeptAttendanceMonthlyQuery'
import { useDeptAttendancePendingQuery } from '../api/useDeptAttendancePendingQuery'
import { AttendanceCalendar } from '../components/AttendanceCalendar'
import { DeptAttendanceMemberList } from '../components/DeptAttendanceMemberList'
import { DeptAttendancePendingTable } from '../components/DeptAttendancePendingTable'
import { UpdateAttendanceDialog } from '../components/UpdateAttendanceDialog'
import { attendanceStatusBadgeMap } from '../lib/attendanceStatusBadge'
import { mapAttendanceToEvents } from '../lib/mapAttendanceToEvents'
import type { AttendanceStatus } from '../model/attendance'
import type { AttendanceEditTarget } from '../model/deptAttendance'
import { usePrimaryDeptId } from '../model/usePrimaryDeptId'

const SEARCH_DEBOUNCE_MS = 300

const STATUS_OPTIONS = Object.keys(attendanceStatusBadgeMap) as AttendanceStatus[]

export function DeptAttendancePage() {
  const deptId = usePrimaryDeptId()

  const [editTarget, setEditTarget] = useState<AttendanceEditTarget | null>(null)

  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [status, setStatus] = useState<AttendanceStatus | undefined>(undefined)
  const { page, size, onPageChange, resetPage } = usePageState()

  const [pendingStatus, setPendingStatus] = useState<AttendanceStatus | undefined>(undefined)
  const {
    page: pendingPage,
    size: pendingSize,
    onPageChange: onPendingPageChange,
    resetPage: resetPendingPage,
  } = usePageState()

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

  const monthlyQuery = useDeptAttendanceMonthlyQuery(deptId, {
    keyword: keyword || undefined,
    yearMonth,
    status,
    page,
    size,
  })

  useEffect(() => {
    if (!monthlyQuery.error) {
      return
    }
    handleApiError(monthlyQuery.error, { toast })
  }, [monthlyQuery.error])

  const monthlyRows = monthlyQuery.data?.content ?? []
  const selectedRow =
    selectedEmpId === null ? null : (monthlyRows.find((row) => row.empInfo.empId === selectedEmpId) ?? null)

  const calendarEvents = useMemo(
    () => (selectedRow ? mapAttendanceToEvents(selectedRow.attendanceInfo, selectedRow.empInfo.empId) : []),
    [selectedRow],
  )

  function handleCalendarEventClick(arg: EventClickArg) {
    const props = arg.event.extendedProps as {
      targetEmpId: number
      attendanceId: number
      startAt: string | null
      endAt: string | null
      isApproved: boolean
    }
    if (props.isApproved) {
      return
    }
    setEditTarget({
      targetEmpId: props.targetEmpId,
      attendanceId: props.attendanceId,
      startAt: props.startAt,
      endAt: props.endAt,
    })
  }

  const pendingQuery = useDeptAttendancePendingQuery(deptId, {
    status: pendingStatus,
    page: pendingPage,
    size: pendingSize,
  })

  useEffect(() => {
    if (!pendingQuery.error) {
      return
    }
    handleApiError(pendingQuery.error, { toast })
  }, [pendingQuery.error])

  function handleYearMonthChange(value: string) {
    setYearMonth(value)
    resetPage()
  }

  function handleStatusChange(value: string) {
    setStatus(value === '' ? undefined : (value as AttendanceStatus))
    resetPage()
  }

  function handlePendingStatusChange(nextStatus: AttendanceStatus | undefined) {
    setPendingStatus(nextStatus)
    resetPendingPage()
  }

  const pageInfo: PageMeta = monthlyQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const pendingPageInfo: PageMeta = pendingQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: pendingSize,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-[1.375rem] font-semibold tracking-tight">부서 근태 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          부서원 월별 근태와 승인 대기 건을 관리합니다.
        </p>
      </header>

      {deptId === undefined ? (
        <Card className="h-fit">
          <CardContent>
            <p className="py-8 text-center text-sm text-muted-foreground">
              부서 정보를 확인하는 중입니다...
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="monthly" className="gap-3">
          <TabsList>
            <TabsTrigger value="monthly">월별 근태</TabsTrigger>
            <TabsTrigger value="pending">승인 대기</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <div className="grid gap-4 lg:grid-cols-[minmax(280px,34%)_1fr]">
              <Card className="h-fit">
                <CardHeader className="border-b">
                  <CardTitle>부서원</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <div className="relative w-full">
                      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                      <label htmlFor="dept-attendance-keyword" className="sr-only">
                        부서원 이름 검색
                      </label>
                      <Input
                        id="dept-attendance-keyword"
                        type="search"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="부서원 이름 검색..."
                        className="pl-8"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor="dept-attendance-month" className="sr-only">
                        조회 월
                      </label>
                      <Input
                        id="dept-attendance-month"
                        type="month"
                        value={yearMonth}
                        onChange={(event) => handleYearMonthChange(event.target.value)}
                        className="w-auto"
                      />
                      <label htmlFor="dept-attendance-status-select" className="sr-only">
                        근태 상태 필터
                      </label>
                      <select
                        id="dept-attendance-status-select"
                        value={status ?? ''}
                        onChange={(event) => handleStatusChange(event.target.value)}
                        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      >
                        <option value="">전체</option>
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {attendanceStatusBadgeMap[option].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex min-h-[36rem] flex-col">
                    {monthlyQuery.isLoading ? (
                      <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                        불러오는 중...
                      </p>
                    ) : monthlyQuery.error ? (
                      <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                        부서 근태 목록을 불러오지 못했습니다.
                      </p>
                    ) : (
                      <DeptAttendanceMemberList
                        data={monthlyRows}
                        selectedEmpId={selectedEmpId}
                        onSelect={setSelectedEmpId}
                      />
                    )}
                  </div>

                  <PaginationControls
                    className="border-t pt-4"
                    pageInfo={pageInfo}
                    page={page}
                    onPageChange={onPageChange}
                    unit="명"
                  />
                </CardContent>
              </Card>

              <Card className="h-[440px] lg:h-auto">
                <CardContent className="flex h-full min-h-0 flex-col">
                  {selectedRow ? (
                    <>
                      <header className="mb-3 shrink-0">
                        <h2 className="text-sm font-semibold text-foreground">
                          {selectedRow.empInfo.empName}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {selectedRow.empInfo.positionName} · {dayjs(yearMonth).format('YYYY년 M월')}
                        </p>
                      </header>
                      <div className="min-h-0 flex-1">
                        <AttendanceCalendar
                          key={yearMonth}
                          events={calendarEvents}
                          initialDate={`${yearMonth}-01`}
                          onEventClick={handleCalendarEventClick}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="max-w-xs text-center text-sm text-muted-foreground">
                        좌측 목록에서 부서원을 선택하면 해당 월 근태 캘린더가 표시됩니다.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <Card className="h-fit">
              <CardHeader className="border-b">
                <CardTitle>근태 승인 대기</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingQuery.isLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
                ) : pendingQuery.error ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    승인 대기 목록을 불러오지 못했습니다.
                  </p>
                ) : (
                  <DeptAttendancePendingTable
                    data={pendingQuery.data?.content ?? []}
                    totalElements={pendingQuery.data?.totalElements ?? 0}
                    onEdit={setEditTarget}
                    status={pendingStatus}
                    onStatusChange={handlePendingStatusChange}
                  />
                )}

                <PaginationControls
                  className="border-t pt-4"
                  pageInfo={pendingPageInfo}
                  page={pendingPage}
                  onPageChange={onPendingPageChange}
                  unit="건"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <UpdateAttendanceDialog
        open={editTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditTarget(null)
          }
        }}
        target={editTarget}
      />
    </div>
  )
}
