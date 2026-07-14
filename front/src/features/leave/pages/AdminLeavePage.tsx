import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Search, Users } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { useDepartmentsQuery } from '@/features/department/api/useDepartmentsQuery'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useEmpLeaveSummaryQuery } from '../api/useEmpLeaveSummaryQuery'
import { useEmpLeaveUsageSummaryQuery } from '../api/useEmpLeaveUsageSummaryQuery'
import { AdjustGrantDaysDialog } from '../components/AdjustGrantDaysDialog'
import { EmpLeaveSummaryTable } from '../components/EmpLeaveSummaryTable'
import type { AdjustGrantDaysTarget } from '../model/leave'

/** 검색 디바운스 지연(ms). EmployeePicker/DeptAttendancePage와 동일 값. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * 관리자 휴가 관리 페이지(F747·F748·F749·F750, ROADMAP(LEAVE) M5 T5.3, ADMIN 전용).
 *
 * 목표 디자인(admin-page_1.html · A안 톤)에 맞춰 전사(또는 선택 부서) 연차 사용률 도넛(Recharts)과
 * 대상 사원 수 지표, 사원 휴가 요약 표로 재구성했다. 본부별 사용률 막대·연차 부여/사용 합계 KPI·
 * 특별/포상 전사 집계는 백엔드 집계 API가 없어 제외했다(팀 결정: 실데이터만 재구성).
 *
 * 연차 사용률 카드(useEmpLeaveUsageSummaryQuery, T5.1)는 deptId 미지정 시 회사 전체, 지정 시
 * 해당 부서 기준으로 단일 값(annualLeaveUsagePercent)을 보여준다. deptId 후보 목록은 신규 조회를
 * 만들지 않고 기존 `useDepartmentsQuery`(department 도메인, EmployeePicker가 이미 쓰는 DEPTS
 * 조회)를 그대로 재사용한다(ROADMAP §신규 확인 "관리자 부서 필터 목록 출처").
 *
 * 전사 사원 휴가 요약 표(useEmpLeaveSummaryQuery, T5.1, Page<T> 표준 페이징)는 keyword·year(둘 다
 * 300ms 디바운스)·deptId 필터와 PaginationControls/usePageState로 연동한다(DeptAttendancePage와
 * 동일 톤). year도 keyword와 동일하게 디바운스하는 이유: type=number 자유 입력이라 즉시 확정하면
 * 중간 입력값("2026"→"202")마다 쿼리가 재요청되기 때문(code-reviewer 지적). 필터가 하나라도
 * 확정 반영되면 resetPage()로 페이지를 0으로 되돌린다.
 *
 * 부여일수 조정(AdjustGrantDaysDialog, T5.2 mutation 소비)은 요약 표 행의 [조정] 버튼이
 * `adjustTarget`(단일 상태)을 채우면 열린다 — 다이얼로그 인스턴스는 이 페이지 최하단에 하나만
 * 마운트한다(UpdateAttendanceDialog와 동일 패턴).
 */
export function AdminLeavePage() {
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [deptId, setDeptId] = useState<number | undefined>(undefined)
  const [yearInput, setYearInput] = useState(() => String(dayjs().year()))
  const [year, setYear] = useState(() => dayjs().year())
  const { page, size, onPageChange, resetPage } = usePageState()

  const [adjustTarget, setAdjustTarget] = useState<AdjustGrantDaysTarget | null>(null)

  // 검색 입력 디바운스(DeptAttendancePage와 동일 패턴): 300ms 유예 후에만 확정 keyword로 반영 + page 리셋.
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

  // 연도 입력 디바운스(code-reviewer 지적, keyword와 동일 패턴 재사용): type=number 자유 입력은
  // 키 입력마다("2026"→"202" 같은 중간값 포함) 즉시 확정하면 usage/summary 두 쿼리가 매번
  // 재요청되어 스퍼리어스 에러 토스트가 뜰 수 있다. 300ms 유예 후 유효한 숫자일 때만 확정
  // year로 반영 + page 리셋한다. 빈 문자열/숫자가 아닌 값은 커밋하지 않고 다음 유효 입력을 기다린다.
  useEffect(() => {
    const trimmed = yearInput.trim()
    if (trimmed === '' || trimmed === String(year)) {
      return
    }
    const parsed = Number(trimmed)
    if (Number.isNaN(parsed)) {
      return
    }
    const timer = setTimeout(() => {
      setYear(parsed)
      resetPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearInput, year])

  const deptsQuery = useDepartmentsQuery({ isActive: true, size: 100 })
  const depts = deptsQuery.data?.content ?? []

  const usageQuery = useEmpLeaveUsageSummaryQuery({ deptId, year })
  const summaryQuery = useEmpLeaveSummaryQuery({ keyword: keyword || undefined, deptId, year, page, size })

  useEffect(() => {
    if (!usageQuery.error) {
      return
    }
    handleApiError(usageQuery.error, { toast })
  }, [usageQuery.error])

  useEffect(() => {
    if (!summaryQuery.error) {
      return
    }
    handleApiError(summaryQuery.error, { toast })
  }, [summaryQuery.error])

  function handleDeptChange(value: string) {
    setDeptId(value === '' ? undefined : Number(value))
    resetPage()
  }

  const rows = summaryQuery.data?.content ?? []
  const pageInfo: PageMeta = summaryQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const deptLabel =
    deptId === undefined
      ? '회사 전체'
      : depts.find((d) => d.deptInfoResponse.deptId === deptId)?.deptInfoResponse.deptName ?? '선택 부서'
  const totalEmployees = summaryQuery.data?.totalElements ?? 0

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">휴가 관리</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            전사 휴가 사용 현황과 사원별 부여·사용을 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="admin-leave-usage-year" className="text-sm text-muted-foreground">
            조회 연도
          </label>
          <Input
            id="admin-leave-usage-year"
            type="number"
            value={yearInput}
            onChange={(event) => setYearInput(event.target.value)}
            className="w-24"
          />
        </div>
      </header>

      {/* 연차 사용률 개요: 도넛 + 사용률·대상 사원 지표 */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>연차 사용률</CardTitle>
          <CardDescription>{deptLabel} 기준 기본 연차 사용률입니다.</CardDescription>
          <CardAction>
            <label htmlFor="admin-leave-usage-dept" className="sr-only">
              부서 선택
            </label>
            <select
              id="admin-leave-usage-dept"
              value={deptId ?? ''}
              onChange={(event) => handleDeptChange(event.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">회사 전체</option>
              {depts.map((dept) => (
                <option key={dept.deptInfoResponse.deptId} value={dept.deptInfoResponse.deptId}>
                  {dept.deptInfoResponse.deptName}
                </option>
              ))}
            </select>
          </CardAction>
        </CardHeader>
        <CardContent>
          {usageQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : usageQuery.data === undefined ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              연차 사용률 정보를 불러오지 못했습니다.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
              <UsageDonut percent={usageQuery.data.annualLeaveUsagePercent} />
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums text-primary">
                    {usageQuery.data.annualLeaveUsagePercent}%
                  </span>
                  <span className="text-sm text-muted-foreground">연차 사용률</span>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-4" aria-hidden />
                  {deptLabel} 대상 사원{' '}
                  <span className="font-semibold text-foreground tabular-nums">{totalEmployees}명</span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 사원 휴가 요약: 검색 + 표 + 페이지네이션 */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>사원 휴가 요약</CardTitle>
          <CardDescription>
            사원별 연차·특별·포상 휴가 부여·사용 현황을 조회하고 부여일수를 조정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="admin-leave-keyword" className="sr-only">
                사원 이름 검색
              </label>
              <Input
                id="admin-leave-keyword"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="사원 이름 검색..."
                className="pl-8"
              />
            </div>
          </div>

          {summaryQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : summaryQuery.error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              사원 휴가 요약을 불러오지 못했습니다.
            </p>
          ) : (
            <EmpLeaveSummaryTable data={rows} onAdjust={setAdjustTarget} />
          )}

          <PaginationControls
            className="border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="명"
          />
        </CardContent>
      </Card>

      <AdjustGrantDaysDialog
        open={adjustTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setAdjustTarget(null)
          }
        }}
        target={adjustTarget}
      />
    </div>
  )
}

/**
 * 연차 사용률 도넛(Recharts PieChart). 사용분(primary)/잔여(muted) 2조각 링에 중앙 정수 %를 겹쳐
 * 표시한다. 색은 FranchiseSalesOverview와 동일하게 테마 적응형 CSS 변수(var(--primary)/var(--muted))만
 * 쓴다. 값은 0~100으로 클램프해 음수/초과 입력에도 링이 깨지지 않게 한다.
 */
function UsageDonut({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const data = [
    { name: 'used', value: clamped },
    { name: 'rest', value: 100 - clamped },
  ]
  return (
    <div className="relative size-32 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill="var(--primary)" />
            <Cell fill="var(--muted)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{Math.round(clamped)}%</span>
      </div>
    </div>
  )
}
