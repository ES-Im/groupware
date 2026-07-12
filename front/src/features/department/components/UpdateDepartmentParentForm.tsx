import { useEffect } from 'react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { useDepartmentsQuery } from '../api/useDepartmentsQuery'
import { useUpdateDepartmentParentMutation } from '../api/useUpdateDepartmentParentMutation'
import {
  updateDepartmentParentSchema,
  type UpdateDepartmentParentFormValues,
} from '../model/updateDepartmentParentSchema'

/** 후보 목록 조회 시 사용할 페이지 크기. 전용 "전체 조회" API가 없어(§ DEPTS는 페이징 응답),
 * select 하나로 다뤄야 하는 후보군을 사실상 모두 담을 수 있도록 서버 기본값(10)보다 넉넉하게 잡는다. */
const CANDIDATE_PAGE_SIZE = 100

interface UpdateDepartmentParentFormProps {
  deptId: number
  /** 선택값 초기값으로 채울 현재 상위 부서 ID. 최상위 부서면 null. */
  currentParentDeptId: number | null
}

/**
 * 상위 부서 변경 인라인 폼(F207, `DEPT_UPDATE_PARENT`, ADMIN 전용).
 *
 * 과거 모달(UpdateDepartmentParentDialog)에서 Dialog 껍데기만 벗겨내 관리 패널 탭 콘텐츠로 인라인화했다.
 * zod/mutation/submitWithErrorMapping과 select 후보 처리 로직은 그대로 유지한다.
 *
 * 후보 목록은 useDepartmentsQuery(isActive=true, size=100)로 조회한다. 모달 시절의 `enabled: open`
 * 가드는 open 개념이 사라져 제거했다 — 이 폼은 관리 패널의 "상위 부서 변경" 탭이 활성일 때만 마운트되고
 * (Tabs가 비활성 탭 콘텐츠를 언마운트), 후보 100건 조회는 가벼우므로 항상 활성화해도 무방하다.
 * 자기 자신(deptId)은 후보에서 제외한다. 순환 참조 등 심화 검증은 서버 위임(400은 폼 에러로 노출).
 *
 * select 값은 "최상위로 이동"의 빈 문자열(`''`)과 부서 ID 문자열 두 종류뿐이다. 제출 시 빈 문자열이면
 * parentDeptId 자체를 전달하지 않아(mutation이 optional 처리) 서버가 최상위로 이동 처리하도록 한다.
 *
 * 성공(204) 시: mutation의 onSuccess가 departmentKeys.all을 invalidate(상세 재조회)하고,
 * 이 폼은 성공 토스트를 띄운 뒤 방금 선택한 값으로 reset한다.
 */
export function UpdateDepartmentParentForm({ deptId, currentParentDeptId }: UpdateDepartmentParentFormProps) {
  const mutation = useUpdateDepartmentParentMutation()
  const candidatesQuery = useDepartmentsQuery({ isActive: true, size: CANDIDATE_PAGE_SIZE })
  const form = useZodForm(updateDepartmentParentSchema, {
    defaultValues: { parentDeptId: currentParentDeptId !== null ? String(currentParentDeptId) : '' },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 선택 부서가 바뀌거나(deptId/currentParentDeptId) 후보 목록이 도착하면(candidatesQuery.isSuccess)
  // 현재 상위 부서로 초기화한다.
  //
  // candidatesQuery.isSuccess를 의존성에 포함하는 이유(race condition 수정): 후보 목록이 아직 로딩
  // 중이면 candidates=[]라 "현재 상위 부서(ID: N, 비활성 또는 목록 범위 밖)" 폴백 <option>이 먼저
  // 렌더되고, reset()이 그 폴백 옵션 value(N)로 네이티브 select를 세팅한다. 이후 실제 후보 목록이
  // 도착해 N이 정상 후보로 발견되면 폴백 옵션이 사라지고 동일 value의 실제 후보 옵션으로 교체되는데,
  // 이 select는 register 기반 uncontrolled 네이티브 엘리먼트라 선택된 <option> 노드가 제거되면
  // 브라우저가 selectedIndex를 0("최상위로 이동")으로 되돌려버린다. isSuccess가 false→true로 바뀌는
  // 시점에 한 번 더 reset을 실행해 후보 목록 도착 후에도 값을 재적용한다. isSuccess는 최초 성공 이후
  // 계속 true로 유지되므로 열려 있는 동안 반복 reset되어 사용자의 선택을 덮어쓰는 일은 없다.
  //
  // todo : 위 isSuccess 보정은 "사후 땜질"이라 완전한 수정이 아니다. 폴백 옵션이 실제 후보 옵션으로
  // 교체되는 DOM 커밋 순간에는 여전히 selectedIndex가 0으로 잠깐 리셋되며, 이 useEffect의 재실행은
  // 그 다음에야 값을 되돌린다(UpdateDepartmentParentForm.test.tsx의 회귀 케이스가 MutationObserver로
  // 결정적으로 재현). 근본 수정 방향: (1) 폴백/실제 후보 옵션에 동일 key를 부여해 React가 같은 노드로
  // 재조정하게 하거나, (2) register 기반 비제어 select 대신 RHF Controller + value prop으로 완전히
  // 제어되는 select로 전환한다.
  useEffect(() => {
    reset({ parentDeptId: currentParentDeptId !== null ? String(currentParentDeptId) : '' })
  }, [deptId, currentParentDeptId, candidatesQuery.isSuccess, reset])

  // 후보 조회 실패는 무음으로 두지 않고 토스트로 알린다 — 실패해도 select 자체는 "최상위로 이동" +
  // (있다면) 현재 상위 부서 옵션만으로 계속 동작하지만, 관리자가 후보 목록이 비정상임을 알아야 한다.
  useEffect(() => {
    if (!candidatesQuery.error) {
      return
    }
    toast.error(normalizeApiError(candidatesQuery.error).message)
  }, [candidatesQuery.error])

  // 자기 자신은 후보에서 제외(순환 참조의 가장 자명한 케이스만 클라에서 걸러내고, 나머지 심화 검증은 서버 위임).
  const candidates = (candidatesQuery.data?.content ?? []).filter(
    (candidate) => candidate.deptInfoResponse.deptId !== deptId,
  )

  // 후보 목록은 isActive:true·size:100·자기 자신 제외로 필터링되므로, 현재 상위 부서가 비활성이거나
  // 100건 범위 밖이면 후보에 없을 수 있다. 그 경우에도 select가 실제 현재 값을 표시하도록 후보 밖
  // 현재 상위 부서를 별도 옵션으로 주입한다.
  const isCurrentParentMissingFromCandidates =
    currentParentDeptId !== null &&
    !candidates.some((candidate) => candidate.deptInfoResponse.deptId === currentParentDeptId)

  async function handleSubmit(values: UpdateDepartmentParentFormValues) {
    if (values.parentDeptId === '') {
      await mutation.mutateAsync({ deptId })
    } else {
      await mutation.mutateAsync({ deptId, parentDeptId: Number(values.parentDeptId) })
    }
    toast.success('상위 부서를 변경했습니다')
    reset({ parentDeptId: values.parentDeptId })
  }

  return (
    <form
      noValidate
      onSubmit={submitWithErrorMapping(form, handleSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        {/* select는 항상 값이 채워져 있어(기본값 또는 "최상위로 이동") 필수 표시(*)를 붙이지 않는다. */}
        <Label htmlFor="parent-dept-id">상위 부서</Label>
        <select
          id="parent-dept-id"
          aria-invalid={!!errors.parentDeptId}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
          {...register('parentDeptId')}
        >
          <option value="">최상위로 이동</option>
          {isCurrentParentMissingFromCandidates && (
            <option value={String(currentParentDeptId)}>
              현재 상위 부서(ID: {currentParentDeptId}, 비활성 또는 목록 범위 밖)
            </option>
          )}
          {candidates.map((candidate) => (
            <option key={candidate.deptInfoResponse.deptId} value={candidate.deptInfoResponse.deptId}>
              {candidate.deptInfoResponse.deptName} ({candidate.deptInfoResponse.deptCode})
            </option>
          ))}
        </select>
        {errors.parentDeptId && (
          <p role="alert" className="text-sm text-destructive">
            {errors.parentDeptId.message}
          </p>
        )}
        {candidatesQuery.isError && (
          <p role="alert" className="text-sm text-destructive">
            후보 목록을 불러오지 못했습니다. 선택지가 불완전할 수 있습니다.
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          상위 부서 변경
        </Button>
      </div>
    </form>
  )
}
