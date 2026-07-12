import { useEffect } from 'react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
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

interface UpdateDepartmentParentDialogProps {
  /** 다이얼로그 열림 상태(제어형, DepartmentDetailPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  deptId: number
  /** 다이얼로그가 열릴 때 선택값 초기값으로 채울 현재 상위 부서 ID. 최상위 부서면 null. */
  currentParentDeptId: number | null
}

/**
 * 상위 부서 변경 다이얼로그(F207, `DEPT_UPDATE_PARENT`, ROADMAP T9.3, ADMIN 전용).
 *
 * RenameDepartmentDialog/AppointDepartmentLeaderDialog와 동일한 T1.1 표준 폼 패턴
 * (useZodForm/submitWithErrorMapping, 열릴 때마다 reset, in-flight 닫힘 가드)을 재사용한다.
 *
 * 후보 목록은 T6.2 useDepartmentsQuery(isActive=true)를 이 컴포넌트 내부에서 호출해 얻는다 —
 * DepartmentDetailPage는 아직 이 목록을 필요로 하지 않으므로(멤버 표에만 부서 목록이 쓰이지
 * 않음) 컨테이너로 끌어올리지 않고, `enabled: open`으로 다이얼로그가 열려 있을 때만
 * 조회해 불필요한 백그라운드 요청을 막는다. 자기 자신(deptId)은 후보에서 제외한다.
 * 순환 참조 등 심화 검증은 서버 위임 — 400 응답은 submitWithErrorMapping이 그대로 폼 에러로 노출한다.
 *
 * select 값은 "최상위로 이동" 옵션의 빈 문자열(`''`)과 부서 ID 문자열 두 종류뿐이다. 제출 시
 * 빈 문자열이면 parentDeptId 자체를 전달하지 않아(useUpdateDepartmentParentMutation이 optional
 * 처리) 서버가 최상위로 이동 처리하도록 한다.
 *
 * 성공(204) 시: mutation의 onSuccess가 departmentKeys.all을 invalidate(부서 상세 재조회)한 뒤,
 * 이 컴포넌트가 성공 토스트를 띄우고 다이얼로그를 닫는다.
 */
export function UpdateDepartmentParentDialog({
  open,
  onOpenChange,
  deptId,
  currentParentDeptId,
}: UpdateDepartmentParentDialogProps) {
  const mutation = useUpdateDepartmentParentMutation()
  const candidatesQuery = useDepartmentsQuery(
    { isActive: true, size: CANDIDATE_PAGE_SIZE },
    { enabled: open },
  )
  const form = useZodForm(updateDepartmentParentSchema, {
    defaultValues: { parentDeptId: '' },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다(재오픈 포함) 현재 상위 부서로 초기화한다 — 제어형 다이얼로그라 언마운트되지
  // 않으므로 이전 세션의 선택값/에러가 남지 않도록 한다(RenameDepartmentDialog와 동일 이유).
  //
  // candidatesQuery.isSuccess를 의존성에 포함하는 이유(race condition 수정): 다이얼로그가 열릴 때
  // candidatesQuery가 아직 로딩 중이면 candidates=[]라 "현재 상위 부서(ID: N, 비활성 또는 목록
  // 범위 밖)" 폴백 <option>이 먼저 렌더되고, reset()이 그 폴백 옵션 value(N)로 네이티브 select를
  // 세팅한다. 이후 실제 후보 목록이 도착해 N이 정상 후보로 발견되면 폴백 옵션이 사라지고 동일 value의
  // 실제 후보 옵션으로 교체되는데, 이 select는 React value prop으로 제어되지 않는(register 기반
  // uncontrolled) 네이티브 엘리먼트라 선택된 <option> 노드가 제거되면 브라우저가 selectedIndex를
  // 0("최상위로 이동")으로 되돌려버린다. isSuccess가 false→true로 바뀌는 시점에 한 번 더 reset을
  // 실행해 후보 목록 도착 후에도 값을 재적용한다. isSuccess는 최초 성공 이후 계속 true로 유지되므로
  // (재조회로 갱신되어도 다시 false가 되지 않음) 열려 있는 동안 반복 reset되어 사용자의 선택을
  // 덮어쓰는 일은 없다.
  //
  // todo : 위 isSuccess 보정은 "사후 땜질"이라 완전한 수정이 아니다. 폴백 옵션이 실제 후보
  // 옵션으로 교체되는 DOM 커밋 순간에는 여전히 selectedIndex가 0으로 잠깐 리셋되며(네이티브
  // select가 선택된 option 노드 제거를 그렇게 처리함), 이 useEffect의 재실행은 그 다음에야
  // 값을 되돌린다. React 테스트 환경(act 자동 플러시)에서는 이 재실행이 거의 항상 다음 assert
  // 전에 끝나 우연히 감춰지지만, 실제 브라우저(effect가 페인트 이후 매크로태스크로 지연됨)에서는
  // 관리자가 다이얼로그를 열 때마다 "최상위로 이동"이 잠깐 보였다가 올바른 부서로 바뀌는 시각적
  // 깜빡임이 실제로 발생한다(UpdateDepartmentParentDialog.test.tsx의 회귀 케이스에서
  // MutationObserver로 결정적으로 재현 검증함). 근본 수정 방향: (1) 폴백 옵션과 동일 value를
  // 갖게 될 실제 후보 옵션에 동일한 key를 부여해 React가 같은 노드로 재조정하게 하거나,
  // (2) register 기반 비제어(uncontrolled) select 대신 RHF Controller + value prop으로
  // 완전히 제어되는 select로 전환해 DOM 옵션 노드 교체가 선택값에 영향을 주지 않도록 한다.
  useEffect(() => {
    if (open) {
      reset({ parentDeptId: currentParentDeptId !== null ? String(currentParentDeptId) : '' })
    }
  }, [open, currentParentDeptId, candidatesQuery.isSuccess, reset])

  // 후보 조회 실패는 무음으로 두지 않고 토스트로 알린다 — 실패해도 select 자체는 "최상위로 이동" +
  // (있다면) 현재 상위 부서 옵션만으로 계속 동작하지만, 관리자가 후보 목록이 비정상임을 알아야 한다.
  useEffect(() => {
    if (!candidatesQuery.error) {
      return
    }
    toast.error(normalizeApiError(candidatesQuery.error).message)
  }, [candidatesQuery.error])

  // 자기 자신은 후보에서 제외(순환 참조의 가장 자명한 케이스만 클라에서 걸러내고, 나머지 심화
  // 검증은 서버 위임).
  const candidates = (candidatesQuery.data?.content ?? []).filter(
    (candidate) => candidate.deptInfoResponse.deptId !== deptId,
  )

  // 후보 목록은 isActive:true·size:100·자기 자신 제외로 필터링되므로, 현재 상위 부서가 비활성이거나
  // 100건 범위 밖이면 후보에 없을 수 있다. 그 경우에도 select가 실제 현재 값을 표시하도록(첫 옵션
  // "최상위로 이동"으로 조용히 어긋나지 않도록) 후보 밖 현재 상위 부서를 별도 옵션으로 주입한다.
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
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다(RenameDepartmentDialog와
  // 동일 이유) — 그 사이에 다이얼로그가 닫히면 open===true에서만 도는 위 reset이 재오픈 시 root 에러까지
  // 지워버려, 뒤늦게 도착하는 변경 실패가 사용자에게 표시되지 않고 그대로 삼켜지기 때문이다.
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
          <DialogTitle>상위 부서 변경</DialogTitle>
          <DialogDescription>
            새 상위 부서를 선택하거나, 최상위 부서로 이동시킵니다.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            {/* select는 항상 값이 채워져 있어(기본값 또는 "최상위로 이동") 다른 필드와 달리
                필수 표시(*)를 붙이지 않는다 — 빈 선택 자체가 없다. */}
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

          <DialogFooter>
            {/* 취소: DialogClose가 onOpenChange(false)를 호출하므로 상위 handleOpenChange의
                in-flight 닫힘 가드를 그대로 탄다. 제출 중에는 명시적으로 비활성화한다. */}
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              변경
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
