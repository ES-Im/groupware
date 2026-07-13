import { useState } from 'react'
import { Check, Loader2, UserPlus, X } from 'lucide-react'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useCirculationReadMutation } from '../../api/useCirculationReadMutation'
import { useCirculationRemoveMutation } from '../../api/useCirculationRemoveMutation'
import { formatDraftDateTime } from '../../lib/approvalStatusBadge'
import { CirculationAddDialog } from './CirculationAddDialog'
import type { DraftDetailSectionProps } from './types'

/**
 * 공람 영역(ROADMAP(DRAFT) T2.3 read-only 목록 → M5 T5.1~T5.2 확장).
 *
 * 노출 판정(PRD §접근 권한 — 프론트는 노출만, 최종은 서버):
 * - **기안자 본인**(`me.empBasicInfo.empId === draft.drafter.empId`): 공람 추가(F707)/제거(F708).
 * - **공람 대상자 본인**(`circulations`에 본인이 있고 `readAt == null`): 읽음 처리(F709).
 * empId는 me 응답 empBasicInfo에 보강된 사원 PK(model/me.ts)다. me 미로딩 등으로 empId가
 * 미확정(undefined)이면 기안자/공람대상 판정이 모두 false가 되어 액션을 노출하지 않는다(방어적 미노출).
 * props는 `{ draft }` 고정 계약을 유지한다(types.ts DraftDetailSectionProps).
 */
export function CirculationSection({ draft }: DraftDetailSectionProps) {
  const { draftId, circulations } = draft

  const myEmpId = useMeQuery().data?.empBasicInfo.empId
  const isDrafter = myEmpId != null && myEmpId === draft.drafter.empId
  // 본인 공람 항목(공람 대상자 여부·읽음 처리 노출 판정). empId 미확정 시 undefined → 미노출.
  const myCirculation = myEmpId != null ? circulations.find((c) => c.empId === myEmpId) : undefined
  const canMarkRead = myCirculation != null && myCirculation.readAt == null

  const [addOpen, setAddOpen] = useState(false)
  const readMutation = useCirculationReadMutation()
  const removeMutation = useCirculationRemoveMutation()
  // 제거 진행 중인 empId 집합(AttachmentSection 삭제 패턴 복제). 단일 mutation 인스턴스의
  // variables/isPending은 "마지막 mutate 호출"만 반영해, A 제거 중 B를 누르면 A행 disabled가 풀려
  // 중복 DELETE가 나갈 수 있으므로 empId별로 로컬 state에서 개별 추적한다.
  const [removingEmpIds, setRemovingEmpIds] = useState<Set<number>>(new Set())

  function handleRemove(empId: number) {
    setRemovingEmpIds((prev) => new Set(prev).add(empId))
    removeMutation.mutate(
      { draftId, empId },
      {
        onSettled: () => {
          setRemovingEmpIds((prev) => {
            const next = new Set(prev)
            next.delete(empId)
            return next
          })
        },
      },
    )
  }

  return (
    // 독립 카드(CardContent) 안에서 렌더되므로 자체 상단 구분선은 두지 않는다(레퍼런스 사이드 카드).
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-foreground">공람</h3>
        <div className="flex items-center gap-2">
          {/* (공람 대상자 본인·미열람) 읽음 처리(F709). */}
          {canMarkRead && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={readMutation.isPending}
              onClick={() => readMutation.mutate(draftId)}
            >
              {readMutation.isPending ? <Loader2 className="animate-spin" /> : <Check />}
              읽음 처리
            </Button>
          )}
          {/* (기안자 본인) 공람 추가(F707). */}
          {isDrafter && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setAddOpen(true)}
            >
              <UserPlus />
              공람자 추가
            </Button>
          )}
        </div>
      </div>

      {circulations.length === 0 ? (
        <p className="text-sm text-muted-foreground">지정된 공람자가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {circulations.map((circulation) => {
            const isRemoving = removingEmpIds.has(circulation.empId)
            return (
              <li
                key={circulation.empId}
                className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2 text-sm"
              >
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="bg-violet-100 text-[10px] font-bold text-violet-700">
                    {circulation.empName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {circulation.empName}
                </span>
                {circulation.readAt != null ? (
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    읽음 {formatDraftDateTime(circulation.readAt)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0">
                    미열람
                  </Badge>
                )}
                {/* (기안자 본인) 공람 제거(F708). 공람자별 진행 상태를 개별 추적한다. */}
                {isDrafter && (
                  <button
                    type="button"
                    onClick={() => handleRemove(circulation.empId)}
                    disabled={isRemoving}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    aria-label={`${circulation.empName} 공람 제거`}
                  >
                    {isRemoving ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* 기안자 본인일 때만 추가 다이얼로그를 마운트(empId 확정 시). 본인·기존 공람자는 선택 비활성. */}
      {isDrafter && myEmpId != null && (
        <CirculationAddDialog
          draftId={draftId}
          existingEmpIds={circulations.map((c) => c.empId)}
          drafterEmpId={myEmpId}
          open={addOpen}
          onOpenChange={setAddOpen}
        />
      )}
    </section>
  )
}
