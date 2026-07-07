import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { usePageState } from '@/shared/lib/usePageState'
import { useDepartmentInfoQuery } from '../api/useDepartmentInfoQuery'
import { useDepartmentMembersQuery } from '../api/useDepartmentMembersQuery'
import { DepartmentDetailView } from '../components/DepartmentDetailView'
import { getPrimaryDeptId } from '../lib/getPrimaryDeptId'

/**
 * 부서 상세 페이지(F001, ROADMAP T2.1-b, PRD §부서 상세 화면).
 *
 * deptId는 별도 선택 UI 없이 useMeQuery()의 currentDepts에서 getPrimaryDeptId(T2.1-a)로
 * 자동 도출한다. currentDepts가 빈 배열이면(소속 부서 없음) deptId가 undefined로 남는데,
 * 이 경우 useDepartmentInfoQuery/useDepartmentMembersQuery가 enabled:false로 대기해 쿼리
 * 자체가 나가지 않아 무음 상태가 될 수 있으므로(T2.1-a 리뷰 지적) 아래에서 명시적으로 빈
 * 상태 UX를 노출한다.
 *
 * keyword/page/size: 부서 멤버 검색·페이징 로컬 상태. page/size는 공유 usePageState(ROADMAP
 * T10.1)로 관리하며, 검색어 변경 시 resetPage()로 페이지를 0으로 리셋해 존재하지 않는 페이지를
 * 조회하는 것을 방지한다(페이지 크기 변경 시 리셋은 usePageState 내부 onSizeChange가 처리).
 *
 * canManageMembers: dept-manager/admin 전용 "관리" 액션 컬럼 노출 여부. 이 목록 자체가 조회자
 * 본인 소속 부서원만 보여주므로(getPrimaryDeptId 기반 deptId) 별도 부서 일치 검증은 하지
 * 않고 hasRequiredRole(roles, 'DEPT_MANAGER')만으로 게이팅한다(ADMIN은 계층상 포함).
 * 서버가 최종 판단하므로(security.md) 이 값은 UI 게이팅 힌트일 뿐이다.
 *
 * canManageDept(부서 관리 섹션)는 이 페이지에서 항상 false다 — ADMIN이 이 화면(본인 소속
 * 바로가기, F104)에서까지 활성화/비활성화·이름변경·부서장지정 같은 임의 부서 관리 액션을
 * 수행하게 하면 "조직도"(/departments/:deptId, T7.1) 화면과 관리 진입점이 중복된다. 관리는
 * T7.1 컨테이너에서만 수행하고, 이 화면은 조회 전용으로 유지한다.
 */
export function DepartmentMembersPage() {
  const navigate = useNavigate()
  const roles = useAuthStore((state) => state.roles)
  const canManageMembers = hasRequiredRole(roles, 'DEPT_MANAGER')
  const meQuery = useMeQuery()
  //todo : [이 페이지는 getPrimaryDeptId로 deptId를 로그인 사용자의 소속 부서로 고정 도출하고 라우트 파라미터를 쓰지 않는다. 그러나 docs/prd/3.department-management-prd.md(F202/F203, "부서 상세 페이지")는 "부서 목록 페이지 행 클릭 → 부서 상세 페이지"로 임의 부서(deptId route param)를 열람하는 화면을 요구하는데, 이는 별도 페이지(DepartmentDetailPage, T7.1)로 이미 구현되어 있다. 두 페이지가 공존하는 것이 의도된 설계인지, 이 페이지(F104)를 그대로 유지할지 재확인 필요]
  const deptId = meQuery.data ? getPrimaryDeptId(meQuery.data.currentDepts) : undefined
  const [keyword, setKeyword] = useState('')
  const { page, size, onPageChange, onSizeChange, resetPage } = usePageState()
  const deptInfoQuery = useDepartmentInfoQuery(deptId)
  const membersQuery = useDepartmentMembersQuery(deptId, { keyword, page, size })

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

  if (meQuery.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  // meQuery 자체의 실패(네트워크·500 등)는 "소속 부서 없음"과 원인이 다르므로 별도 메시지로 분기한다.
  // 이 분기가 없으면 meQuery.data가 falsy라 아래 "소속 부서 없음" 조건도 통과하지 못한 채 그대로
  // 내려가고, enabled:false로 대기 중인 deptInfoQuery/membersQuery가 무해한 상태(isLoading=false,
  // error=null)로 남아 최종적으로 "소속 부서 멤버가 없습니다"가 오인 표시된다(리뷰 지적, 수정).
  if (meQuery.isError) {
    const apiError = normalizeApiError(meQuery.error)
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
        <p className="text-sm text-muted-foreground">
          내 정보를 불러오지 못해 부서 상세를 표시할 수 없습니다. {apiError.message}
        </p>
      </div>
    )
  }

  if (meQuery.data && deptId === undefined) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
        <p className="text-sm text-muted-foreground">
          소속된 부서가 없어 부서 상세를 표시할 수 없습니다. 인사과에 문의해주세요.
        </p>
      </div>
    )
  }

  //todo : [membersQuery.members 키는 keyword/page/size가 바뀔 때마다 새 캐시 엔트리라 매번 isLoading=true가 됨. 그 결과 검색어 입력·페이지 이동 때마다 이 게이트가 DepartmentDetailView(검색 Input·좌측 부서 카드 포함) 전체를 언마운트하고 이 로딩 문구로 교체함 → 검색 포커스 상실·전면 깜빡임. placeholderData: keepPreviousData로 이전 데이터를 유지하거나, 초기 로딩만 게이트하고 갱신은 표 내부 로컬 표시로 처리할 것]
  if (deptInfoQuery.isLoading || membersQuery.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">부서 상세를 불러오는 중...</p>
      </div>
    )
  }

  if (deptInfoQuery.error) {
    const apiError = normalizeApiError(deptInfoQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
          <p className="text-sm text-muted-foreground">부서 정보를 찾을 수 없습니다.</p>
        </div>
      )
    }
    // not-found가 아닌 실패는 위 useEffect가 토스트로 알렸으므로, 화면은 빈 상태로만 표시한다.
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
        <p className="text-sm text-muted-foreground">부서 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (membersQuery.error) {
    const apiError = normalizeApiError(membersQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
          <p className="text-sm text-muted-foreground">부서 정보를 찾을 수 없습니다.</p>
        </div>
      )
    }
    // not-found가 아닌 실패는 위 useEffect가 토스트로 알렸으므로, 화면은 빈 상태로만 표시한다.
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
        <p className="text-sm text-muted-foreground">부서 멤버 목록을 불러오지 못했습니다.</p>
      </div>
    )
  }

  // 위 "소속 부서 없음" 분기가 이미 deptId===undefined인 경우를 처리했으므로 이 지점에는
  // 도달하지 않지만, `!` 단언 없이 타입을 좁히기 위해 방어적으로 한 번 더 가드한다.
  if (deptId === undefined) {
    return null
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">부서 상세</h1>
      {/* //todo : [deptInfoQuery.data! non-null 단언이 오직 위 isLoading 게이트에만 의존함. 오프라인·paused pending(status=pending, fetchStatus=paused)에서는 isLoading=false·error=null이라 게이트를 통과하는데 data는 undefined → data!.deptInfoResponse에서 런타임 크래시. 형제 페이지 EmployeeDetailPage처럼 렌더 직전 `if (!deptInfoQuery.data) return null` 최종 가드를 두어 !단언 없이 좁힐 것] */}
      <DepartmentDetailView
        deptInfo={deptInfoQuery.data!.deptInfoResponse}
        deptLeader={deptInfoQuery.data!.deptLeader}
        members={membersQuery.data?.content ?? []}
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
    </div>
  )
}
