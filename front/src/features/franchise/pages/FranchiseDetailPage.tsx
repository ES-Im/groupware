import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useFranchiseDetailQuery } from '../api/useFranchiseDetailQuery'
import { FranchiseBusinessStatusBadge } from '../components/FranchiseBusinessStatusBadge'
import { FranchiseManagerUpdateDialog } from '../components/FranchiseManagerUpdateDialog'
import { FranchiseMemoActions } from '../components/FranchiseMemoActions'
import { FranchisePageHeader } from '../components/FranchisePageHeader'
import { FranchiseStatusSelect } from '../components/FranchiseStatusSelect'
import { FranchiseUpdateDialog } from '../components/FranchiseUpdateDialog'

/**
 * P2 가맹점 상세 페이지(F1602 FRANCHISE_DETAIL, ROADMAP(FRANCHISE) T2.3).
 * /franchises/:franchiseId 라우트에 마운트된다(T1.2 배선 완료).
 *
 * 조회 실패 분기는 EmployeeDetailPage와 동일 패턴: not-found(404) → 전용 not-found 문구,
 * 그 외 → useEffect 1회성 토스트 + 실패 문구(렌더 중 side effect 방지).
 * `BusinessStatus`는 응답이 이미 한글 표시명 문자열이므로 코드 변환 없이 그대로 렌더한다.
 *
 * [매출 조회] 버튼은 `/franchise-sales?franchiseId={id}` 쿼리 파라미터로 프리필 이동한다 —
 * 이 파라미터명은 T2.3이 최초 확정하는 계약으로, P3(T3.2)가 useSearchParams로 그대로
 * 소비한다(새로고침/딥링크에도 프리필이 유지되도록 state 대신 쿼리를 쓴다).
 * mutation 배선(T2.4 완료): 기본정보 수정(F1604 — FranchiseUpdateDialog)·영업상태 변경(F1605 —
 * FranchiseStatusSelect)·담당자 변경(F1606 — FranchiseManagerUpdateDialog)·메모 수정/삭제
 * (F1607/F1608 — FranchiseMemoActions). 성공 시 각 mutation 훅이 상세·목록 캐시를 invalidate한다.
 */
export function FranchiseDetailPage() {
  const { franchiseId: franchiseIdParam } = useParams<{ franchiseId: string }>()
  const navigate = useNavigate()
  const [updateOpen, setUpdateOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)

  // route param은 신뢰 불가 입력이다(BoardEditPage·DepartmentDetailPage와 동일 가드): 순수 10진
  // 양의 정수 형식만 허용해 지수/16진수/음수 표기가 다른 가맹점으로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger =
    franchiseIdParam !== undefined && /^[1-9][0-9]*$/.test(franchiseIdParam)
  const franchiseId = isDecimalPositiveInteger ? Number(franchiseIdParam) : undefined

  const query = useFranchiseDetailQuery(franchiseId)

  // not-found는 아래에서 전용 UX로 렌더하므로, 그 외 실패만 토스트로 알린다.
  useEffect(() => {
    if (!query.error) {
      return
    }
    const apiError = normalizeApiError(query.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [query.error])

  if (franchiseId === undefined) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">가맹점 상세</h1>
        <p className="text-sm text-muted-foreground">잘못된 가맹점 식별자입니다.</p>
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
    if (isNotFound(normalizeApiError(query.error))) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">가맹점 상세</h1>
          <p className="text-sm text-muted-foreground">가맹점을 찾을 수 없습니다.</p>
        </div>
      )
    }
    // not-found가 아닌 실패는 위 useEffect가 토스트로 알렸으므로 화면은 안내 문구만 표시한다.
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">가맹점 상세</h1>
        <p className="text-sm text-muted-foreground">가맹점 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!query.data) {
    return null
  }

  const franchise = query.data

  // 정보 타일 그리드용 필드(Ubold InfoField 이식). 영업상태는 헤더 뱃지, 주소는 헤더 부제,
  // 메모는 하단 메모 섹션으로 각각 분리 렌더하므로 타일에서는 제외한다.
  const fields: Array<{ label: string; value: string }> = [
    { label: '사업자번호', value: franchise.businessNumber },
    { label: '대표자명', value: franchise.ownerName },
    { label: '담당자', value: franchise.managerEmpName || '미지정' },
    { label: '연락처', value: franchise.contactNumber },
    { label: '이메일', value: franchise.contactEmail },
  ]

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <FranchisePageHeader
        title="가맹점 상세"
        description="매장 프로필과 운영 정보를 확인하고 조정합니다."
      />

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{franchise.name}</CardTitle>
                <FranchiseBusinessStatusBadge status={franchise.BusinessStatus} />
              </div>
              <p className="text-sm text-muted-foreground">{franchise.address}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FranchiseStatusSelect
                franchiseId={franchise.id}
                currentStatusLabel={franchise.BusinessStatus}
              />
              <Button type="button" variant="outline" onClick={() => setUpdateOpen(true)}>
                기본정보 수정
              </Button>
              <Button type="button" variant="outline" onClick={() => setManagerOpen(true)}>
                담당자 변경
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/franchise-sales?franchiseId=${franchise.id}`)}
              >
                매출 조회
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <div key={field.label} className="rounded-lg border border-border bg-muted/40 p-3">
                <dt className="text-xs text-muted-foreground">{field.label}</dt>
                <dd className="mt-1 font-medium break-words">{field.value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t pt-4">
            <FranchiseMemoActions franchiseId={franchise.id} currentMemo={franchise.memo} />
          </div>
        </CardContent>
      </Card>

      <FranchiseUpdateDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        franchiseId={franchise.id}
        detail={franchise}
      />

      <FranchiseManagerUpdateDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        franchiseId={franchise.id}
        currentManagerEmpId={franchise.managerEmpId}
      />
    </div>
  )
}
