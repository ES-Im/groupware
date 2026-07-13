import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import { LineChart, MapPin, SquarePen, Store, User } from 'lucide-react'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useFranchiseDetailQuery } from '../api/useFranchiseDetailQuery'
import { FranchiseBackLink } from '../components/FranchiseBackLink'
import { FranchiseBusinessStatusBadge } from '../components/FranchiseBusinessStatusBadge'
import { FranchiseDetailHero, FranchiseHeroMetaItem } from '../components/FranchiseDetailHero'
import { FranchiseInfoList, type FranchiseInfoItem } from '../components/FranchiseInfoList'
import { FranchiseManagerUpdateDialog } from '../components/FranchiseManagerUpdateDialog'
import { FranchiseMemoActions } from '../components/FranchiseMemoActions'
import { FranchiseSalesOverview } from '../components/FranchiseSalesOverview'
import { FranchiseStatusSelect } from '../components/FranchiseStatusSelect'
import { FranchiseUpdateDialog } from '../components/FranchiseUpdateDialog'

/**
 * P2 가맹점 상세 페이지(F1602 FRANCHISE_DETAIL, ROADMAP(FRANCHISE) T2.3).
 * /franchises/:franchiseId 라우트에 마운트된다.
 *
 * 조회 실패 분기는 EmployeeDetailPage와 동일 패턴: not-found(404) → 전용 not-found 문구,
 * 그 외 → useEffect 1회성 토스트 + 실패 문구(렌더 중 side effect 방지).
 * `BusinessStatus`는 응답이 이미 한글 표시명 문자열이므로 코드 변환 없이 그대로 렌더한다.
 *
 * UI 개편(2026-07-13, 목업 기준): 매출 조회를 **별도 페이지(/franchise-sales) 대신 상세 안에 통합**한다
 * (목업 매출 현황 카드 — FranchiseSalesOverview 임베드, 연/월/일 세그먼트 + 막대 + 이번달/전월/YTD).
 * 목업의 "교육 신청 내역·최근 문의" mini-list는 가맹점별 역조회 API가 없어(문의 목록에 franchiseId
 * 필터 없음, 교육 신청자는 educationId 단위 조회만 존재) 데이터를 채울 수 없어 제거한다(정책 A —
 * 계약에 없는 데이터는 만들지 않음). 화면은 헤더 → 매출 현황+기본정보 → 담당자 메모로 구성한다.
 *
 * mutation 배선(T2.4): 기본정보 수정(FranchiseUpdateDialog)·영업상태 변경(FranchiseStatusSelect)·
 * 담당자 변경(FranchiseManagerUpdateDialog)·메모 수정/삭제(FranchiseMemoActions). 성공 시 각
 * mutation 훅이 상세·목록 캐시를 invalidate한다.
 */
export function FranchiseDetailPage() {
  const { franchiseId: franchiseIdParam } = useParams<{ franchiseId: string }>()
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

  // 기본정보 infolist 항목(목업 `.infolist`). 영업상태는 hero 상태 pill, 주소는 hero meta로 각각
  // 분리 렌더하고, 메모는 하단 메모 카드로 분리하므로 여기서는 제외한다.
  const infoItems: FranchiseInfoItem[] = [
    { label: '사업자번호', value: franchise.businessNumber, mono: true },
    { label: '대표자명', value: franchise.ownerName },
    { label: '담당자', value: franchise.managerEmpName || '미지정' },
    { label: '연락처', value: franchise.contactNumber, mono: true },
    { label: '이메일', value: franchise.contactEmail },
    { label: '주소', value: franchise.address },
  ]

  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6 lg:p-8 lg:min-h-full">
      <FranchiseBackLink to="/franchises">가맹점 목록</FranchiseBackLink>

      {/* 헤더 hero: store 아이콘 타일 + 이름 + 상태 pill + meta + 우측 액션(상태변경/정보수정/담당자변경). */}
      <Card>
        <CardContent>
          <FranchiseDetailHero
            icon={<Store aria-hidden />}
            title={franchise.name}
            status={<FranchiseBusinessStatusBadge status={franchise.BusinessStatus} />}
            meta={
              <>
                <FranchiseHeroMetaItem icon={<MapPin aria-hidden />}>
                  {franchise.address}
                </FranchiseHeroMetaItem>
                <FranchiseHeroMetaItem icon={<User aria-hidden />}>
                  대표 {franchise.ownerName}
                </FranchiseHeroMetaItem>
                <FranchiseHeroMetaItem icon={<User aria-hidden />}>
                  담당 {franchise.managerEmpName || '미지정'}
                </FranchiseHeroMetaItem>
              </>
            }
            actions={
              <>
                <FranchiseStatusSelect
                  franchiseId={franchise.id}
                  currentStatusLabel={franchise.BusinessStatus}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setUpdateOpen(true)}>
                  기본정보 수정
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setManagerOpen(true)}>
                  담당자 변경
                </Button>
              </>
            }
          />
        </CardContent>
      </Card>

      {/* 본문 grid-cd: 좌 넓게 매출 현황(상세 안에 통합), 우 좁게 기본정보 infolist. */}
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <LineChart className="size-4 text-primary" aria-hidden />
              매출 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FranchiseSalesOverview franchiseId={franchise.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Store className="size-4 text-primary" aria-hidden />
              기본정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FranchiseInfoList items={infoItems} />
          </CardContent>
        </Card>
      </div>

      {/* 담당자 메모 카드. */}
      <Card className="lg:flex-1">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <SquarePen className="size-4 text-primary" aria-hidden />
            담당자 메모
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FranchiseMemoActions franchiseId={franchise.id} currentMemo={franchise.memo} />
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
