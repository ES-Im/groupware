import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useFranchiseCreateMutation } from '../api/useFranchiseCreateMutation'
import {
  franchiseCreateSchema,
  type FranchiseCreateFormValues,
} from '../model/franchiseCreateSchema'

interface FranchiseCreateDialogProps {
  /** 다이얼로그 열림 상태(제어형, FranchiseListPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 가맹점 등록 다이얼로그(`FRANCHISE_CREATE`, F1603, ROADMAP(FRANCHISE) T2.2).
 *
 * MeetingRoomCreateDialog와 동형인 useZodForm/submitWithErrorMapping 표준 폼 패턴이다.
 * 담당자(managerEmpId, 선택)는 폼 Input이 아니라 EmployeePicker(단일 선택) 로컬 상태로 관리하고
 * 제출 시 `selected[0]?.empId`를 payload에 합성한다(EmployeePicker는 배열 selected/onChange
 * 계약이라 optional 단일 필드 어댑팅이 필요).
 *
 * 성공(201 {franchiseId}) 시 mutation이 목록을 invalidate하므로 이 컴포넌트는 성공 토스트 +
 * 다이얼로그 닫기만 담당하고 목록에 머문다(회의실 등록의 "생성 상세로 이동"과 달리 P2 이동 없음 —
 * 태스크 확정 사항). 검증 실패는 인라인 에러, 이메일 중복 등 서버 도메인 위반은
 * submitWithErrorMapping이 handleApiError(root 우선, 없으면 토스트)로 위임한다.
 */
export function FranchiseCreateDialog({ open, onOpenChange }: FranchiseCreateDialogProps) {
  const mutation = useFranchiseCreateMutation()
  const form = useZodForm(franchiseCreateSchema)
  const [selectedManager, setSelectedManager] = useState<EmployeePickerEmployee[]>([])

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다 폼·담당자 선택을 비우고, 닫힐 때도 다음 오픈에 이전 입력값/에러가 남지 않도록
  // 리셋한다(MeetingRoomCreateDialog와 동일 이유 — 제어형 다이얼로그는 언마운트되지 않는다).
  useEffect(() => {
    if (open) {
      reset({
        businessNumber: '',
        franchiseName: '',
        address: '',
        ownerName: '',
        contactNumber: '',
        contactEmail: '',
      })
    } else {
      reset()
    }
    setSelectedManager([])
  }, [open, reset])

  async function handleSubmit(values: FranchiseCreateFormValues) {
    await mutation.mutateAsync({ ...values, managerEmpId: selectedManager[0]?.empId })
    toast.success('가맹점을 등록했습니다')
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다
  // (MeetingRoomCreateDialog와 동일 이유 — 그 사이 닫히면 폼이 reset()되어 뒤늦게 도착하는
  // 등록 실패가 삼켜진다).
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>가맹점 등록</DialogTitle>
          <DialogDescription>
            새 가맹점의 사업자번호·기본 정보를 입력해 등록합니다. 담당자는 선택 사항입니다.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          {/* 섹션 1: 매장 기본 정보(Ubold 섹션형 폼 이식 — 주소검색/지도는 미보유로 제거). */}
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-sm font-medium">매장 기본 정보</p>
            <p className="text-xs text-muted-foreground">
              매장명·사업자번호·주소 등 프로필 정보를 입력합니다.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-create-business-number">
              사업자번호 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="franchise-create-business-number"
              placeholder="예: 123-45-67890"
              aria-invalid={!!errors.businessNumber}
              {...register('businessNumber')}
            />
            {errors.businessNumber && (
              <p role="alert" className="text-sm text-destructive">
                {errors.businessNumber.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-create-name">
              가맹점명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="franchise-create-name"
              placeholder="예: HARUON 강남점"
              aria-invalid={!!errors.franchiseName}
              {...register('franchiseName')}
            />
            {errors.franchiseName && (
              <p role="alert" className="text-sm text-destructive">
                {errors.franchiseName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-create-address">
              주소 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="franchise-create-address"
              placeholder="예: 서울 강남구 테헤란로 1"
              aria-invalid={!!errors.address}
              {...register('address')}
            />
            {errors.address && (
              <p role="alert" className="text-sm text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-create-owner-name">
              대표자명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="franchise-create-owner-name"
              placeholder="예: 홍길동"
              aria-invalid={!!errors.ownerName}
              {...register('ownerName')}
            />
            {errors.ownerName && (
              <p role="alert" className="text-sm text-destructive">
                {errors.ownerName.message}
              </p>
            )}
          </div>

          {/* 섹션 2: 운영 담당 정보(담당자·연락 수단). */}
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-sm font-medium">운영 담당 정보</p>
            <p className="text-xs text-muted-foreground">
              담당 사원과 연락 수단을 등록합니다. 담당자는 선택 사항입니다.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-create-contact-number">
              연락처 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="franchise-create-contact-number"
              placeholder="예: 010-1234-5678"
              aria-invalid={!!errors.contactNumber}
              {...register('contactNumber')}
            />
            {errors.contactNumber && (
              <p role="alert" className="text-sm text-destructive">
                {errors.contactNumber.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-create-contact-email">
              이메일 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="franchise-create-contact-email"
              type="email"
              placeholder="예: gangnam@haruon.com"
              aria-invalid={!!errors.contactEmail}
              {...register('contactEmail')}
            />
            {errors.contactEmail && (
              <p role="alert" className="text-sm text-destructive">
                {errors.contactEmail.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>담당자 (선택)</Label>
            <EmployeePicker
              selected={selectedManager}
              onChange={setSelectedManager}
              multiple={false}
            />
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
