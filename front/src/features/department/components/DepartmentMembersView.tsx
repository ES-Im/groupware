import { useEffect, useMemo, useState } from 'react'
import { Building2, Mail, Pencil, Phone, Search } from 'lucide-react'
import { useDeptEmpManagementListQuery } from '@/features/employee/api/useDeptEmpManagementListQuery'
import { DeptManagedInfoDialog } from '@/features/employee/components/DeptManagedInfoDialog'
import { HrManagedInfoDialog } from '@/features/employee/components/HrManagedInfoDialog'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import type { DeptInfoResponse, DeptLeader } from '../model/deptInfo'
import type { DeptMemberResponse, Page } from '../model/deptMember'

/** 검색 디바운스 지연(ms). DepartmentDetailView와 동일 값을 재사용한다. */
const SEARCH_DEBOUNCE_MS = 300

/** 페이지 크기 선택 옵션(DepartmentDetailView와 동일: 5/10/15/20). */
const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const

interface DepartmentMembersViewProps {
  /** 부서 기본 정보. 데이터 페칭은 상위 페이지 컨테이너가 수행해 주입한다. */
  deptInfo: DeptInfoResponse
  /** 부서장 정보. 지정되지 않은 부서면 null → '미지정'으로 표기한다. */
  deptLeader: DeptLeader | null
  /** 현재 페이지의 부서 멤버 목록(content). */
  members: DeptMemberResponse[]
  /** 서버 페이지 메타(totalElements/totalPages/number/size/first/last 사용). */
  pageInfo: Page<unknown>
  /** dept-manager/hr/admin 전용 "관리" 액션 컬럼 노출 여부. role 계산은 상위에서 수행. */
  canManageMembers: boolean
  /** HR 또는 ADMIN 여부(정보 수정 모달을 HR 폼으로 열지 결정). */
  canManageAsHr: boolean
  /** DEPT_MANAGER(같은 부서) 여부. canManageAsHr가 우선한다(EmployeeDetailPage와 동일 우선순위). */
  canManageAsDeptManager: boolean
  /** 정보 수정 모달용 관리 레코드(EMPS_FOR_MANAGEMENT) 필터·서버 판정용 부서 식별자. */
  deptId: number
  /** 확정된 검색 키워드(디바운스 후 상위로 반영된 값). */
  keyword: string
  /** 디바운스된 검색어 변경 콜백. */
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

/**
 * 부서 구성원 목록 뷰(F104, 목표 디자인 "부서 구성원" 화면 이식).
 *
 * 상단 부서 정보 배너(아이콘 타일 + 부서명 + 부서코드·부서장 메타 + 부서 인원 통계) + 하단 구성원
 * 목록 카드(검색 + 사번/이름/직급/이메일/내선/관리 표)로 구성한다. DepartmentDetailView(조직도
 * /departments/:deptId 전용, master-detail)와 시각/구성이 전혀 달라 공유 컴포넌트를 재사용하지
 * 않고 이 화면 전용으로 별도 구현했다(공유 컴포넌트를 건드리면 범위 밖 조직도 화면이 함께 바뀜).
 *
 * "관리" 컬럼(canManageMembers일 때만): 행의 [정보 수정] 버튼이 사원 상세(EmployeeDetailPage)의
 * "사원 관리 - 정보 수정"과 동일한 모달(HrManagedInfoDialog/DeptManagedInfoDialog)을 연다. 어느
 * 폼을 여는지는 canManageAsHr을 canManageAsDeptManager보다 우선해 결정한다(ADMIN이 HR 쪽으로
 * 흡수되는 것과 동일 우선순위). 모달이 요구하는 EmpManagementRecord는 useDeptEmpManagementListQuery로
 * 부서 전량을 한 번에 프리페치해 empId→레코드 룩업 맵으로 즉시 해소한다(모달 열 때 네트워크 대기 없음).
 */
export function DepartmentMembersView({
  deptInfo,
  deptLeader,
  members,
  pageInfo,
  canManageMembers,
  canManageAsHr,
  canManageAsDeptManager,
  deptId,
  keyword,
  onKeywordChange,
  page,
  onPageChange,
  size,
  onSizeChange,
  onRowClick,
}: DepartmentMembersViewProps) {
  // 검색 입력 원문값은 로컬로 관리하고, 디바운스 후에만 상위 onKeywordChange로 반영한다.
  const [searchInput, setSearchInput] = useState(keyword)

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => onKeywordChange(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword, onKeywordChange])

  // 정보 수정 모달 대상 사원(null이면 닫힘). 관리 레코드는 아래 룩업 맵에서 즉시 조회한다.
  const [manageTargetEmpId, setManageTargetEmpId] = useState<number | null>(null)

  const managementQuery = useDeptEmpManagementListQuery(deptId, canManageMembers)
  const recordMap = useMemo(() => {
    const map = new Map(
      (managementQuery.data?.content ?? []).map((record) => [record.empId, record]),
    )
    return map
  }, [managementQuery.data])

  const manageRecord = manageTargetEmpId === null ? undefined : recordMap.get(manageTargetEmpId)

  return (
    <div className="space-y-4">
      {/* 부서 정보 배너 */}
      <Card className="h-fit">
        <CardContent className="flex flex-wrap items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-6" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight">{deptInfo.deptName}</h2>
              <span
                className={
                  deptInfo.isActive
                    ? 'inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
                    : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                }
              >
                {deptInfo.isActive ? '활성' : '비활성'}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              부서코드 {deptInfo.deptCode} · 부서장 {deptLeader?.empName ?? '미지정'}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">부서 인원</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {pageInfo.totalElements}
              <span className="ml-1 text-sm font-medium text-muted-foreground">명</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 구성원 목록 */}
      <Card className="h-fit">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>구성원 목록</CardTitle>
            <div className="flex items-center gap-2">
              <label htmlFor="dept-members-page-size" className="sr-only">
                페이지 크기
              </label>
              <select
                id="dept-members-page-size"
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
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <label htmlFor="dept-members-search" className="sr-only">
                  부서원 이름 검색
                </label>
                <Input
                  id="dept-members-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="부서원 이름 검색..."
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex min-h-[56rem] flex-col">
            {members.length === 0 ? (
              <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                {keyword ? '검색 결과가 없습니다.' : '부서 멤버가 없습니다.'}
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      사번
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      이름
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      직급
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      이메일
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      내선
                    </th>
                    {canManageMembers && (
                      <th className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap text-muted-foreground">
                        관리
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.empId}
                      role="button"
                      tabIndex={0}
                      onClick={() => onRowClick(member.empId)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          onRowClick(member.empId)
                        }
                      }}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                    >
                      <td className="px-3 py-3 align-middle font-mono text-xs whitespace-nowrap text-muted-foreground">
                        {member.empNo}
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <BlobAvatar
                            empId={member.empId}
                            fileId={undefined}
                            fallbackText={member.empName}
                            className="size-7"
                          />
                          <span className="font-medium text-foreground">{member.empName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground">
                        {member.position}
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="size-3.5 text-muted-foreground" />
                          {member.email}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground" />
                          {member.extensionNo || '-'}
                        </span>
                      </td>
                      {canManageMembers && (
                        <td className="px-3 py-3 text-right align-middle whitespace-nowrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={managementQuery.isLoading || !recordMap.has(member.empId)}
                            // 행 클릭(사원 상세 이동)으로 버블링되지 않도록 정지하고, 대신 모달만 연다.
                            onClick={(event) => {
                              event.stopPropagation()
                              setManageTargetEmpId(member.empId)
                            }}
                          >
                            <Pencil />
                            정보 수정
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/*
        정보 수정 모달: 사원 상세(EmployeeDetailPage)의 "사원 관리 - 정보 수정"과 동일한 다이얼로그를
        재사용한다. manageRecord가 확보됐을 때만 마운트하며, 역할에 따라 HR/부서매니저 폼을 고른다.
      */}
      {manageTargetEmpId !== null && manageRecord && (
        canManageAsHr ? (
          <HrManagedInfoDialog
            open
            onOpenChange={(open) => {
              if (!open) {
                setManageTargetEmpId(null)
              }
            }}
            empId={manageTargetEmpId}
            record={manageRecord}
          />
        ) : canManageAsDeptManager ? (
          <DeptManagedInfoDialog
            open
            onOpenChange={(open) => {
              if (!open) {
                setManageTargetEmpId(null)
              }
            }}
            empId={manageTargetEmpId}
            record={manageRecord}
          />
        ) : null
      )}
    </div>
  )
}
