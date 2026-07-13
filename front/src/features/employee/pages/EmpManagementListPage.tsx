import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { Network, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useDepartmentsQuery } from '@/features/department/api/useDepartmentsQuery'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useEmpsForManagementListQuery } from '../api/useEmpsForManagementListQuery'
import { DepartmentFilterDialog } from '../components/DepartmentFilterDialog'
import { EmpBelongingAssignDialog } from '../components/EmpBelongingAssignDialog'
import { EmpBelongingTransferDialog } from '../components/EmpBelongingTransferDialog'
import { EmpStatusChangeDialog } from '../components/EmpStatusChangeDialog'
import { HrManagedInfoDialog } from '../components/HrManagedInfoDialog'
import type { EmpManageAction } from '../components/EmpManagementTable'
import { EmpManagementTable } from '../components/EmpManagementTable'
import type { EmpStatus } from '../model/empManagement'
import { empStatusLabels } from '../model/empManagement'

/** 검색 디바운스 지연(ms). NewEmployeeApprovalListPage/BoardListPage와 동일 값. */
const SEARCH_DEBOUNCE_MS = 300
/** 부서 필터 후보 목록 조회 시 사용할 페이지 크기. EmpBelongingsAssignmentForm의 관례와 동일. */
const DEPARTMENT_CANDIDATE_PAGE_SIZE = 100
/** 헤더 툴바의 근무상태 셀렉트 클래스(EmployeeDetailPage 등 기존 native select 스타일과 동일). */
const SELECT_CLASS =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-auto dark:bg-input/30'

/**
 * 사원 관리 목록 페이지(`EMPS_FOR_MANAGEMENT`, HR/ADMIN 전용, /employees).
 *
 * 목표 디자인(employee-page 레퍼런스)에 맞춰 재스타일링: 단일 Card의 헤더 한 줄에 제목·건수
 * 배지·부서(조직도 트리 팝업)/상태/이름 필터를 배치하고, 본문은 표(EmpManagementTable) +
 * PaginationControls만 둔다.
 *
 * 행 클릭은 사원 상세(/employees/:empId)로 이동한다. 관리(수정성 작업)는 관리 컬럼 드롭다운으로
 * 모은다 — 정보 수정 / 근무 상태 변경 / (소속 있으면)부서 이동·(소속 없으면)부서 배정.
 * selectedEmpId + activeDialog만 로컬 state로 들고 record는 매 렌더 rows에서 파생한다(별도 스냅샷
 * 없음): mutation 성공 시 empsForManagement 캐시가 invalidate되어 rows가 갱신되면 열려 있는 모달도
 * 자동으로 최신 데이터를 반영한다. 필터에 걸려 선택 사원이 rows에서 사라지면 selectedRecord가
 * undefined가 되어 모달이 언마운트(닫힘)된다.
 */
export function EmpManagementListPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [deptId, setDeptId] = useState<number | undefined>(undefined)
  const [status, setStatus] = useState<EmpStatus | undefined>(undefined)
  const { page, size, onPageChange, resetPage } = usePageState()
  const [deptDialogOpen, setDeptDialogOpen] = useState(false)
  const [selectedEmpId, setSelectedEmpId] = useState<number | undefined>(undefined)
  const [activeDialog, setActiveDialog] = useState<EmpManageAction | undefined>(undefined)

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
  }, [searchInput, keyword, resetPage])

  const departmentsQuery = useDepartmentsQuery({ isActive: true, size: DEPARTMENT_CANDIDATE_PAGE_SIZE })
  const departments = departmentsQuery.data?.content ?? []
  const selectedDeptName = departments.find((d) => d.deptInfoResponse.deptId === deptId)?.deptInfoResponse
    .deptName

  const empsQuery = useEmpsForManagementListQuery({ deptId, status, keyword, page, size })

  useEffect(() => {
    if (!empsQuery.error) {
      return
    }
    handleApiError(empsQuery.error, { toast })
  }, [empsQuery.error])

  const rows = empsQuery.data?.content ?? []
  const pageInfo: PageMeta = empsQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }
  const selectedRecord = rows.find((row) => row.empId === selectedEmpId)
  const selectedPrimary = selectedRecord?.belongings.find((b) => b.isPrimary && b.endAt === null)

  /** 관리 진입점(행 클릭 or 관리 드롭다운) 공통: 대상 사원과 열 모달을 지정한다. */
  function openManage(empId: number, action: EmpManageAction) {
    setSelectedEmpId(empId)
    setActiveDialog(action)
  }

  function closeManage() {
    setSelectedEmpId(undefined)
    setActiveDialog(undefined)
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">사원 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          전사 사원의 근무 상태·소속·시스템 권한을 관리합니다 (HR · ADMIN)
        </p>
      </div>

      <Card className="h-fit">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>사원 목록</CardTitle>
            {empsQuery.data && <Badge variant="secondary">총 {pageInfo.totalElements}명</Badge>}

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setDeptDialogOpen(true)}
              >
                <Network className="size-4" aria-hidden="true" />
                {selectedDeptName ?? '전체 부서'}
              </Button>

              <select
                aria-label="근무 상태 필터"
                className={SELECT_CLASS}
                value={status ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  setStatus(value === '' ? undefined : (value as EmpStatus))
                  resetPage()
                }}
              >
                <option value="">전체 상태</option>
                {Object.entries(empStatusLabels).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:w-48">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="이름 검색"
                  aria-label="이름 검색"
                  className="h-8 w-full pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {empsQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : empsQuery.error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">사원 목록을 불러오지 못했습니다.</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">조회된 사원이 없습니다.</p>
          ) : (
            <EmpManagementTable
              data={rows}
              onRowClick={(record) => navigate(`/employees/${record.empId}`)}
              onManage={(record, action) => openManage(record.empId, action)}
            />
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

      <DepartmentFilterDialog
        open={deptDialogOpen}
        onOpenChange={setDeptDialogOpen}
        departments={departments}
        selectedDeptId={deptId}
        onSelect={(next) => {
          setDeptId(next)
          resetPage()
        }}
      />

      {selectedRecord && activeDialog === 'info' && (
        <HrManagedInfoDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              closeManage()
            }
          }}
          empId={selectedRecord.empId}
          record={selectedRecord}
        />
      )}

      {selectedRecord && activeDialog === 'status' && (
        <EmpStatusChangeDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              closeManage()
            }
          }}
          empId={selectedRecord.empId}
          status={selectedRecord.status}
        />
      )}

      {selectedRecord && activeDialog === 'transfer' && selectedPrimary && (
        <EmpBelongingTransferDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              closeManage()
            }
          }}
          empId={selectedRecord.empId}
          currentPrimaryStartAt={selectedPrimary.startAt}
          defaultStartAt={dayjs().format('YYYY-MM-DD')}
        />
      )}

      {selectedRecord && activeDialog === 'assign' && (
        <EmpBelongingAssignDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              closeManage()
            }
          }}
          empId={selectedRecord.empId}
          defaultStartAt={dayjs().format('YYYY-MM-DD')}
        />
      )}
    </div>
  )
}
