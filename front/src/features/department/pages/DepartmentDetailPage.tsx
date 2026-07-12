import { useEffect } from 'react'
import { useOutletContext, useParams } from 'react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { handleApiError, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { useActivateDepartmentMutation } from '../api/useActivateDepartmentMutation'
import { useDeactivateDepartmentMutation } from '../api/useDeactivateDepartmentMutation'
import { useDepartmentInfoQuery } from '../api/useDepartmentInfoQuery'
import { useDepartmentMembersQuery } from '../api/useDepartmentMembersQuery'
import { OrgChartDepartmentPanel } from '../components/OrgChartDepartmentPanel'
import type { DepartmentExplorerOutletContext } from './DepartmentsExplorerLayout'

/** 부서장 지정 후보 목록을 한 번에 담기 위한 멤버 조회 size. 멤버 표(검색·페이지네이션)가 없어져
 * 페이징 UI 대신 후보군을 사실상 모두 담도록 서버 기본값(10)보다 넉넉하게 잡는다
 * (UpdateDepartmentParentForm의 CANDIDATE_PAGE_SIZE=100과 동일 패턴). */
const LEADER_CANDIDATE_PAGE_SIZE = 100

/**
 * 부서 상세 컨테이너(F202/F203, ROADMAP T7.1 → 조직도 탐색형 재구성).
 *
 * DepartmentsExplorerLayout(부모 레이아웃 라우트)의 자식 라우트로, 좌측 트리가 항상 보이는
 * master-detail 구조의 "우측 상세 영역 내용"만 그린다 — 페이지 전체 wrapper·뒤로가기 링크·
 * <h1>은 더 이상 이 컴포넌트의 책임이 아니다(좌측 트리가 항상 보여 뒤로가기가 불필요).
 *
 * 우측 상세는 단일 병합 카드(OrgChartDepartmentPanel)로 렌더한다. 멤버 목록 표·부서 근태 보드는
 * 제거됐고, 멤버 조회(useDepartmentMembersQuery)는 부서장 지정 후보 목록·현재 인원 수 산출 용도로만
 * 남아 size 고정으로 호출한다. 상위 부서 이름·하위 부서 배지는 레이아웃이 내려준 flat 부서 목록
 * (useOutletContext)에서 파생시킨다(중복 조회 방지). "부서 등록"은 좌측 트리 헤더의 "신규 부서"
 * 버튼이 전담하므로 이 페이지는 다루지 않는다.
 */
export function DepartmentDetailPage() {
  const { deptId: deptIdParam } = useParams()
  // route param은 신뢰 불가 입력이다. Number()는 지수("1e3")·16진수("0x10")·2진수("0b101") 표기까지
  // 유효한 정수로 강제변환해버려 존재할 수 있는 다른 부서 데이터를 조용히 오매핑할 수 있으므로,
  // Number 변환 전에 원문 문자열이 순수 10진 양의 정수 형식인지부터 검증한다.
  const isDecimalPositiveInteger = deptIdParam !== undefined && /^[1-9][0-9]*$/.test(deptIdParam)
  const deptId = isDecimalPositiveInteger ? Number(deptIdParam) : undefined
  const isInvalidDeptId = deptId === undefined

  const { departments } = useOutletContext<DepartmentExplorerOutletContext>()

  const roles = useAuthStore((state) => state.roles)
  const canManageDept = hasRequiredRole(roles, 'ADMIN')

  const deptInfoQuery = useDepartmentInfoQuery(isInvalidDeptId ? undefined : deptId)
  const membersQuery = useDepartmentMembersQuery(isInvalidDeptId ? undefined : deptId, {
    size: LEADER_CANDIDATE_PAGE_SIZE,
  })

  // F205(활성화/비활성화 토글): 다이얼로그가 없는 단일 액션이라 폼(RHF) 없이 컨테이너가 직접
  // mutate → 성공 토스트 / 실패는 handleApiError(토스트 폴백만)로 처리한다. onSuccess(mutation
  // 내부)가 이미 departmentKeys.detail(deptId)를 invalidate하므로 여기서는 재조회를 직접
  // 트리거하지 않는다.
  const activateMutation = useActivateDepartmentMutation()
  const deactivateMutation = useDeactivateDepartmentMutation()
  const isTogglingActive = activateMutation.isPending || deactivateMutation.isPending

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

  // 멤버 조회 실패는 표가 사라진 뒤에도 부서장 후보·현재 인원 산출에 영향을 주므로 토스트로만 알린다
  // (상단 카드는 deptInfoQuery로 정상 렌더된 채 유지).
  useEffect(() => {
    if (!membersQuery.error) {
      return
    }
    const apiError = normalizeApiError(membersQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [membersQuery.error])

  // 라우트 파라미터 자체가 유효하지 않으면(없음/숫자 아님) 쿼리를 내보내지도 않고 즉시 not-found로 분기한다.
  if (isInvalidDeptId) {
    return <p className="text-sm text-muted-foreground">부서 정보를 찾을 수 없습니다.</p>
  }

  // 최초 진입 전체 게이트는 deptInfoQuery에만 건다(멤버 조회는 keepPreviousData가 처리하므로
  // 여기서 함께 게이트하지 않는다 — 카드 깜빡임 방지).
  if (deptInfoQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">부서 상세를 불러오는 중...</p>
  }

  if (deptInfoQuery.error) {
    const apiError = normalizeApiError(deptInfoQuery.error)
    if (isNotFound(apiError)) {
      return <p className="text-sm text-muted-foreground">부서 정보를 찾을 수 없습니다.</p>
    }
    // not-found가 아닌 실패는 위 useEffect가 토스트로 알렸으므로, 화면은 안내 문구로만 표시한다.
    return <p className="text-sm text-muted-foreground">부서 정보를 불러오지 못했습니다.</p>
  }

  // 로딩·에러 분기를 모두 통과한 렌더 직전 최종 가드. data! non-null 단언 없이 좁힌다.
  if (!deptInfoQuery.data) {
    return null
  }

  const { deptInfoResponse, deptLeader } = deptInfoQuery.data
  const memberCount = membersQuery.data?.totalElements ?? 0
  const currentMembers = membersQuery.data?.content ?? []

  // outlet context의 flat 부서 목록에서 상위 부서 이름·하위 부서를 파생시킨다.
  const departmentsById = new Map(departments.map((dept) => [dept.deptInfoResponse.deptId, dept]))

  const parentDeptName =
    deptInfoResponse.parentDeptId !== null
      ? (departmentsById.get(deptInfoResponse.parentDeptId)?.deptInfoResponse.deptName ?? null)
      : null

  const subDepartments = departments
    .filter((dept) => dept.deptInfoResponse.parentDeptId === deptInfoResponse.deptId)
    .map((dept) => dept.deptInfoResponse)

  return (
    <OrgChartDepartmentPanel
      deptInfo={deptInfoResponse}
      deptLeader={deptLeader}
      memberCount={memberCount}
      parentDeptName={parentDeptName}
      subDepartments={subDepartments}
      canManageDept={canManageDept}
      members={currentMembers}
      onToggleActive={handleToggleActive}
      isTogglingActive={isTogglingActive}
    />
  )
}
