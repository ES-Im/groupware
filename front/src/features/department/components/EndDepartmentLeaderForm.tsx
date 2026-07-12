import { useEffect } from 'react'
import { UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useEndDepartmentLeaderMutation } from '../api/useEndDepartmentLeaderMutation'
import {
  endDepartmentLeaderSchema,
  type EndDepartmentLeaderFormValues,
} from '../model/endDepartmentLeaderSchema'

interface EndDepartmentLeaderFormProps {
  deptId: number
  /** 안내 문구에 표시할 현재 부서장 이름. 이 폼은 부서장이 지정된 경우에만 렌더되므로 항상 채워진 값이 온다. */
  currentLeaderName: string
}

/**
 * 현재 부서장 종료 인라인 폼(F209, `DEPT_END_LEADER`, ADMIN 전용).
 *
 * 과거 모달(EndDepartmentLeaderDialog)에서 Dialog 껍데기만 벗겨내 관리 패널 탭 콘텐츠로 인라인화했다.
 * 종료일(`endAt`, `yyyy-MM-dd`) 하나만 받는 단순 폼이라 별도 후보 조회는 없다. zod/mutation/에러 매핑은 그대로다.
 *
 * 성공(204) 시: mutation의 onSuccess가 departmentKeys.all을 invalidate(상세 재조회)하고,
 * 이 폼은 성공 토스트를 띄운 뒤 입력값을 비운다.
 */
export function EndDepartmentLeaderForm({ deptId, currentLeaderName }: EndDepartmentLeaderFormProps) {
  const mutation = useEndDepartmentLeaderMutation()
  const form = useZodForm(endDepartmentLeaderSchema, {
    defaultValues: { endAt: '' },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 선택 부서가 바뀌면 이전 부서에서 입력하던 종료일/에러를 비운다.
  useEffect(() => {
    reset({ endAt: '' })
  }, [deptId, reset])

  async function handleSubmit(values: EndDepartmentLeaderFormValues) {
    await mutation.mutateAsync({ deptId, endAt: values.endAt })
    toast.success('부서장을 종료했습니다')
    reset({ endAt: '' })
  }

  return (
    <form
      noValidate
      onSubmit={submitWithErrorMapping(form, handleSubmit)}
      className="flex flex-col gap-4"
    >
      {/* 섹션 타이틀 줄: 좌측 헤딩 + 우측 제출 버튼. 버튼이 폼의 isSubmitting에 접근해야 하므로 헤딩을 폼이 소유한다. */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <UserCog className="size-4" aria-hidden />
          </span>
          부서장 관리
        </h3>
        <Button type="submit" variant="destructive" disabled={isSubmitting} className="shrink-0">
          부서장 종료
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        현재 부서장(<span className="font-medium text-foreground">{currentLeaderName}</span>)의 임기 종료일을 선택합니다.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="leader-end-at">
          종료일 <span className="text-destructive">*</span>
        </Label>
        <Input id="leader-end-at" type="date" aria-invalid={!!errors.endAt} {...register('endAt')} />
        {errors.endAt && (
          <p role="alert" className="text-sm text-destructive">
            {errors.endAt.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
    </form>
  )
}
