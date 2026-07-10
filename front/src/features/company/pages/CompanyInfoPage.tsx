import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { normalizeApiError } from '@/shared/lib/apiError'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useCompanyInfoQuery } from '../api/useCompanyInfoQuery'
import { useCompanyRegisterMutation } from '../api/useCompanyRegisterMutation'
import { CompanyContactEditDialog } from '../components/CompanyContactEditDialog'
import { CompanyHomePageEditDialog } from '../components/CompanyHomePageEditDialog'
import { CompanyInfoEditDialog } from '../components/CompanyInfoEditDialog'
import { companyRegisterSchema, type CompanyRegisterFormValues } from '../model/companyRegisterSchema'

/**
 * 회사 정보 페이지(F1401, ROADMAP-COMPANY.md T1.2/T2.2/T3.2-a/T3.2-b/T3.2-c).
 *
 * useCompanyInfoQuery는 404를 "미등록" 상태(data===null)로 정규화하므로, 여기서는
 * isLoading/query.error(진짜 조회 실패)/data===null(미등록)/data(등록됨) 4가지로만 분기한다.
 * 미등록+ADMIN이면 CompanyRegisterCard(등록 폼)를 렌더한다 — 등록 성공 시 mutation 훅이 이미
 * companyKeys.all을 invalidate하므로 이 쿼리가 자동 재조회되어 카드 뷰로 자연 전환된다.
 *
 * 등록됨 카드는 기본정보/연락처/홈페이지 3개 섹션으로 나뉜다(T3.2-a/b/c가 각 섹션에 편집 다이얼로그를
 * 배선). T3.2-c(이 태스크)로 홈페이지 섹션까지 연결되어 3개 섹션 모두 편집 가능해진다.
 */
export function CompanyInfoPage() {
  const roles = useAuthStore((state) => state.roles)
  const isAdmin = hasRequiredRole(roles, 'ADMIN')

  const { data, isLoading, error, refetch } = useCompanyInfoQuery()
  const [isInfoEditDialogOpen, setIsInfoEditDialogOpen] = useState(false)
  const [isContactEditDialogOpen, setIsContactEditDialogOpen] = useState(false)
  const [isHomePageEditDialogOpen, setIsHomePageEditDialogOpen] = useState(false)

  useEffect(() => {
    if (!error) {
      return
    }
    toast.error(normalizeApiError(error).message)
  }, [error])

  if (isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-6 text-xl font-semibold tracking-tight">회사 정보</h1>
        <p className="text-sm text-muted-foreground">회사 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-6 text-xl font-semibold tracking-tight">회사 정보</h1>
        <p className="text-sm text-muted-foreground">회사 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (data === null) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-6 text-xl font-semibold tracking-tight">회사 정보</h1>
        {isAdmin ? (
          <CompanyRegisterCard onRegistered={refetch} />
        ) : (
          <p className="text-sm text-muted-foreground">등록된 회사 정보가 없습니다.</p>
        )}
      </div>
    )
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">회사 정보</h1>
      <Card>
        <CardHeader>
          <CardTitle>{data.companyName}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">기본정보</h2>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInfoEditDialogOpen(true)}
                >
                  편집
                </Button>
              )}
            </div>
            <InfoRow label="회사명" value={data.companyName} />
            <InfoRow label="위치" value={data.location} />
            <InfoRow label="대표자명" value={data.ownerName} />
          </section>

          <section className="grid gap-3 border-t pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">연락처</h2>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsContactEditDialogOpen(true)}
                >
                  편집
                </Button>
              )}
            </div>
            <InfoRow label="대표 이메일" value={data.presentedEmail} />
            <InfoRow label="대표 연락처" value={data.presentedExternalNo} />
          </section>

          <section className="grid gap-3 border-t pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">홈페이지</h2>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsHomePageEditDialogOpen(true)}
                >
                  편집
                </Button>
              )}
            </div>
            <InfoRow label="홈페이지 URL" value={data.homePageURL} />
          </section>

          <InfoRow
            label="최종 수정일시"
            value={dayjs(data.editedAt).format('YYYY-MM-DD HH:mm')}
          />
        </CardContent>
      </Card>

      <CompanyInfoEditDialog
        open={isInfoEditDialogOpen}
        onOpenChange={setIsInfoEditDialogOpen}
        currentCompanyName={data.companyName}
        currentLocation={data.location}
        currentOwnerName={data.ownerName}
      />

      <CompanyContactEditDialog
        open={isContactEditDialogOpen}
        onOpenChange={setIsContactEditDialogOpen}
        currentPresentedEmail={data.presentedEmail}
        currentPresentedExternalNo={data.presentedExternalNo}
      />

      <CompanyHomePageEditDialog
        open={isHomePageEditDialogOpen}
        onOpenChange={setIsHomePageEditDialogOpen}
        currentHomePageURL={data.homePageURL}
      />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}

interface CompanyRegisterCardProps {
  /** 등록 성공 시(mutation 훅이 이미 invalidate 처리) 및 COMPANY_002(이미 등록됨) 실패 시 상태
   * 동기화를 위해 호출하는 재조회 함수. CompanyInfoPage의 useCompanyInfoQuery().refetch를 그대로 받는다. */
  onRegistered: () => Promise<unknown>
}

/**
 * 회사 정보 최초 등록 폼 카드(`COMPANY_REGISTER`, ROADMAP-COMPANY.md T2.2, F1402).
 *
 * RegisterDepartmentDialog와 동일한 useZodForm+submitWithErrorMapping 표준 폼 패턴을 그대로
 * 이식한다(Dialog 대신 Card 안에 인라인으로 배치). COMPANY_002(이미 등록된 회사 정보 존재, 400 —
 * ROADMAP §3 확정대로 409가 아니다)만 handleApiError 위임 전에 가로채 전용 안내 토스트를 띄우고
 * 재조회한다(동시 등록으로 데이터가 이미 채워졌다면 상위 쿼리가 갱신되어 카드 뷰로 자연 전환된다).
 * 그 외 에러(VALIDATION_ERROR 등)는 submitWithErrorMapping의 기본 handleApiError 경로로 위임한다.
 */
function CompanyRegisterCard({ onRegistered }: CompanyRegisterCardProps) {
  const mutation = useCompanyRegisterMutation()
  const form = useZodForm(companyRegisterSchema, {
    defaultValues: {
      companyName: '',
      location: '',
      presentedEmail: '',
      presentedExternalNo: '',
      ownerName: '',
      homePageURL: '',
    },
  })
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  async function handleSubmit(values: CompanyRegisterFormValues) {
    try {
      await mutation.mutateAsync(values)
    } catch (submitError) {
      if (normalizeApiError(submitError).code === 'COMPANY_002') {
        toast.error('이미 등록된 회사 정보가 있습니다')
        await onRegistered()
        return
      }
      throw submitError
    }
    toast.success('회사 정보를 등록했습니다')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>등록된 회사 정보가 없습니다</CardTitle>
        <CardDescription>회사 정보를 입력해 최초 등록합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-name">
              회사명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-name"
              placeholder="회사명을 입력해주세요"
              maxLength={50}
              aria-invalid={!!errors.companyName}
              {...register('companyName')}
            />
            {errors.companyName && (
              <p role="alert" className="text-sm text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-location">
              위치 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-location"
              placeholder="회사 위치를 입력해주세요"
              maxLength={200}
              aria-invalid={!!errors.location}
              {...register('location')}
            />
            {errors.location && (
              <p role="alert" className="text-sm text-destructive">
                {errors.location.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-email">
              대표 이메일 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-email"
              type="email"
              placeholder="company@example.com"
              maxLength={150}
              aria-invalid={!!errors.presentedEmail}
              {...register('presentedEmail')}
            />
            {errors.presentedEmail && (
              <p role="alert" className="text-sm text-destructive">
                {errors.presentedEmail.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-external-no">
              대표 연락처 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-external-no"
              placeholder="02-1234-5678"
              maxLength={20}
              aria-invalid={!!errors.presentedExternalNo}
              {...register('presentedExternalNo')}
            />
            {errors.presentedExternalNo && (
              <p role="alert" className="text-sm text-destructive">
                {errors.presentedExternalNo.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-owner-name">
              대표자명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-owner-name"
              placeholder="대표자명을 입력해주세요"
              maxLength={20}
              aria-invalid={!!errors.ownerName}
              {...register('ownerName')}
            />
            {errors.ownerName && (
              <p role="alert" className="text-sm text-destructive">
                {errors.ownerName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-homepage-url">
              홈페이지 URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-homepage-url"
              placeholder="https://example.com"
              maxLength={200}
              aria-invalid={!!errors.homePageURL}
              {...register('homePageURL')}
            />
            {errors.homePageURL && (
              <p role="alert" className="text-sm text-destructive">
                {errors.homePageURL.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-fit">
            회사 정보 등록
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
