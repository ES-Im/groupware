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
  open: boolean
  onOpenChange: (open: boolean) => void
  franchiseId: number
  detail: FranchiseDetail
}

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

const FIELDS: Array<{ name: keyof FranchiseUpdateFormValues; label: string; placeholder?: string }> = [
  { name: 'businessNumber', label: '사업자번호', placeholder: '1234567890' },
  { name: 'franchiseName', label: '가맹점명' },
  { name: 'address', label: '주소' },
  { name: 'ownerName', label: '대표자명' },
  { name: 'contactNumber', label: '연락처' },
  { name: 'contactEmail', label: '이메일' },
]

export function FranchiseUpdateDialog({ open, onOpenChange, franchiseId, detail }: FranchiseUpdateDialogProps) {
  const mutation = useFranchiseUpdateMutation()
  const form = useZodForm(franchiseUpdateSchema)

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

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
