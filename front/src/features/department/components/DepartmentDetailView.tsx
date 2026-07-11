import { useEffect, useState } from 'react'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import {
  Building2,
  IdCard,
  Mail,
  Network,
  Pencil,
  Phone,
  Power,
  PowerOff,
  Search,
  Settings2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import type { DeptInfoResponse, DeptLeader } from '../model/deptInfo'
import type { DeptMemberResponse, Page } from '../model/deptMember'
import { DeptAttendanceBoardWidget } from './DeptAttendanceBoardWidget'
import { DepartmentMembersTable } from './DepartmentMembersTable'

/** 검색 디바운스 지연(ms). 매 키 입력마다 부모 상태(page/query)를 갱신하지 않도록 유예를 둔다. */
const SEARCH_DEBOUNCE_MS = 300

/** 페이지 크기 선택 옵션(레퍼런스와 동일: 5/10/15/20). */
const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const

interface DepartmentDetailViewProps {
  /** 부서 기본 정보. 데이터 페칭은 상위 페이지 컨테이너(react-router-developer 담당)가 수행해 주입한다. */
  deptInfo: DeptInfoResponse
  /** 부서장 정보. 지정되지 않은 부서면 null → 플레이스홀더 문구만 렌더한다. */
  deptLeader: DeptLeader | null
  /** 현재 페이지의 부서 멤버 목록(content). */
  members: DeptMemberResponse[]
  /** 멤버 조회 실패 시 표 영역에만 인라인으로 표시할 에러 문구. 있으면 좌측 카드는 그대로 두고 표만 대체한다. */
  membersErrorMessage?: string
  /** 서버 페이지 메타(totalElements/totalPages/number/size/first/last 사용). */
  pageInfo: Page<unknown>
  /** dept-manager/admin 전용 "관리" 액션 컬럼 노출 여부(표에 위임). role 계산은 상위에서 수행. */
  canManageMembers?: boolean
  /**
   * 부서 근태 보드(DeptAttendanceBoardWidget) 노출 여부. role 계산은 상위에서 수행.
   * `canManageMembers`(DEPT_MANAGER 또는 HR)와 별도 값이다 — 근태 조회 API(`DEPT_ATTENDANCE_MONTHLY`/
   * `_PENDING`)는 DEPT_MANAGER 권한만 허용하므로(HR은 불가) `hasRequiredRole(roles,'DEPT_MANAGER')`
   * 단독으로 계산해 주입해야 한다. 이 값 없이(기본 false) 위젯을 무조건 렌더하면 권한 없는
   * 뷰어(일반 사원·HR 전용 담당자)에게 403이 조용히 삼켜져 "근태 기록이 없습니다"로 오인 표시된다
   * (code-reviewer 지적, 수정).
   */
  canViewAttendanceBoard?: boolean
  /**
   * ADMIN 전용 "부서 관리" 섹션 노출 여부. role 계산은 상위에서 수행.
   * true로 주는 페이지는 아래 5개 관리 콜백을 반드시 함께 전달해야 한다(현재는 임의 부서를 다루는
   * DepartmentDetailPage, T7.1만 해당). 본인 소속 바로가기(DepartmentMembersPage, F104)처럼
   * 관리 액션을 노출하지 않을 페이지는 이 prop 자체를 생략(또는 false)하면 되고, 그 경우 아래 5개
   * 콜백도 함께 생략할 수 있다 — 섹션 전체가 canManageDept로 게이팅되어 있어 안전하다.
   */
  canManageDept?: boolean
  /** 활성화/비활성화 토글 콜백(F205). 현재 deptInfo.isActive 값에 따라 상위가 activate/deactivate를 분기 호출한다. */
  onToggleActive?: () => void
  /** 활성화/비활성화 mutation 진행 중 여부. 토글 버튼을 disabled 처리하는 데만 사용한다. */
  isTogglingActive?: boolean
  /** 부서명 변경 다이얼로그(F206)를 여는 콜백. 다이얼로그 자체는 상위(컨테이너)가 렌더한다. */
  onOpenRenameDialog?: () => void
  /** 상위 부서 변경 다이얼로그(F207)를 여는 콜백. 다이얼로그 자체는 상위(컨테이너)가 렌더한다. */
  onOpenUpdateParentDialog?: () => void
  /** 부서장 지정 다이얼로그(F208)를 여는 콜백. 다이얼로그 자체는 상위(컨테이너)가 렌더한다. */
  onOpenAppointLeaderDialog?: () => void
  /**
   * 부서장 종료 다이얼로그(F209)를 여는 콜백. 부서장이 지정된 경우에만 종료할 대상이 있으므로,
   * deptLeader === null(공석)이면 이 콜백이 있어도 버튼 자체를 렌더하지 않는다.
   */
  onOpenEndLeaderDialog?: () => void
  /** 확정된 검색 키워드(디바운스 후 상위로 반영된 값). */
  keyword: string
  /** 디바운스된 검색어 변경 콜백. 검증/쿼리 배선은 상위(도메인 데이터 작업)가 담당. */
  onKeywordChange: (value: string) => void
  /** 현재 페이지(0-base). */
  page: number
  /** 페이지 이동 콜백. */
  onPageChange: (page: number) => void
  /** 현재 페이지 크기. */
  size: number
  /** 페이지 크기 변경 콜백. */
  onSizeChange: (size: number) => void
  /** 행 클릭 시 사원 상세로 이동시키는 콜백(네비게이션 로직은 상위가 주입). */
  onRowClick: (empId: number) => void
}

/** 좌측 카드의 아이콘+라벨+값 한 줄(부서 기본 정보·부서장 연락처). 값이 길면 truncate로 넘침을 막는다. */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <div className="truncate text-sm text-foreground">{value}</div>
      </div>
    </div>
  )
}

/** 작은 섹션 heading(좌측 카드용). 아이콘 + muted 소제목 — EmployeeInfoView 패턴 복제. */
function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  children: ReactNode
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </h3>
  )
}

/** 상태 알약 배지. tone으로 강조(primary)/보조(muted)를 구분 — 기존 '대표'/'겸직' 배지 톤 재사용. */
function Pill({ tone = 'primary', children }: { tone?: 'primary' | 'muted'; children: ReactNode }) {
  return (
    <span
      className={
        tone === 'primary'
          ? 'inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
          : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
      }
    >
      {children}
    </span>
  )
}

/**
 * 부서 상세 프레젠테이션 컴포넌트(F001 확장).
 * 좌측 부서 요약 카드(기본 정보 + 부서장 + ADMIN 전용 관리 액션) + 우측 검색/페이징 멤버 표의 2열 구조.
 *
 * 순수 뷰: 데이터/역할 계산은 전부 props로 받고, 로컬 UI 상호작용(검색 입력 디바운스)만 자체 처리한다.
 * 다크모드는 시맨틱 토큰이 자동 처리한다. 정렬 UI는 백엔드(DEPT_MEMBERS)가 정렬을 지원하지 않아 의도적으로 넣지 않는다.
 */
export function DepartmentDetailView({
  deptInfo,
  deptLeader,
  members,
  membersErrorMessage,
  pageInfo,
  canManageMembers = false,
  canViewAttendanceBoard = false,
  canManageDept = false,
  onToggleActive,
  isTogglingActive = false,
  onOpenRenameDialog,
  onOpenUpdateParentDialog,
  onOpenAppointLeaderDialog,
  onOpenEndLeaderDialog,
  keyword,
  onKeywordChange,
  page,
  onPageChange,
  size,
  onSizeChange,
  onRowClick,
}: DepartmentDetailViewProps) {
  // 검색 입력 원문값은 컴포넌트 로컬로 관리하고, 디바운스 후에만 상위 onKeywordChange로 반영한다.
  const [searchInput, setSearchInput] = useState(keyword)

  useEffect(() => {
    const trimmed = searchInput.trim()
    // 이미 반영된 값이면(마운트 직후·부모발 keyword 변경 포함) 중복 호출을 건너뛴다.
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => onKeywordChange(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword, onKeywordChange])

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* 좌측: 부서 요약 카드 */}
      <Card className="h-fit">
        <CardContent className="space-y-5">
          {/* 부서명 + 부서코드 + 활성/비활성 배지 */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight">{deptInfo.deptName}</h2>
              <p className="truncate text-sm text-muted-foreground">부서코드 {deptInfo.deptCode}</p>
            </div>
            <Pill tone={deptInfo.isActive ? 'primary' : 'muted'}>
              {deptInfo.isActive ? '활성' : '비활성'}
            </Pill>
          </div>

          {/* 부서 기본 정보 섹션 */}
          <div className="space-y-3 border-t pt-5">
            <SectionHeading icon={Building2}>부서 기본 정보</SectionHeading>
            <div className="space-y-2.5">
              <InfoRow icon={IdCard} label="부서 코드" value={deptInfo.deptCode} />
              <InfoRow icon={Building2} label="부서명" value={deptInfo.deptName} />
              <InfoRow
                icon={Network}
                label="상위 부서"
                // §4: 최상위 부서(parentDeptId=null)는 ID 대신 '최상위 부서' 문구로 표시한다.
                value={
                  deptInfo.parentDeptId === null
                    ? '최상위 부서'
                    : `상위 부서 ID: ${deptInfo.parentDeptId}`
                }
              />
            </div>
          </div>

          {/* 부서장 섹션 */}
          <div className="space-y-3 border-t pt-5">
            <SectionHeading icon={Users}>부서장</SectionHeading>
            {/*
              §3: 부서장 공석 판별(정규화 완료, T6.1). wire상 부서장 미지정 부서는 JSON null이
              아니라 전 필드 null 객체로 내려오지만(3.department-management-prd.md "부서장 공석
              wire 계약" 절), 데이터 계층(getDepartmentInfo → normalizeDeptLeader)에서 이미
              empName/empId 유무로 공석을 판별해 null로 정규화하므로, 이 뷰는 deptLeader===null
              여부만으로 안전하게 판별한다.
            */}
            {deptLeader === null ? (
              <p className="text-sm text-muted-foreground">부서장이 지정되지 않았습니다.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {/*
                    §7: 부서장 데이터에는 activeFiles가 없어 fileId를 항상 undefined로 넘긴다.
                    이니셜 폴백만 나오는 것은 버그가 아니라 의도된 동작이다.
                  */}
                  <BlobAvatar
                    empId={deptLeader.empId}
                    fileId={undefined}
                    fallbackText={deptLeader.empName}
                    className="size-11 text-lg"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {deptLeader.empName}
                    </p>
                    {/* §6: position은 백엔드 원문 코드 그대로 표시(번역하지 않음). */}
                    <p className="truncate text-xs text-muted-foreground">
                      {deptLeader.empNo} · {deptLeader.position}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <InfoRow icon={Phone} label="직통번호" value={deptLeader.extensionNo || '-'} />
                  <InfoRow
                    icon={Mail}
                    label="이메일"
                    value={
                      <a href={`mailto:${deptLeader.email}`} className="hover:underline">
                        {deptLeader.email}
                      </a>
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/*
            §5: ADMIN 전용 부서 관리 섹션(canManageDept일 때만). F205(활성화/비활성화)·F206(이름변경)·
            F208(부서장지정)은 T9.2에서, F207(상위부서변경)·F209(부서장종료)는 T9.3에서 실동작으로
            전환해 5개 관리 액션 모두 이 섹션에 배선됐다.
          */}
          {canManageDept && (
            <div className="space-y-3 border-t pt-5">
              <SectionHeading icon={Settings2}>부서 관리</SectionHeading>
              {/*
                5개 관리 액션을 성격별로 3개 소그룹으로 정렬한다: (1) 부서 정보 변경(이름·상위부서),
                (2) 부서장 관리(지정·종료), (3) 부서 활성 상태 토글. 소그룹 첫 버튼에 mt-2를 주어
                별도 heading 없이 시각적 구분만 만든다. 각 액션에 의미 아이콘을 붙여 스캔성을 높이고,
                되돌리기 어려운 '부서장 종료'만 destructive 톤으로 강조한다(나머지는 outline).
              */}
              <div className="flex flex-col gap-1.5">
                {/* (1) 부서 정보 변경 */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={onOpenRenameDialog}
                >
                  <Pencil />
                  부서명 변경
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={onOpenUpdateParentDialog}
                >
                  <Network />
                  상위 부서 변경
                </Button>

                {/* (2) 부서장 관리 */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full justify-start"
                  onClick={onOpenAppointLeaderDialog}
                >
                  <UserPlus />
                  부서장 지정
                </Button>
                {/* F209: 부서장이 공석(deptLeader===null)이면 종료할 대상이 없으므로 버튼 자체를 숨긴다. */}
                {deptLeader !== null && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-full justify-start"
                    onClick={onOpenEndLeaderDialog}
                  >
                    <UserMinus />
                    부서장 종료
                  </Button>
                )}

                {/* (3) 부서 활성 상태 토글 */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full justify-start"
                  disabled={isTogglingActive}
                  onClick={onToggleActive}
                >
                  {deptInfo.isActive ? <PowerOff /> : <Power />}
                  {deptInfo.isActive ? '비활성화 전환' : '활성화 전환'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 우측: 부서 멤버 영역. min-w-0으로 1fr 트랙을 축소 허용해 멤버 표의 자연폭이 트랙을
          밀어내(페이지 가로 스크롤 유발) 넘치지 않게 하고, 오버플로는 표 자체의 overflow-x-auto가 흡수한다. */}
      <section className="min-w-0 space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">부서 멤버 목록</h2>
          <p className="text-sm text-muted-foreground">
            부서 현황을 확인하고 필요한 멤버를 상세 화면에서 관리합니다.
          </p>
        </div>
        <Card className="h-fit">
          <CardContent className="space-y-4">
            {/* 툴바: 검색 + 총원 배지 + 페이지 크기 select */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <label htmlFor="member-search" className="sr-only">
                  부서 멤버 검색
                </label>
                <Input
                  id="member-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="사원명, 사번, 이메일 검색..."
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Pill>총 {pageInfo.totalElements}명</Pill>
                <label htmlFor="member-page-size" className="sr-only">
                  페이지 크기
                </label>
                <select
                  id="member-page-size"
                  value={size}
                  onChange={(event) => onSizeChange(Number(event.target.value))}
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}개씩
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 표 영역: 멤버 조회 실패 → 인라인 에러, 없음 → 검색 여부별 빈 상태, 있음 → 기존 표 재사용. */}
            {membersErrorMessage ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{membersErrorMessage}</p>
            ) : members.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {keyword ? '검색 결과가 없습니다.' : '부서 멤버가 없습니다.'}
              </p>
            ) : (
              <DepartmentMembersTable
                data={members}
                onRowClick={onRowClick}
                canManage={canManageMembers}
              />
            )}

            {/* 하단 페이지네이션(ROADMAP T10.1, 공유 표준 컴포넌트) */}
            <PaginationControls
              className="border-t pt-4"
              pageInfo={pageInfo}
              page={page}
              onPageChange={onPageChange}
              unit="명"
            />
          </CardContent>
        </Card>

        {/* 부서 근태 보드(adapt-ui 신규): 별도 부서 근태 요약 API가 없어 기존 DEPT_ATTENDANCE_MONTHLY/
            DEPT_ATTENDANCE_PENDING 조회 훅을 재사용하는 위젯(PersonalRecordsWidget과 동형 패턴).
            canViewAttendanceBoard(DEPT_MANAGER 전용)일 때만 렌더 — HR/일반 사원은 근태 조회 API
            자체가 403이라 무조건 렌더하면 안 된다. */}
        {canViewAttendanceBoard && <DeptAttendanceBoardWidget deptId={deptInfo.deptId} />}
      </section>
    </div>
  )
}
