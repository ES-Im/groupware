import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { FranchisePicker, type FranchisePickerSelection } from '@/shared/components/FranchisePicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { FranchiseSalesOverview } from '../components/FranchiseSalesOverview'
import { FranchisePageHeader } from '../components/FranchisePageHeader'
import { useFranchiseDetailQuery } from '../api/useFranchiseDetailQuery'

/**
 * P3 가맹점 매출 조회 페이지(F1624~F1626, ROADMAP(FRANCHISE) T3.2).
 * /franchise-sales 라우트에 마운트된다(T1.2 배선 완료).
 *
 * 가맹점 선택은 FranchisePicker(제어형, T1.3 shared 승격본)를 소비하고, T2.3이 확정한 프리필
 * 계약 `/franchise-sales?franchiseId={id}`를 useSearchParams로 읽는다. 쿼리에는 id만 있으므로
 * FranchisePicker의 selected({id,name})를 채우기 위해 useFranchiseDetailQuery로 name을 보강한다.
 * 프리필은 최초 1회만 적용한다(ref 가드) — 이후 사용자의 선택/해제를 덮어쓰지 않는다.
 * 프리필 상세 조회 실패는 FranchiseDetailPage와 동형의 useEffect 1회성 토스트로 알리고,
 * 페이지는 수동 선택이 가능한 상태로 유지한다(전용 실패 화면 없음).
 *
 * 연/월/일 탭 전환·차트·KPI 렌더는 FranchiseSalesOverview(가맹점 상세 페이지와 공용 소비)가 담당한다.
 * 스타일링은 최소 구성(이후 adapt-ui 단계 몫).
 */
export function FranchiseSalesPage() {
  const [searchParams] = useSearchParams()

  // 쿼리 파라미터는 신뢰 불가 입력이다(FranchiseDetailPage의 route param 가드와 동일): 순수
  // 10진 양의 정수 형식만 프리필 대상으로 인정한다. 무효 값이면 프리필 없이 수동 선택만 허용.
  const prefillParam = searchParams.get('franchiseId')
  const isPrefillValid = prefillParam !== null && /^[1-9][0-9]*$/.test(prefillParam)
  const prefillId = isPrefillValid ? Number(prefillParam) : undefined

  const [selected, setSelected] = useState<FranchisePickerSelection | null>(null)

  const prefillQuery = useFranchiseDetailQuery(prefillId)

  // 프리필 1회 적용 가드: 상세 응답 도착 전에 사용자가 직접 선택했거나 이미 적용된 뒤라면
  // 늦게 도착한 응답이 선택을 덮어쓰지 않는다.
  const prefillDoneRef = useRef(false)
  useEffect(() => {
    if (prefillDoneRef.current || !prefillQuery.data) {
      return
    }
    prefillDoneRef.current = true
    setSelected((current) =>
      current ?? { id: prefillQuery.data.id, name: prefillQuery.data.name },
    )
  }, [prefillQuery.data])

  // 프리필 상세 조회 실패 알림(FranchiseDetailPage 동형: not-found 분기 + 1회성 토스트).
  useEffect(() => {
    if (!prefillQuery.error) {
      return
    }
    const apiError = normalizeApiError(prefillQuery.error)
    toast.error(
      isNotFound(apiError) ? '매출을 조회할 가맹점을 찾을 수 없습니다.' : apiError.message,
    )
  }, [prefillQuery.error])

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <FranchisePageHeader
        title="가맹점 매출 조회"
        description="가맹점을 선택해 연·월·일 단위 매출 추이를 확인합니다."
      />

      <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">가맹점 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <FranchisePicker selected={selected} onChange={setSelected} />
          </CardContent>
        </Card>

        <section aria-label="매출 데이터" className="space-y-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground">
              가맹점을 선택하면 매출을 조회할 수 있습니다.
            </p>
          ) : (
            <FranchiseSalesOverview franchiseId={selected.id} />
          )}
        </section>
      </div>
    </div>
  )
}
