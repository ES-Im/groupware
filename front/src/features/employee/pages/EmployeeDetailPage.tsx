import { useEffect } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { useEmployeeQuery } from '../api/useEmployeeQuery'
import { EmployeeInfoView } from '../components/EmployeeInfoView'

/**
 * 사원 상세 페이지(타 사원, F002 RETRIEVE_EMP_INFO, ROADMAP T2.2).
 * 부서 멤버 목록(T2.1-b)의 행 클릭이 `/employees/:empId`로 이동시켜 도달한다.
 *
 * 조회 실패는 DepartmentMembersPage(T2.1-b)와 동일한 분기 패턴을 따른다: not-found →
 * 전용 not-found UX, forbidden(ROLE_003) → 전용 권한 부족 UX, 그 외 → 토스트(useEffect로
 * 1회성 알림, 렌더 중 side effect 방지).
 */
export function EmployeeDetailPage() {
  const { empId } = useParams<{ empId: string }>()
  const parsedEmpId = empId !== undefined ? Number(empId) : undefined
  const isValidEmpId = parsedEmpId !== undefined && !Number.isNaN(parsedEmpId)
  const query = useEmployeeQuery(isValidEmpId ? parsedEmpId : undefined)

  // not-found/forbidden은 아래에서 전용 UX로 렌더하므로, 그 외 실패만 토스트로 알린다.
  useEffect(() => {
    if (!query.error) {
      return
    }
    const apiError = normalizeApiError(query.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [query.error])

  if (!isValidEmpId) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">사원 상세</h1>
        <p className="text-sm text-muted-foreground">잘못된 사원 식별자입니다.</p>
      </div>
    )
  }

  if (query.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (query.error) {
    const apiError = normalizeApiError(query.error)
    if (isNotFound(apiError)) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">사원 상세</h1>
          <p className="text-sm text-muted-foreground">사원 정보를 찾을 수 없습니다.</p>
        </div>
      )
    }
    if (isForbidden(apiError)) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">사원 상세</h1>
          <p className="text-sm text-muted-foreground">이 사원 정보를 조회할 권한이 없습니다.</p>
        </div>
      )
    }
    // not-found/forbidden이 아닌 실패는 위 useEffect가 토스트로 알렸으므로 화면은 빈 상태로만 표시한다.
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">사원 상세</h1>
        <p className="text-sm text-muted-foreground">사원 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!query.data) {
    return null
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      {/*
        EmployeeInfoView의 좌측 요약 카드가 이름/사번을 직접 표시해 <h1> 제목 바가 불필요해졌다.
        타 사원 조회이므로 viewerIsSelf={false}로 아이디(loginId)/파일 탭/활성 파일 섹션을
        숨겨 개인정보 노출을 막는다(본인 조회 페이지인 MyInfoPage와의 핵심 차이점).
      */}
      <EmployeeInfoView data={query.data} empId={parsedEmpId} viewerIsSelf={false} />
    </div>
  )
}
