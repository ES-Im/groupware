import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { GraduationCap, Mail, MapPin } from 'lucide-react'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useFranchiseDetailQuery } from '../api/useFranchiseDetailQuery'
import { FranchiseBusinessStatusBadge } from '../components/FranchiseBusinessStatusBadge'
import { FranchiseManagerUpdateDialog } from '../components/FranchiseManagerUpdateDialog'
import { FranchiseMemoActions } from '../components/FranchiseMemoActions'
import { FranchisePageHeader } from '../components/FranchisePageHeader'
import { FranchiseSalesOverview } from '../components/FranchiseSalesOverview'
import { FranchiseStatusSelect } from '../components/FranchiseStatusSelect'
import { FranchiseUpdateDialog } from '../components/FranchiseUpdateDialog'

/**
 * 주소 텍스트로 카카오맵 장소 검색 결과를 새 탭에서 연다(`https://map.kakao.com/link/search/{keyword}`
 * — 카카오맵 공개 검색 딥링크 규격). 가맹점 도메인 모델에는 좌표 필드가 없어(주소 문자열만 보유)
 * 실제 좌표 임베드 지도 대신 이 방식을 쓰기로 사용자와 합의했다(지오코딩 API 신규 도입 없음).
 */
function buildKakaoMapSearchUrl(address: string): string {
  return `https://map.kakao.com/link/search/${encodeURIComponent(address)}`
}

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
 *
 * UI/UX 개편(사용자 요청, 2026-07-11): 상세 카드 하단에 위치 카드(주소 + 카카오맵 새 탭 링크,
 * buildKakaoMapSearchUrl)를 추가하고, 매출 요약(FranchiseSalesOverview — P3 FranchiseSalesPage와
 * 공용 소비, 연/월/일 탭+차트)을 별도 카드로 임베드했다. 교육 신청 정보·문의 정보는 카드 2개로
 * 분리했으나 실 데이터를 표시하지 않는다 — 문의 목록 조회(FRANCHISE_INQUIRY_LIST)에는 franchiseId
 * 필터 파라미터가 없고, 교육 신청자 조회(FRANCHISE_EDUCATION_APPLICANTS)는 educationId 단위 조회만
 * 있어 "이 가맹점이 신청한 교육" 역조회 자체가 계약상 불가능하다(사용자 확정 — 각 도메인
 * 목록/캘린더 페이지로 이동하는 바로가기 카드로 대체, 없는 API를 우회 구현하지 않는다).
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
            <h3 className="mb-2 text-sm font-medium">메모</h3>
            <FranchiseMemoActions franchiseId={franchise.id} currentMemo={franchise.memo} />
          </div>

          <div className="border-t pt-4">
            <h3 className="mb-2 text-sm font-medium">위치</h3>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{franchise.address}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    buildKakaoMapSearchUrl(franchise.address),
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
              >
                지도에서 보기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">매출 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <FranchiseSalesOverview franchiseId={franchise.id} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-muted-foreground" />
              교육 신청 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              이 가맹점의 교육 신청 내역은 가맹점 교육 캘린더에서 세션별로 확인할 수 있습니다.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-auto self-start"
              onClick={() => navigate('/franchise-educations')}
            >
              가맹점 교육으로 이동
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-muted-foreground" />
              문의 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              이 가맹점 관련 문의는 가맹점 문의 목록에서 검색해 확인할 수 있습니다.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-auto self-start"
              onClick={() => navigate('/franchise-inquiries')}
            >
              가맹점 문의로 이동
            </Button>
          </CardContent>
        </Card>
      </div>

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
