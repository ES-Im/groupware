import { useEffect } from 'react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { useEmpBelongingsQuery } from '../api/useEmpBelongingsQuery'
import { Pill } from './EmployeeSummaryCard'

interface EmpBelongingsPanelProps {
  empId: number | undefined
}

export function EmpBelongingsPanel({ empId }: EmpBelongingsPanelProps) {
  const belongingsQuery = useEmpBelongingsQuery(empId)

  useEffect(() => {
    if (!belongingsQuery.error) {
      return
    }
    toast.error(normalizeApiError(belongingsQuery.error).message)
  }, [belongingsQuery.error])

  if (belongingsQuery.isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
  }

  const sorted = [...(belongingsQuery.data ?? [])].sort((a, b) => (a.startAt < b.startAt ? 1 : -1))

  if (sorted.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">소속 이력이 없습니다.</p>
  }

  return (
    <ul className="space-y-3">
      {sorted.map((dept) => (
        <li
          key={`${dept.deptId}-${dept.startAt}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h5 className="truncate text-sm font-semibold text-foreground">{dept.deptName}</h5>
              <Pill tone={dept.isPrimary ? 'primary' : 'muted'}>{dept.isPrimary ? '주 소속' : '겸직'}</Pill>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {dept.deptCode} · {dept.positionName}
            </p>
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <p>{dept.startAt} 시작</p>
            <p>{dept.endAt ?? '현재 재직 중'}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
