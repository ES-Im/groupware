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

export function CirculationSection({ draft }: DraftDetailSectionProps) {
  const { draftId, circulations } = draft

  const myEmpId = useMeQuery().data?.empBasicInfo.empId
  const isDrafter = myEmpId != null && myEmpId === draft.drafter.empId
  const myCirculation = myEmpId != null ? circulations.find((c) => c.empId === myEmpId) : undefined
  const canMarkRead = myCirculation != null && myCirculation.readAt == null

  const [addOpen, setAddOpen] = useState(false)
  const readMutation = useCirculationReadMutation()
  const removeMutation = useCirculationRemoveMutation()
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
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-foreground">공람</h3>
        <div className="flex items-center gap-2">
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
