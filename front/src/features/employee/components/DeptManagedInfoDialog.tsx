import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
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
import { useUpdateDeptManagedInfoMutation } from '../api/useUpdateDeptManagedInfoMutation'
import type { EmpManagementRecord, SystemRoleCode } from '../model/empManagement'
import { LAYER2_ROLE_CODES, systemRoleLabels } from '../model/empManagement'
import {
  updateDeptManagedInfoSchema,
  type UpdateDeptManagedInfoFormValues,
} from '../model/updateDeptManagedInfoSchema'

const BASE_DEPT_MANAGER_ROLE_CANDIDATES: SystemRoleCode[] = ['EMPLOYEE', 'DEPT_MANAGER']

interface DeptManagedInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empId: number
  record: EmpManagementRecord
}

export function DeptManagedInfoDialog({
  open,
  onOpenChange,
  empId,
  record,
}: DeptManagedInfoDialogProps) {
  const rawRoles = useAuthStore((state) => state.roles)
  const viewerLayer2Roles = LAYER2_ROLE_CODES.filter((code) => rawRoles.includes(code))
  const roleCandidates = [...BASE_DEPT_MANAGER_ROLE_CANDIDATES, ...viewerLayer2Roles]

  const outOfScopeRoles = record.systemRoleCodeName.filter((code) => !roleCandidates.includes(code))
  const canEditRoles = outOfScopeRoles.length === 0

  const mutation = useUpdateDeptManagedInfoMutation()
  const form = useZodForm(updateDeptManagedInfoSchema, {
    defaultValues: {
      extensionNo: record.extensionNo ?? '',
      systemRoleCode: record.systemRoleCodeName,
    },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open) {
      reset({
        extensionNo: record.extensionNo ?? '',
        systemRoleCode: record.systemRoleCodeName,
      })
    }
  }, [open, record, reset])

  async function handleSubmit(values: UpdateDeptManagedInfoFormValues) {
    await mutation.mutateAsync({
      empId,
      values: {
        ...values,
        extensionNo: values.extensionNo === '' ? undefined : values.extensionNo,
        systemRoleCode: canEditRoles ? values.systemRoleCode : undefined,
      },
    })
    toast.success('사원 정보를 수정했습니다')
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
          <DialogTitle>사원 정보 수정 (부서매니저)</DialogTitle>
          <DialogDescription>내선번호와 권한을 수정합니다. 내선번호는 비워두면 변경되지 않습니다.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submitWithErrorMapping(form, handleSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-manager-extension-no">내선번호</Label>
            <Input
              id="dept-manager-extension-no"
              placeholder="000-0000"
              aria-invalid={!!errors.extensionNo}
              {...register('extensionNo')}
            />
            {errors.extensionNo ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.extensionNo.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">비워두면 내선번호가 변경되지 않습니다.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label id="dept-manager-system-role-label">시스템 권한</Label>
            <div role="group" aria-labelledby="dept-manager-system-role-label" className="flex flex-wrap gap-2">
              {roleCandidates.map((code) => (
                <label
                  key={code}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:not(:disabled)]:cursor-pointer has-[:not(:disabled)]:hover:border-foreground/30 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50"
                >
                  <input
                    type="checkbox"
                    value={code}
                    disabled={!canEditRoles}
                    {...register('systemRoleCode')}
                    className="sr-only"
                  />
                  <Check
                    className="size-3.5 shrink-0 opacity-40 transition-opacity group-has-[:checked]:opacity-100"
                    aria-hidden="true"
                  />
                  {systemRoleLabels[code]}
                </label>
              ))}
            </div>
            {!canEditRoles && (
              <p className="text-xs text-muted-foreground">
                이 사원은 회원님이 관리할 수 없는 권한(
                {outOfScopeRoles.map((code) => systemRoleLabels[code]).join(', ')})을 보유하고 있어 이
                화면에서 권한을 수정할 수 없습니다.
              </p>
            )}
            {errors.systemRoleCode && (
              <p role="alert" className="text-sm text-destructive">
                {errors.systemRoleCode.message}
              </p>
            )}
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
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
