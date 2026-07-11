import { useEffect } from 'react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
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
import type { FranchiseUpdatePayload } from '../api/updateFranchise'
import { useFranchiseUpdateMutation } from '../api/useFranchiseUpdateMutation'
import type { FranchiseDetail } from '../model/franchise'
import { franchiseUpdateSchema, type FranchiseUpdateFormValues } from '../model/franchiseUpdateSchema'

interface FranchiseUpdateDialogProps {
  /** 다이얼로그 열림 상태(제어형, FranchiseDetailPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  franchiseId: number
  /** 프리필 기준값(현재 가맹점 상세, T2.3 useFranchiseDetailQuery 재사용). */
  detail: FranchiseDetail
}

/**
 * 변경된 필드만 담아 PATCH 페이로드를 구성한다(MeetingRoomUpdateDialog의 buildUpdatePayload와
 * 동일 패턴). ⚠️ 폼/요청 키는 `franchiseName`이지만 조회 응답(FranchiseDetail)의 키는 `name`이라
 * diff 비교 대상이 다르다(계약 실측 — 임의 통일 금지). 아무 필드도 바뀌지 않으면 빈 payload가
 * 되고, 그대로 제출되어 서버의 "변경값 없음" 거부가 submitWithErrorMapping을 통해 노출된다.
 */
function buildUpdatePayload(
  values: FranchiseUpdateFormValues,
  detail: FranchiseDetail,
): FranchiseUpdatePayload {
  const payload: FranchiseUpdatePayload = {}
  if (values.businessNumber !== undefined && values.businessNumber !== detail.businessNumber) {
    payload.businessNumber = values.businessNumber
  }
  if (values.franchiseName !== undefined && values.franchiseName !== detail.name) {
    payload.franchiseName = values.franchiseName
  }
  if (values.address !== undefined && values.address !== detail.address) {
    payload.address = values.address
  }
  if (values.ownerName !== undefined && values.ownerName !== detail.ownerName) {
    payload.ownerName = values.ownerName
  }
  if (values.contactNumber !== undefined && values.contactNumber !== detail.contactNumber) {
    payload.contactNumber = values.contactNumber
  }
  if (values.contactEmail !== undefined && values.contactEmail !== detail.contactEmail) {
    payload.contactEmail = values.contactEmail
  }
  return payload
}

/** 폼 필드 렌더 메타(전 필드 동형 텍스트 Input이라 배열로 돌린다). */
const FIELDS: Array<{ name: keyof FranchiseUpdateFormValues; label: string; placeholder?: string }> = [
  { name: 'businessNumber', label: '사업자번호', placeholder: '000-00-00000' },
  { name: 'franchiseName', label: '가맹점명' },
  { name: 'address', label: '주소' },
  { name: 'ownerName', label: '대표자명' },
  { name: 'contactNumber', label: '연락처' },
  { name: 'contactEmail', label: '이메일' },
]

/**
 * 가맹점 기본정보 수정 다이얼로그(F1604, `FRANCHISE_UPDATE`, ROADMAP(FRANCHISE) T2.4-a).
 *
 * 전 필드 부분 수정(optional) — 열릴 때 현재 상세값으로 프리필해 사용자가 바꾸고 싶은 필드만
 * 고치게 하고, 제출 시 buildUpdatePayload로 변경된 필드만 골라 보낸다(MeetingRoomUpdateDialog
 * 동형). 성공(204) 시 useFranchiseUpdateMutation이 상세/목록을 invalidate하므로 이 컴포넌트는
 * 성공 토스트 + 다이얼로그 닫기만 담당한다. 서버 위반(이메일 중복, 변경값 없음 등)은
 * submitWithErrorMapping → handleApiError가 폼 루트 에러/토스트로 매핑한다.
 */
export function FranchiseUpdateDialog({ open, onOpenChange, franchiseId, detail }: FranchiseUpdateDialogProps) {
  const mutation = useFranchiseUpdateMutation()
  const form = useZodForm(franchiseUpdateSchema)

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다 현재 상세값으로 프리필하고, 닫힐 때는 다음 오픈에 이전 입력값/에러가 남지 않도록
  // 리셋한다(MeetingRoomUpdateDialog와 동일 이유 — 제어형 다이얼로그는 언마운트되지 않는다).
  useEffect(() => {
    if (open) {
      reset({
        businessNumber: detail.businessNumber,
        franchiseName: detail.name,
        address: detail.address,
        ownerName: detail.ownerName,
        contactNumber: detail.contactNumber,
        contactEmail: detail.contactEmail,
      })
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset])

  async function handleSubmit(values: FranchiseUpdateFormValues) {
    const payload = buildUpdatePayload(values, detail)
    await mutation.mutateAsync({ franchiseId, payload })
    toast.success('가맹점 기본정보를 수정했습니다')
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다
  // (MeetingRoomUpdateDialog와 동일 이유 — 그 사이 닫히면 폼이 reset()되어 뒤늦게 도착하는
  // 수정 실패가 삼켜진다).
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>가맹점 기본정보 수정</DialogTitle>
          <DialogDescription>바꾸고 싶은 항목만 고쳐 저장합니다. 변경한 값이 없으면 저장할 수 없습니다.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submitWithErrorMapping(form, handleSubmit)} className="flex flex-col gap-4">
          {FIELDS.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <Label htmlFor={`franchise-update-${field.name}`}>{field.label}</Label>
              <Input
                id={`franchise-update-${field.name}`}
                placeholder={field.placeholder}
                aria-invalid={!!errors[field.name]}
                {...register(field.name)}
              />
              {errors[field.name] && (
                <p role="alert" className="text-sm text-destructive">
                  {errors[field.name]?.message}
                </p>
              )}
            </div>
          ))}

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
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
