import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import dayjs from 'dayjs'
import { Building2, Link2, MapPin, Pencil, Phone, User } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { normalizeApiError } from '@/shared/lib/apiError'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useCompanyInfoQuery } from '../api/useCompanyInfoQuery'
import { useCompanyRegisterMutation } from '../api/useCompanyRegisterMutation'
import { CompanyContactEditDialog } from '../components/CompanyContactEditDialog'
import { CompanyHomePageEditDialog } from '../components/CompanyHomePageEditDialog'
import { CompanyInfoEditDialog } from '../components/CompanyInfoEditDialog'
import { companyRegisterSchema, type CompanyRegisterFormValues } from '../model/companyRegisterSchema'

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
      <PageShell>
        <p className="text-sm text-muted-foreground">회사 정보를 불러오는 중...</p>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell>
        <p className="text-sm text-muted-foreground">회사 정보를 불러오지 못했습니다.</p>
      </PageShell>
    )
  }

  if (data === null) {
    return (
      <PageShell>
        {isAdmin ? (
          <CompanyRegisterCard onRegistered={refetch} />
        ) : (
          <p className="text-sm text-muted-foreground">등록된 회사 정보가 없습니다.</p>
        )}
      </PageShell>
    )
  }

  const initial = data.companyName.trim().charAt(0) || '회'

  return (
    <PageShell>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            {initial}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight">{data.companyName}</h2>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden />
                <span className="truncate">{data.location}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User className="size-3.5" aria-hidden />
                대표 {data.ownerName}
              </span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">최근 수정</p>
            <p className="mt-0.5 text-sm font-medium tabular-nums">
              {dayjs(data.editedAt).format('YYYY-MM-DD')}
            </p>
          </div>
        </CardContent>
      </Card>

      <CompanySection
        icon={Building2}
        title="기본정보"
        onEdit={isAdmin ? () => setIsInfoEditDialogOpen(true) : undefined}
      >
        <InfoRow label="회사명" value={data.companyName} />
        <InfoRow label="위치" value={data.location} />
        <InfoRow label="대표자명" value={data.ownerName} />
      </CompanySection>

      <CompanySection
        icon={Phone}
        title="대표 연락처"
        onEdit={isAdmin ? () => setIsContactEditDialogOpen(true) : undefined}
      >
        <InfoRow label="대표 이메일" value={data.presentedEmail} />
        <InfoRow label="대표 전화" value={data.presentedExternalNo} />
      </CompanySection>

      <CompanySection
        icon={Link2}
        title="홈페이지"
        onEdit={isAdmin ? () => setIsHomePageEditDialogOpen(true) : undefined}
      >
        <InfoRow label="홈페이지 URL" value={data.homePageURL} />
      </CompanySection>

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
    </PageShell>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">회사 관리</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          회사 기본정보·연락처·홈페이지 정보를 관리합니다.
        </p>
      </header>
      {children}
    </div>
  )
}

function CompanySection({
  icon: Icon,
  title,
  onEdit,
  children,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  title: string
  onEdit?: () => void
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
          {title}
        </CardTitle>
        {onEdit && (
          <CardAction>
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Pencil aria-hidden />
              편집
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="divide-y divide-border">{children}</CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-center gap-3 py-3 text-sm sm:grid-cols-[9rem_1fr]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium break-all text-foreground">{value}</span>
    </div>
  )
}

interface CompanyRegisterCardProps {
  onRegistered: () => Promise<unknown>
}

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
