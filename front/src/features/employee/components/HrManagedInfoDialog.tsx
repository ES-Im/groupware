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
import { useUpdateHrManagedInfoMutation } from '../api/useUpdateHrManagedInfoMutation'
import type { EmpManagementRecord, SystemRoleCode } from '../model/empManagement'
import { systemRoleLabels } from '../model/empManagement'
import { updateHrManagedInfoSchema, type UpdateHrManagedInfoFormValues } from '../model/updateHrManagedInfoSchema'

/**
 * HR/ADMIN이 부여 가능한 후보 권한(request-fields.adoc systemRoleCode 제약: "HR은 ADMIN 부여
 * 불가, ADMIN은 전체 부여 가능"). canManageAsHr는 hasRequiredRole(roles,'HR')로 계산돼 순수 HR과
 * ADMIN을 구분하지 못하므로, 이 다이얼로그가 직접 authStore의 원본 roles(ROLE_ 접두어 제거,
 * 계층 확장 없음)에서 'ADMIN' 포함 여부를 확인해 후보에 ADMIN을 추가할지 결정한다.
 */
const BASE_HR_ROLE_CANDIDATES: SystemRoleCode[] = [
  'EMPLOYEE',
  'DEPT_MANAGER',
  'FRANCHISE',
  'IT',
  'HR',
  'FACILITY',
]

interface HrManagedInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empId: number
  record: EmpManagementRecord
}

/**
 * HR/ADMIN 전용 사원 정보 수정 다이얼로그(`HR_UPDATE_EMP_INFO`, adapt-ui 신규).
 *
 * AppointDepartmentLeaderDialog의 T1.1 표준 폼 패턴(useZodForm + submitWithErrorMapping)을
 * 재사용한다. `EmpUpdateRequestByHR.java` 실측 결과 이 엔드포인트는 진짜 partial-update 계약이라
 * (실사용 검증 중 발견 — request-fields.adoc의 "전 필드 필수" 표기는 문서화 버그), 비밀번호·
 * 내선번호를 비워두면 "변경 안 함"으로 간주해 제출 시 요청 바디에서 제외한다(handleSubmit 참고).
 * 이름·입사일자는 항상 현재 값으로 프리필돼 있어 그대로 재전송해도 무해하므로 계속 필수로 둔다.
 */
export function HrManagedInfoDialog({ open, onOpenChange, empId, record }: HrManagedInfoDialogProps) {
  const rawRoles = useAuthStore((state) => state.roles)
  const isAdmin = rawRoles.includes('ADMIN')
  const roleCandidates = isAdmin ? [...BASE_HR_ROLE_CANDIDATES, 'ADMIN' as const] : BASE_HR_ROLE_CANDIDATES

  /**
   * 대상 사원이 이 뷰어의 후보 목록 밖 권한(순수 HR 뷰어에게는 ADMIN만 해당)을 이미 보유한 경우,
   * 서버(`EmpCommandService.validateAssignableRolesByHR`)는 그 권한이 배열에 "존재하기만 해도"
   * (새로 부여하려는 게 아니라 그대로 재전송/보존하려는 시도여도) 거부한다 — 즉 체크 안 된 후보만
   * 골라 보내면 그 권한이 조용히 제거되고(원래 버그), 보존하려고 그 권한을 배열에 포함해 보내면
   * 서버가 하드 거부한다(둘 다 실측 확인). 이 뷰어가 애초에 다룰 수 없는 권한이 껴 있으면 이
   * 다이얼로그에서는 권한 편집 자체를 막고(체크박스 disabled) systemRoleCode를 아예 생략해
   * 기존 권한을 그대로 둔다 — 내선번호 등 다른 필드만 수정 가능하다.
   */
  const outOfScopeRoles = record.systemRoleCodeName.filter((code) => !roleCandidates.includes(code))
  const canEditRoles = outOfScopeRoles.length === 0

  const mutation = useUpdateHrManagedInfoMutation()
  const form = useZodForm(updateHrManagedInfoSchema, {
    defaultValues: {
      empName: record.empName,
      password: '',
      extensionNo: record.extensionNo ?? '',
      systemRoleCode: record.systemRoleCodeName,
      hireAt: record.hireAt,
    },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다 최신 record 기준으로 초기화한다(제어형 다이얼로그, 언마운트되지 않음 —
  // AppointDepartmentLeaderDialog와 동일 이유).
  useEffect(() => {
    if (open) {
      reset({
        empName: record.empName,
        password: '',
        extensionNo: record.extensionNo ?? '',
        systemRoleCode: record.systemRoleCodeName,
        hireAt: record.hireAt,
      })
    }
  }, [open, record, reset])

  async function handleSubmit(values: UpdateHrManagedInfoFormValues) {
    await mutation.mutateAsync({
      empId,
      values: {
        ...values,
        // 빈 문자열은 "변경 안 함"을 뜻하므로 undefined로 바꿔 요청 바디에서 제외한다
        // (JSON.stringify가 undefined 키를 생략 — 서버가 null로 인식해 미변경 처리한다).
        password: values.password === '' ? undefined : values.password,
        extensionNo: values.extensionNo === '' ? undefined : values.extensionNo,
        // canEditRoles가 false면(후보 밖 권한 보유) systemRoleCode를 아예 생략해 기존 권한을
        // 그대로 둔다 — 체크된 후보만 보내면 서버가 조용히 제거하고, 후보 밖 권한을 보존하려
        // 배열에 포함해 보내면 서버가 하드 거부한다(둘 다 실측 확인, 위 canEditRoles 주석 참고).
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
          <DialogTitle>사원 정보 수정 (HR)</DialogTitle>
          <DialogDescription>
            이름·비밀번호·내선번호·권한·입사일자를 수정합니다. 비밀번호·내선번호는 비워두면 변경되지
            않습니다.
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submitWithErrorMapping(form, handleSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hr-emp-name">이름</Label>
            <Input id="hr-emp-name" aria-invalid={!!errors.empName} {...register('empName')} />
            {errors.empName && (
              <p role="alert" className="text-sm text-destructive">
                {errors.empName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hr-password">새 비밀번호</Label>
            <Input
              id="hr-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">비워두면 비밀번호가 변경되지 않습니다.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hr-extension-no">내선번호</Label>
            <Input
              id="hr-extension-no"
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
            <Label htmlFor="hr-hire-at">입사일자</Label>
            <Input id="hr-hire-at" type="date" aria-invalid={!!errors.hireAt} {...register('hireAt')} />
            {errors.hireAt && (
              <p role="alert" className="text-sm text-destructive">
                {errors.hireAt.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label id="hr-system-role-label">시스템 권한</Label>
            <div role="group" aria-labelledby="hr-system-role-label" className="flex flex-wrap gap-2">
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
