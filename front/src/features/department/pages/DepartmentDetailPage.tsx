import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { handleApiError, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { usePageState } from '@/shared/lib/usePageState'
import { useActivateDepartmentMutation } from '../api/useActivateDepartmentMutation'
import { useDeactivateDepartmentMutation } from '../api/useDeactivateDepartmentMutation'
import { useDepartmentInfoQuery } from '../api/useDepartmentInfoQuery'
import { useDepartmentMembersQuery } from '../api/useDepartmentMembersQuery'
import { AppointDepartmentLeaderDialog } from '../components/AppointDepartmentLeaderDialog'
import { DepartmentDetailView } from '../components/DepartmentDetailView'
import { EndDepartmentLeaderDialog } from '../components/EndDepartmentLeaderDialog'
import { RenameDepartmentDialog } from '../components/RenameDepartmentDialog'
import { UpdateDepartmentParentDialog } from '../components/UpdateDepartmentParentDialog'

/**
 * 부서 상세 컨테이너 페이지(F202/F203, ROADMAP T7.1, PRD §3 부서 상세 페이지).
 *
 * "조직도"(/departments, T6.3) 목록에서 행 클릭으로 진입하는 임의 부서 상세 화면이다.
 * deptId는 라우트 파라미터(/departments/:deptId)에서 얻는다 — 본인 소속 부서로 고정 도출하는
 * 기존 DepartmentMembersPage(/department-members, F104)와 달리 임의 부서를 열람할 수 있다.
 *
 * 두 쿼리(deptInfoQuery/membersQuery)는 독립적으로 유지한다. DepartmentMembersPage에 실측된
 * 결함(멤버 검색·페이징마다 좌측 기본정보 카드까지 전면 재로딩/깜빡임, 검색 포커스 소실)을
 * 재현하지 않기 위해, 전체 로딩 게이트는 deptInfoQuery.isLoading(최초 진입)에만 걸고
 * membersQuery는 placeholderData: keepPreviousData(useDepartmentMembersQuery에 적용됨)로
 * 검색어/페이지 변경 시 이전 목록을 유지한 채 표 영역만 갱신한다.
 */
export function DepartmentDetailPage() {
  const navigate = useNavigate()
  const { deptId: deptIdParam } = useParams()
  // route param은 신뢰 불가 입력이다. Number()는 지수("1e3")·16진수("0x10")·2진수("0b101") 표기까지
  // 유효한 정수로 강제변환해버려 존재할 수 있는 다른 부서 데이터를 조용히 오매핑할 수 있으므로,
  // Number 변환 전에 원문 문자열이 순수 10진 양의 정수 형식인지부터 검증한다(0/음수/소수/그 외 진법 표기 전부 배제).
  const isDecimalPositiveInteger = deptIdParam !== undefined && /^[1-9][0-9]*$/.test(deptIdParam)
  const deptId = isDecimalPositiveInteger ? Number(deptIdParam) : undefined
  const isInvalidDeptId = deptId === undefined

  const roles = useAuthStore((state) => state.roles)
  const canManageMembers = hasRequiredRole(roles, 'DEPT_MANAGER')
  const canManageDept = hasRequiredRole(roles, 'ADMIN')

  const [keyword, setKeyword] = useState('')
  const { page, size, onPageChange, onSizeChange, resetPage } = usePageState()
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isUpdateParentDialogOpen, setIsUpdateParentDialogOpen] = useState(false)
  const [isAppointLeaderDialogOpen, setIsAppointLeaderDialogOpen] = useState(false)
  const [isEndLeaderDialogOpen, setIsEndLeaderDialogOpen] = useState(false)

  const deptInfoQuery = useDepartmentInfoQuery(isInvalidDeptId ? undefined : deptId)
  const membersQuery = useDepartmentMembersQuery(isInvalidDeptId ? undefined : deptId, {
    keyword,
    page,
    size,
  })

  // F205(활성화/비활성화 토글, ROADMAP T9.2): 다이얼로그가 없는 단일 액션이라 폼(RHF) 없이
  // 컨테이너가 직접 mutate → 성공 토스트 / 실패는 handleApiError(T0.2c, 토스트 폴백만)로 처리한다.
  // onSuccess(mutation 내부)가 이미 departmentKeys.detail(deptId)를 invalidate하므로 여기서는
  // 재조회를 직접 트리거하지 않는다.
  const activateMutation = useActivateDepartmentMutation()
  const deactivateMutation = useDeactivateDepartmentMutation()
  const isTogglingActive = activateMutation.isPending || deactivateMutation.isPending

  // 목록(/departments)으로 돌아가는 최소한의 텍스트 링크. 부서 상세는 목록의 행 클릭으로만
  // 진입하는 화면이라 브라우저 뒤로가기 외의 명시적 복귀 동선이 없었다(UX 검토 지적 사항).
  const backLink = (
    <Link
      to="/departments"
      className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
    >
      ← 조직도
    </Link>
  )

  function handleToggleActive() {
    if (deptId === undefined) {
      return
    }
    const isActive = deptInfoQuery.data?.deptInfoResponse.isActive
    const mutation = isActive ? deactivateMutation : activateMutation
    mutation.mutate(deptId, {
      onSuccess: () => {
        toast.success(isActive ? '부서를 비활성화했습니다' : '부서를 활성화했습니다')
      },
      onError: (error) => {
        handleApiError(error, { toast })
      },
    })
  }

  // 조회 실패 중 not-found가 아닌 경우만 토스트로 알린다(not-found는 아래에서 전용 UX로 렌더).
  useEffect(() => {
    if (!deptInfoQuery.error) {
      return
    }
    const apiError = normalizeApiError(deptInfoQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [deptInfoQuery.error])

  useEffect(() => {
    if (!membersQuery.error) {
      return
    }
    const apiError = normalizeApiError(membersQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [membersQuery.error])

  function handleRowClick(empId: number) {
    navigate(`/employees/${empId}`)
  }

  // 라우트 파라미터 자체가 유효하지 않으면(없음/숫자 아님) 쿼리를 내보내지도 않고 즉시 not-found로 분기한다.
  if (isInvalidDeptId) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backLink}
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
        <p className="text-sm text-muted-foreground">부서 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  // 최초 진입 전체 게이트는 deptInfoQuery에만 건다(멤버 검색·페이징은 membersQuery의
  // keepPreviousData가 처리하므로 여기서 함께 게이트하지 않는다 — 좌측 카드 깜빡임 방지).
  if (deptInfoQuery.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backLink}
        <p className="text-sm text-muted-foreground">부서 상세를 불러오는 중...</p>
      </div>
    )
  }

  if (deptInfoQuery.error) {
    const apiError = normalizeApiError(deptInfoQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          {backLink}
          <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
          <p className="text-sm text-muted-foreground">부서 정보를 찾을 수 없습니다.</p>
        </div>
      )
    }
    // not-found가 아닌 실패는 위 useEffect가 토스트로 알렸으므로, 화면은 안내 문구로만 표시한다.
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backLink}
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
        <p className="text-sm text-muted-foreground">부서 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  // 멤버 조회 실패는 좌측 부서 카드(deptInfoQuery는 이미 정상 로드됨)까지 교체하지 않는다 —
  // 표 영역만 인라인 에러 문구로 대체하고, 나머지 레이아웃(좌측 카드·검색·페이징 UI)은 그대로 유지한다.
  const membersErrorMessage = membersQuery.error ? '부서 멤버 목록을 불러오지 못했습니다.' : undefined

  // 로딩·에러 분기를 모두 통과한 렌더 직전 최종 가드. data! non-null 단언 없이 좁힌다.
  if (!deptInfoQuery.data) {
    return null
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      {backLink}
      <h1 className="mb-6 text-xl font-semibold tracking-tight">부서 상세</h1>
      <DepartmentDetailView
        deptInfo={deptInfoQuery.data.deptInfoResponse}
        deptLeader={deptInfoQuery.data.deptLeader}
        members={membersQuery.data?.content ?? []}
        membersErrorMessage={membersErrorMessage}
        pageInfo={
          membersQuery.data ?? {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size,
            first: true,
            last: true,
            numberOfElements: 0,
            empty: true,
          }
        }
        canManageMembers={canManageMembers}
        // 이 페이지의 canManageMembers는 이미 hasRequiredRole(roles,'DEPT_MANAGER') 단독 계산이라
        // (DepartmentMembersPage와 달리 HR을 섞지 않음) 근태 보드 게이팅에 그대로 재사용할 수 있다.
        canViewAttendanceBoard={canManageMembers}
        canManageDept={canManageDept}
        onToggleActive={handleToggleActive}
        isTogglingActive={isTogglingActive}
        onOpenRenameDialog={() => setIsRenameDialogOpen(true)}
        onOpenUpdateParentDialog={() => setIsUpdateParentDialogOpen(true)}
        onOpenAppointLeaderDialog={() => setIsAppointLeaderDialogOpen(true)}
        onOpenEndLeaderDialog={() => setIsEndLeaderDialogOpen(true)}
        keyword={keyword}
        onKeywordChange={(value) => {
          setKeyword(value)
          resetPage()
        }}
        page={page}
        onPageChange={onPageChange}
        size={size}
        onSizeChange={onSizeChange}
        onRowClick={handleRowClick}
      />

      {/* F206/F207/F208/F209 다이얼로그(ROADMAP T9.2/T9.3): RegisterDepartmentDialog(T8.1)와 동일하게
          다이얼로그가 자체 mutation(및 F207의 경우 후보 목록 조회까지)을 소유하고, 이 컨테이너는
          open 상태만 관리한다. */}
      <RenameDepartmentDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        deptId={deptId}
        currentName={deptInfoQuery.data.deptInfoResponse.deptName}
      />
      <UpdateDepartmentParentDialog
        open={isUpdateParentDialogOpen}
        onOpenChange={setIsUpdateParentDialogOpen}
        deptId={deptId}
        currentParentDeptId={deptInfoQuery.data.deptInfoResponse.parentDeptId}
      />
      <AppointDepartmentLeaderDialog
        open={isAppointLeaderDialogOpen}
        onOpenChange={setIsAppointLeaderDialogOpen}
        deptId={deptId}
        members={membersQuery.data?.content ?? []}
      />
      <EndDepartmentLeaderDialog
        open={isEndLeaderDialogOpen}
        onOpenChange={setIsEndLeaderDialogOpen}
        deptId={deptId}
        currentLeaderName={deptInfoQuery.data.deptLeader?.empName ?? ''}
      />
    </div>
  )
}
