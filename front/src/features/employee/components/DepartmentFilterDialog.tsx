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
  /** useDepartmentsQuery의 content(플랫 목록, parentDeptId 포함). 트리는 이 안에서 파생한다. */
  departments: DepartmentSummary[]
  /** 현재 선택된 부서 필터. undefined면 "전체 부서". */
  selectedDeptId: number | undefined
  /** 부서(또는 전체=undefined) 선택 시 호출. 다이얼로그 닫기는 이 콜백을 받은 호출부가 담당하지 않아도
   *  이 컴포넌트가 선택 즉시 닫는다(레퍼런스 조직도 팝업 동작). */
  onSelect: (deptId: number | undefined) => void
}

/** 조직도 트리의 한 노드(부서)를 렌더하는 재귀 행. 클릭하면 그 부서로 필터가 잡힌다. */
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

/**
 * 조직도 트리 기반 부서 필터 다이얼로그(목표 디자인 employee-page 레퍼런스의 "부서 선택" 팝업 이식).
 *
 * 부서 계층은 useDepartmentsQuery의 플랫 응답(parentDeptId 포함)을 buildDepartmentTree(department
 * 도메인 재사용)로 트리로 세운 뒤 재귀 렌더한다. 상단의 "전체 부서"는 필터 해제(undefined)다.
 * 부서 필터는 deptId 단위라 트리의 모든 노드(본부·팀 구분 없이)를 선택 가능하게 둔다.
 */
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
