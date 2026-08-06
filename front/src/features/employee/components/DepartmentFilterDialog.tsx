import { useMemo } from 'react'
import { Building2, Check, FolderTree, Users } from 'lucide-react'
import type { DepartmentSummary } from '@/features/department/api/getDepartments'
import { buildDepartmentTree } from '@/features/department/lib/buildDepartmentTree'
import type { OrgChartTreeNode } from '@/features/department/model/orgChartTree'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

interface DepartmentFilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: DepartmentSummary[]
  selectedDeptId: number | undefined
  onSelect: (deptId: number | undefined) => void
}

function DeptTreeNode({
  node,
  depth,
  selectedDeptId,
  onPick,
}: {
  node: OrgChartTreeNode
  depth: number
  selectedDeptId: number | undefined
  onPick: (deptId: number) => void
}) {
  const selected = selectedDeptId === node.deptId
  const hasChildren = node.children.length > 0
  return (
    <>
      <button
        type="button"
        onClick={() => onPick(node.deptId)}
        style={{ paddingLeft: 10 + depth * 18 }}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg py-2 pr-2.5 text-left text-sm transition-colors hover:bg-muted',
          selected && 'bg-primary/10 text-primary hover:bg-primary/10',
        )}
      >
        {hasChildren ? (
          <FolderTree className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <span className={cn('font-medium', selected ? 'text-primary' : 'text-foreground')}>{node.deptName}</span>
        {typeof node.memberCount === 'number' && (
          <span className="text-xs text-muted-foreground">{node.memberCount}명</span>
        )}
        {selected && <Check className="ml-auto size-4 shrink-0" aria-hidden="true" />}
      </button>
      {hasChildren &&
        node.children.map((child) => (
          <DeptTreeNode
            key={child.deptId}
            node={child}
            depth={depth + 1}
            selectedDeptId={selectedDeptId}
            onPick={onPick}
          />
        ))}
    </>
  )
}

export function DepartmentFilterDialog({
  open,
  onOpenChange,
  departments,
  selectedDeptId,
  onSelect,
}: DepartmentFilterDialogProps) {
  const tree = useMemo(() => buildDepartmentTree(departments), [departments])

  function pick(deptId: number | undefined) {
    onSelect(deptId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>부서 선택</DialogTitle>
          <DialogDescription>조직도에서 조회할 부서를 선택하세요.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[56vh] space-y-0.5 overflow-y-auto">
          <button
            type="button"
            onClick={() => pick(undefined)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted',
              selectedDeptId === undefined && 'bg-primary/10 text-primary hover:bg-primary/10',
            )}
          >
            <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className={cn('font-medium', selectedDeptId === undefined ? 'text-primary' : 'text-foreground')}>
              전체 부서
            </span>
            {selectedDeptId === undefined && <Check className="ml-auto size-4 shrink-0" aria-hidden="true" />}
          </button>

          {tree.map((node) => (
            <DeptTreeNode
              key={node.deptId}
              node={node}
              depth={0}
              selectedDeptId={selectedDeptId}
              onPick={pick}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
