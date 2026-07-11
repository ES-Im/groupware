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

/**
 * DEPT_MANAGER 전용 사원 정보 수정 다이얼로그(`DEPT_MANAGER_UPDATE_EMP_INFO`, adapt-ui 신규).
 *
 * 권한 후보는 EMPLOYEE/DEPT_MANAGER + "뷰어(부서매니저) 본인이 가진 Layer-2 권한"만 허용한다
 * (request-fields.adoc: "부서매니저 상위 권한 부여 불가", [FRANCHISE,IT,HR,FACILITY 중 부서
 * 매니저가 가진 권한]) — authStore의 원본 roles에서 LAYER2_ROLE_CODES와 교집합을 구해 후보에 더한다.
 * HrManagedInfoDialog와 달리 이름/비밀번호/입사일자는 다루지 않는다(계약 범위 밖).
 */
export function DeptManagedInfoDialog({
  open,
  onOpenChange,
  empId,
  record,
}: DeptManagedInfoDialogProps) {
  const rawRoles = useAuthStore((state) => state.roles)
  const viewerLayer2Roles = LAYER2_ROLE_CODES.filter((code) => rawRoles.includes(code))
  const roleCandidates = [...BASE_DEPT_MANAGER_ROLE_CANDIDATES, ...viewerLayer2Roles]

  /**
   * 대상 사원이 이 부서매니저의 후보 목록 밖 권한(예: ADMIN, 본인이 갖지 않은 Layer-2 권한)을
   * 이미 보유한 경우, 서버(`EmpCommandService.validateAssignableRolesByDeptManager` +
   * `EmpUpdateRequestByDeptManager`의 compact constructor)는 그 권한이 배열에 "존재하기만 해도"
   * (새로 부여하려는 게 아니라 그대로 재전송/보존하려는 시도여도) 거부한다 — 실측 확인(체크 안 된
   * 후보만 보내면 조용히 제거되고, 보존하려 배열에 포함해 보내면 하드 거부됨, 둘 다 재현). 이
   * 부서매니저가 애초에 다룰 수 없는 권한이 껴 있으면 권한 편집 자체를 막고(체크박스 disabled)
   * systemRoleCode를 아예 생략해 기존 권한을 그대로 둔다 — 내선번호만 수정 가능하다.
   */
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
        // 빈 문자열은 "변경 안 함"을 뜻하므로 undefined로 바꿔 요청 바디에서 제외한다
        // (JSON.stringify가 undefined 키를 생략 — 서버가 null로 인식해 미변경 처리한다).
        extensionNo: values.extensionNo === '' ? undefined : values.extensionNo,
        // canEditRoles가 false면(후보 밖 권한 보유) systemRoleCode를 아예 생략해 기존 권한을
        // 그대로 둔다 — 위 canEditRoles 주석 참고(체크된 후보만 보내면 조용히 제거, 후보 밖 권한을
        // 보존하려 배열에 포함해 보내면 서버가 하드 거부, 둘 다 실측 확인).
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
                  {/* 네이티브 체크박스는 sr-only로 숨겨 시각은 pill 토글로 대체하되, 포커스·키보드
                      토글 접근성은 유지한다. 선택 상태는 배경색과 Check 아이콘으로 이중 표기한다.
                      canEditRoles가 false면 disabled로 잠가 체크 상태(현재 권한)만 보여준다. */}
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
