import { useEffect } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { useMeQuery } from '../api/useMeQuery'
import { EmployeeInfoView } from '../components/EmployeeInfoView'

/**
 * 내 정보 조회 페이지(본인 상세, F003 RETRIEVE_ME_INFO, ROADMAP T2.3).
 * useMeQuery(T1.3, 이미 완성)와 EmployeeInfoView(T2.2에서 뽑아낸 공유 표시 컴포넌트)를 그대로
 * 재사용하는 얇은 컨테이너다 — 신규 API/훅을 만들지 않는다(/api/auth/me 미존재, RETRIEVE_ME_INFO만 사용).
 *
 * 조회 실패 시 에러 처리는 EmployeeDetailPage(T2.2)와 동일한 컨벤션을 따른다: 렌더 중 side
 * effect를 피하기 위해 useEffect에서 1회성 토스트로 알린다. 본인 조회이므로 not-found/forbidden
 * 분기는 의미가 없어(항상 본인 계정) 그 외 실패와 동일하게 일반 오류로 취급한다.
 *
 * "수정" 버튼은 `/me/edit`로 향하는 Link만 노출한다 — 해당 라우트/페이지는 M3(T3.1) 몫이라
 * 이번 태스크에서 구현하지 않는다(클릭 시 아직 매칭 라우트가 없어도 정상).
 */
export function MyInfoPage() {
  const query = useMeQuery()

  useEffect(() => {
    if (!query.error) {
      return
    }
    toast.error(normalizeApiError(query.error).message)
  }, [query.error])

  if (query.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (query.error) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">내 정보</h1>
        <p className="text-sm text-muted-foreground">내 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!query.data) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">내 정보</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/me/edit">수정</Link>
        </Button>
      </div>
      {/*
        empId를 전달하지 않는다 — RETRIEVE_ME_INFO 응답에 numeric empId가 없다(§리스크7 실측 확정,
        empBasicInfo.empNo는 문자열). EmployeeInfoView의 BlobAvatar는 empId 미확정 시 이니셜
        폴백으로 자연스럽게 전환된다.
        //todo: 본인 preview용 numeric empId 소스 확정(서버가 me 전용 preview 기능 제공 or me
        응답에 empId 추가) 필요
      */}
      <EmployeeInfoView data={query.data} />
    </div>
  )
}
