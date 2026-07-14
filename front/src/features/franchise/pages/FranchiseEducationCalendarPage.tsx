import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { BookOpen, Search } from 'lucide-react'
import { handleApiError } from '@/shared/lib/apiError'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'
import { useFranchiseEducationCalendarQuery } from '../api/useFranchiseEducationCalendarQuery'
import { FranchiseEducationCreateDialog } from '../components/FranchiseEducationCreateDialog'
import { FranchisePageHeader } from '../components/FranchisePageHeader'
import { FranchiseStatusPill } from '../components/FranchiseStatusPill'
import type { FranchiseEducationCalendarItem } from '../model/franchise'

/** 상태 필터 값. 'all'은 전체(파생 상태와 무관). */
type EducationStatusFilter = 'all' | '접수중' | '정원 마감' | '비활성' | '종료'

/** 파생 상태 pill 변형. FranchiseStatusPill 변형만 사용(코드 발명 없음). */
type PillVariant = 'default' | 'secondary' | 'outline' | 'destructive'

/**
 * 교육 목록 항목의 파생 상태. 교육 목록(FRANCHISE_EDUCATION_CALENDAR)은 유형·신청/정원 필드가 없어
 * (계약 실측), 보유 필드(isActive/isFull/date)만으로 상태를 도출한다: 비활성 → 종료(과거) → 정원
 * 마감 → 접수중 우선순위. 하드코딩 없이 데이터에서 파생한다.
 */
function deriveEducationStatus(item: FranchiseEducationCalendarItem): {
  label: EducationStatusFilter
  variant: PillVariant
} {
  if (!item.isActive) {
    return { label: '비활성', variant: 'outline' }
  }
  if (dayjs(item.date).isBefore(dayjs(), 'day')) {
    return { label: '종료', variant: 'secondary' }
  }
  if (item.isFull) {
    return { label: '정원 마감', variant: 'destructive' }
  }
  return { label: '접수중', variant: 'default' }
}

const STATUS_OPTIONS: EducationStatusFilter[] = ['접수중', '정원 마감', '비활성', '종료']

/**
 * P4 가맹점 교육 관리 페이지(F1609, ROADMAP(FRANCHISE) T4.1).
 * /franchise-educations 라우트에 마운트된다(export명은 라우터/테스트 참조 유지를 위해 종전대로 두되,
 * UI 개편(2026-07-13, 목업 기준)으로 FullCalendar를 걷어내고 **교육 목록 테이블**로 재구성했다).
 *
 * 교육 목록 데이터원은 여전히 범위 기반 교육 캘린더 조회(FRANCHISE_EDUCATION_CALENDAR — 페이지네이션
 * 목록 엔드포인트가 없다)다. 월 선택(기본 당월)으로 조회 범위를 바꾸고, 상태·검색은 배열에 대한
 * 클라이언트 필터로 처리한다(서버 필터 파라미터 부재). 상태 컬럼은 보유 필드에서 파생하며, 목업의
 * 유형·신청/정원 컬럼은 계약에 데이터가 없어 제거했다(정책 A). 행 클릭 → P5 상세, `[교육 등록]` →
 * 등록 모달(FranchiseEducationCreateDialog) — 사용자 요청으로 전용 페이지(/franchise-educations/new)
 * 대신 모달로 띄운다. 모달은 "등록 시 비활성 상태로 생성됨"을 안내하고, 등록 성공 시 상세로 이동한다.
 */
export function FranchiseEducationCalendarPage() {
  const navigate = useNavigate()

  const [month, setMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [statusFilter, setStatusFilter] = useState<EducationStatusFilter>('all')
  const [keyword, setKeyword] = useState('')
  // 교육 등록 모달 열림 상태. [교육 등록] 버튼으로 열고, 등록 성공/취소 시 닫는다.
  const [createOpen, setCreateOpen] = useState(false)

  // 월 선택으로 캘린더 조회 범위를 만든다(start 포함·end 미포함, yyyy-MM-dd'T'HH:mm:ss). 월 입력이
  // 비면 범위를 생략해 서버 당월 기본값에 위임한다.
  const hasMonth = /^\d{4}-\d{2}$/.test(month)
  const start = hasMonth ? `${month}-01T00:00:00` : undefined
  const end = hasMonth
    ? `${dayjs(`${month}-01`).add(1, 'month').format('YYYY-MM-DD')}T00:00:00`
    : undefined

  const { data, isLoading, error } = useFranchiseEducationCalendarQuery(start, end)

  useEffect(() => {
    if (!error) {
      return
    }
    handleApiError(error, { toast })
  }, [error])

  const items = data ?? []

  // 클라이언트 필터: 상태(파생) + 검색(교육명 contains).
  const filtered = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase()
    return items.filter((item) => {
      const status = deriveEducationStatus(item).label
      if (statusFilter !== 'all' && status !== statusFilter) {
        return false
      }
      if (trimmed && !item.title.toLowerCase().includes(trimmed)) {
        return false
      }
      return true
    })
  }, [items, statusFilter, keyword])

  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6 lg:p-8 lg:min-h-full">
      <FranchisePageHeader
        title="가맹점 교육"
        description="가맹점 대상 교육을 등록하고 신청 현황을 관리합니다."
      >
        <Button type="button" onClick={() => setCreateOpen(true)}>
          교육 등록
        </Button>
      </FranchisePageHeader>

      {/* 교육 등록 모달: 등록 성공 시 모달을 닫고 생성된 교육 상세로 이동한다(mutation이 캘린더
          캐시를 invalidate하므로 목록도 갱신된다). */}
      <FranchiseEducationCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(educationId) => {
          setCreateOpen(false)
          navigate(`/franchise-educations/${educationId}`)
        }}
      />

      <Card className="lg:flex-1">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4 text-primary" aria-hidden />
              교육 목록
            </CardTitle>
            {data && (
              <Badge variant="secondary" className="tabular-nums">
                {filtered.length}건
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 툴바: 월 선택 + 상태 + 검색. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div>
              <label htmlFor="franchise-education-month" className="sr-only">
                조회 월
              </label>
              <Input
                id="franchise-education-month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                aria-label="조회 월"
                className="h-9 w-44"
              />
            </div>
            <div>
              <label htmlFor="franchise-education-status" className="sr-only">
                상태 필터
              </label>
              <select
                id="franchise-education-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as EducationStatusFilter)}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="all">전체 상태</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="교육명 검색"
                aria-label="교육명 검색"
                className="h-9 w-full pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              교육 목록을 불러오지 못했습니다.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              조회 조건에 해당하는 교육이 없습니다.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      교육명
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      교육일
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      장소
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap text-muted-foreground">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const status = deriveEducationStatus(item)
                    return (
                      <tr
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/franchise-educations/${item.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            navigate(`/franchise-educations/${item.id}`)
                          }
                        }}
                        className={cn(
                          'cursor-pointer border-b border-border transition-colors last:border-0',
                          'hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none',
                        )}
                      >
                        <td className="px-3 py-3 align-middle">
                          <div className="flex items-center gap-3">
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
                              <BookOpen aria-hidden />
                            </span>
                            <span className="font-medium text-foreground">{item.title}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground tabular-nums">
                          {item.date}
                        </td>
                        <td className="px-3 py-3 align-middle text-muted-foreground">{item.place}</td>
                        <td className="px-3 py-3 text-right align-middle whitespace-nowrap">
                          <FranchiseStatusPill variant={status.variant}>
                            {status.label}
                          </FranchiseStatusPill>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
