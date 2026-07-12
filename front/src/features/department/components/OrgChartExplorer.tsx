import { useDeferredValue, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { OrgChartTreeNode } from '../model/orgChartTree'

interface OrgChartExplorerProps {
  tree: OrgChartTreeNode[]
  selectedDeptId: number | undefined
  onSelect: (deptId: number) => void
  /** ADMIN 전용 "신규 부서" 버튼 노출 여부. false면 버튼을 렌더하지 않는다. */
  canRegisterDept: boolean
  /** DepartmentsExplorerLayout이 소유한 RegisterDepartmentDialog를 여는 콜백. */
  onOpenRegisterDialog: () => void
}

/**
 * 검색어(부서명/부서코드/부서장명 부분일치)·활성 필터를 트리에 재귀 적용한다.
 * 노드 자신이 조건에 맞지 않아도 하위에 조건을 만족하는 노드가 있으면 경로 유지를 위해
 * 남겨둔다(조상 노드가 사라지면 일치하는 하위 노드에 도달할 수 없기 때문).
 */
function filterTree(
  nodes: OrgChartTreeNode[],
  searchTerm: string,
  activeOnly: boolean,
): OrgChartTreeNode[] {
  return nodes.reduce<OrgChartTreeNode[]>((acc, node) => {
    const children = filterTree(node.children, searchTerm, activeOnly)
    const matchesSelf =
      (!searchTerm ||
        node.deptName.includes(searchTerm) ||
        node.deptCode.includes(searchTerm) ||
        (node.deptLeaderName?.includes(searchTerm) ?? false)) &&
      (!activeOnly || node.isActive)

    if (matchesSelf || children.length > 0) {
      acc.push({ ...node, children })
    }
    return acc
  }, [])
}

/** 필터링된 트리에 실제로 렌더되는 노드 총 개수(중첩 포함). 결과 개수 배지 표시에 쓴다. */
function countNodes(nodes: OrgChartTreeNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0)
}

interface OrgChartTreeItemProps {
  node: OrgChartTreeNode
  depth: number
  selectedDeptId: number | undefined
  expandedIds: Set<number>
  onToggleExpand: (deptId: number) => void
  onSelect: (deptId: number) => void
}

function OrgChartTreeItem({
  node,
  depth,
  selectedDeptId,
  expandedIds,
  onToggleExpand,
  onSelect,
}: OrgChartTreeItemProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.deptId)
  const isSelected = node.deptId === selectedDeptId

  return (
    <li>
      <div className="flex items-stretch" style={{ paddingLeft: `${depth * 16}px` }}>
        {/* expand/collapse는 별도 실제 <button>으로 분리해, 선택용 <button>과 중첩되지 않도록 한다. */}
        {hasChildren ? (
          <button
            type="button"
            aria-label={isExpanded ? '하위 부서 접기' : '하위 부서 펼치기'}
            aria-expanded={isExpanded}
            onClick={() => onToggleExpand(node.deptId)}
            className="flex w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="w-6 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          onClick={() => onSelect(node.deptId)}
          aria-current={isSelected ? 'true' : undefined}
          className={cn(
            'relative flex min-w-0 flex-1 flex-col gap-0.5 rounded-md py-1.5 pr-2 pl-2 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
            isSelected ? 'bg-primary/10' : 'hover:bg-muted/60',
          )}
        >
          {isSelected && (
            <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden />
          )}
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-sm font-medium',
                isSelected ? 'text-primary' : 'text-foreground',
              )}
            >
              {node.deptName}
            </span>
            <Badge variant="outline" className="shrink-0">
              {node.deptCode}
            </Badge>
            <Badge variant={node.isActive ? 'default' : 'secondary'} className="shrink-0">
              {node.isActive ? '활성' : '비활성'}
            </Badge>
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {node.deptLeaderName ?? '부서장 미지정'} · 구성원 {node.memberCount ?? '-'}명
          </span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul>
          {node.children.map((child) => (
            <OrgChartTreeItem
              key={child.deptId}
              node={child}
              depth={depth + 1}
              selectedDeptId={selectedDeptId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * 조직도 좌측 트리 탐색 패널. 가상 스크롤 라이브러리 없이 순수 재귀 컴포넌트로 구현한다(부서 개수가
 * 적어 불필요하다는 팀 결정). expand/collapse는 로컬 state(Set<deptId>)로 관리하며 기본값은 전부 접힌 상태다.
 */
export function OrgChartExplorer({
  tree,
  selectedDeptId,
  onSelect,
  canRegisterDept,
  onOpenRegisterDialog,
}: OrgChartExplorerProps) {
  const [searchInput, setSearchInput] = useState('')
  const deferredSearch = useDeferredValue(searchInput.trim())
  const [activeOnly, setActiveOnly] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  function toggleExpand(deptId: number) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(deptId)) {
        next.delete(deptId)
      } else {
        next.add(deptId)
      }
      return next
    })
  }

  const filteredTree = filterTree(tree, deferredSearch, activeOnly)
  const visibleCount = countNodes(filteredTree)

  return (
    // flex 컬럼 + h-full: 상위 aside가 데스크톱에서 뷰포트 기준 높이를 주므로, 헤더(검색·필터)는
    // 상단에 고정하고 트리 목록만 flex-1 영역에서 내부 스크롤시켜 박스 하단 빈 여백을 없앤다.
    <div className="flex h-full flex-col gap-3">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">조직도 탐색</h2>
          </div>
          {canRegisterDept && (
            <Button type="button" size="sm" className="shrink-0" onClick={onOpenRegisterDialog}>
              <Plus aria-hidden />
              신규 부서
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="org-chart-search" className="sr-only">
            부서 검색
          </label>
          <Input
            id="org-chart-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="부서명, 부서코드, 부서장명 검색..."
            className="pl-8"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="org-chart-active-only"
              checked={activeOnly}
              onCheckedChange={() => setActiveOnly((current) => !current)}
            />
            <Label htmlFor="org-chart-active-only" className="text-sm font-normal">
              활성 부서만 보기
            </Label>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {visibleCount}개 표시
          </Badge>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredTree.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            조회된 부서가 없습니다.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filteredTree.map((node) => (
              <OrgChartTreeItem
                key={node.deptId}
                node={node}
                depth={0}
                selectedDeptId={selectedDeptId}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
