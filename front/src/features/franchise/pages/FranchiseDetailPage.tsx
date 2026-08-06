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

export function FranchiseDetailPage() {
  const { franchiseId: franchiseIdParam } = useParams<{ franchiseId: string }>()
  const [updateOpen, setUpdateOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)

  const isDecimalPositiveInteger =
    franchiseIdParam !== undefined && /^[1-9][0-9]*$/.test(franchiseIdParam)
  const franchiseId = isDecimalPositiveInteger ? Number(franchiseIdParam) : undefined

  const query = useFranchiseDetailQuery(franchiseId)

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
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">가맹점 상세</h1>
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
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">가맹점 상세</h1>
          <p className="text-sm text-muted-foreground">가맹점을 찾을 수 없습니다.</p>
        </div>
      )
    }
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">가맹점 상세</h1>
        <p className="text-sm text-muted-foreground">가맹점 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!query.data) {
    return null
  }

  const franchise = query.data

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

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">가맹점 상세</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          가맹점 기본정보와 매출 현황을 확인합니다
        </p>
      </div>

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

      <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_360px]">
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

      <Card className="lg:flex-1">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <SquarePen className="size-4 text-primary" aria-hidden />
            담당자 메모
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {franchise.memo ? (
            <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">{franchise.memo}</p>
          ) : (
            <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              등록된 메모가 없습니다.
            </p>
          )}
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
