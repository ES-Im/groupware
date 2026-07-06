import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { useDepartmentMembersQuery } from '../api/useDepartmentMembersQuery'
import { DepartmentMembersTable } from '../components/DepartmentMembersTable'
import { getPrimaryDeptId } from '../lib/getPrimaryDeptId'

/**
 * 부서 멤버 목록 페이지(F001, ROADMAP T2.1-b, PRD §부서 멤버 목록 페이지).
 *
 * deptId는 별도 선택 UI 없이 useMeQuery()의 currentDepts에서 getPrimaryDeptId(T2.1-a)로
 * 자동 도출한다. currentDepts가 빈 배열이면(소속 부서 없음) deptId가 undefined로 남는데,
 * 이 경우 useDepartmentMembersQuery가 enabled:false로 대기해 쿼리 자체가 나가지 않아
 * 무음 상태가 될 수 있으므로(T2.1-a 리뷰 지적) 아래에서 명시적으로 빈 상태 UX를 노출한다.
 */
export function DepartmentMembersPage() {
  const navigate = useNavigate()
  const meQuery = useMeQuery()
  const deptId = meQuery.data ? getPrimaryDeptId(meQuery.data.currentDepts) : undefined
  const membersQuery = useDepartmentMembersQuery(deptId)

  // 조회 실패 중 not-found가 아닌 경우만 토스트로 알린다(not-found는 아래에서 전용 UX로 렌더).
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
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  // meQuery 자체의 실패(네트워크·500 등)는 "소속 부서 없음"과 원인이 다르므로 별도 메시지로 분기한다.
  // 이 분기가 없으면 meQuery.data가 falsy라 아래 "소속 부서 없음" 조건도 통과하지 못한 채 그대로
  // 내려가고, enabled:false로 대기 중인 membersQuery가 무해한 상태(isLoading=false, error=null)로
  // 남아 최종적으로 "소속 부서 멤버가 없습니다"가 오인 표시된다(리뷰 지적, 수정).
  if (meQuery.isError) {
    const apiError = normalizeApiError(meQuery.error)
    return (
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 멤버 목록</h1>
        <p className="text-sm text-muted-foreground">
          내 정보를 불러오지 못해 부서 멤버 목록을 표시할 수 없습니다. {apiError.message}
        </p>
      </div>
    )
  }

  if (meQuery.data && deptId === undefined) {
    return (
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 멤버 목록</h1>
        <p className="text-sm text-muted-foreground">
          소속된 부서가 없어 부서 멤버 목록을 표시할 수 없습니다. 인사과에 문의해주세요.
        </p>
      </div>
    )
  }

  if (membersQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">부서 멤버 목록을 불러오는 중...</p>
      </div>
    )
  }

  if (membersQuery.error) {
    const apiError = normalizeApiError(membersQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 멤버 목록</h1>
          <p className="text-sm text-muted-foreground">부서 정보를 찾을 수 없습니다.</p>
        </div>
      )
    }
    // not-found가 아닌 실패는 위 useEffect가 토스트로 알렸으므로, 화면은 빈 상태로만 표시한다.
    return (
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 멤버 목록</h1>
        <p className="text-sm text-muted-foreground">부서 멤버 목록을 불러오지 못했습니다.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">부서 멤버 목록</h1>
      <DepartmentMembersTable data={membersQuery.data?.content ?? []} onRowClick={handleRowClick} />
    </div>
  )
}
