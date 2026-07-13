import { useMemo } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import type { EmpManagementRecord, EmpStatus } from '../model/empManagement'
import { empStatusLabels, systemRoleBadgeVariant, systemRoleLabels } from '../model/empManagement'

/**
 * 관리 컬럼 드롭다운이 여는 모달 종류. 호출부(EmpManagementListPage)가 대상 record와 함께 받는다.
 * transfer(전보)는 현재 주요 소속이 있을 때, assign(최초 배정)은 소속이 없을 때만 노출된다.
 */
export type EmpManageAction = 'info' | 'status' | 'transfer' | 'assign'

const columnHelper = createColumnHelper<EmpManagementRecord>()

/**
 * 근무 상태 pill 톤(목표 디자인 employee-page 레퍼런스의 status pill 언어 이식).
 * 재직중=green / 가입 대기=slate / 정직=red / 퇴직=중립(muted)으로 톤을 분리하고, 선행 점(dot)은
 * bg-current로 글자색을 따라간다. destructive/primary 같은 단일 토큰으로는 4색 구분이 안 나오는
 * 상태 표기라, 이 표에서만 쓰는 로컬 색 맵으로 둔다(다크모드 대응 유틸 병기).
 */
const statusPillClass: Record<EmpStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  PENDING: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  SUSPENDED: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  RESIGNED: 'bg-muted text-muted-foreground',
}

/** 이니셜 원형 아바타(레퍼런스 .who .a). 이름 앞 두 글자를 중립 톤 원으로 표기한다. */
function InitialsCircle({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
    >
      {name.trim().slice(0, 2) || '—'}
    </span>
  )
}

interface EmpManagementTableProps {
  data: EmpManagementRecord[]
  /** 행(관리 컬럼 제외) 클릭 시. 기본 관리 동작(정보 수정)으로 연결된다. */
  onRowClick: (record: EmpManagementRecord) => void
  /** 관리 컬럼 드롭다운에서 항목 선택 시. 대상 record와 열 모달 종류를 전달한다. */
  onManage: (record: EmpManagementRecord, action: EmpManageAction) => void
}

/**
 * 사원관리 목록(EmpManagementListPage) 1페이지(content)만 렌더하는 표(목표 디자인 이식).
 * 행 클릭 컨벤션(role="button" + onClick/onKeyDown)은 DepartmentMembersTable을 그대로 복제한다.
 * 소속·직급은 belongings에서 주요+미종료 소속을 골라 파생하는 display 컬럼이다(accessor 불가 —
 * 원본 필드가 배열이라 값 접근이 아닌 계산이 필요).
 */
export function EmpManagementTable({ data, onRowClick, onManage }: EmpManagementTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('empNo', {
        header: '사번',
        cell: ({ getValue }) => <span className="font-mono text-xs text-muted-foreground">{getValue()}</span>,
      }),
      columnHelper.display({
        id: 'name',
        header: '이름',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <InitialsCircle name={row.original.empName} />
            <span className="font-semibold text-foreground">{row.original.empName}</span>
          </div>
        ),
      }),
      columnHelper.display({
        id: 'deptPosition',
        header: '소속 · 직급',
        cell: ({ row }) => {
          const current = row.original.belongings.find((b) => b.isPrimary && b.endAt === null)
          return current ? `${current.deptName} · ${current.positionName}` : '소속 없음'
        },
      }),
      columnHelper.display({
        id: 'status',
        header: '근무 상태',
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
              statusPillClass[row.original.status],
            )}
          >
            <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
            {empStatusLabels[row.original.status]}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'systemRoles',
        header: '시스템 권한',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.systemRoleCodeName.map((code) => (
              <Badge key={code} variant={systemRoleBadgeVariant[code]}>
                {systemRoleLabels[code]}
              </Badge>
            ))}
          </div>
        ),
      }),
      columnHelper.accessor('hireAt', {
        header: () => <div className="text-right">입사일</div>,
        cell: ({ getValue }) => (
          <div className="text-right font-mono text-xs text-muted-foreground">{getValue()}</div>
        ),
      }),
      columnHelper.display({
        id: 'manage',
        header: () => <div className="text-right">관리</div>,
        cell: ({ row }) => {
          const hasPrimary = row.original.belongings.some((b) => b.isPrimary && b.endAt === null)
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="xs" className="gap-1">
                    관리
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onManage(row.original, 'info')}>정보 수정</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onManage(row.original, 'status')}>
                    근무 상태 변경
                  </DropdownMenuItem>
                  {hasPrimary ? (
                    <DropdownMenuItem onSelect={() => onManage(row.original, 'transfer')}>
                      부서 이동
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => onManage(row.original, 'assign')}>
                      부서 배정
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      }),
    ],
    [onManage],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2.5 text-left text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              role="button"
              tabIndex={0}
              onClick={() => onRowClick(row.original)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onRowClick(row.original)
                }
              }}
              className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
            >
              {row.getVisibleCells().map((cell) => {
                // 관리 셀은 행 클릭(정보 수정)과 분리한다 — 드롭다운 트리거·항목의 클릭/Enter가
                // tr까지 버블링해 정보 수정 모달까지 함께 열리는 것을 막는다.
                const isManage = cell.column.id === 'manage'
                return (
                  <td
                    key={cell.id}
                    className="px-4 py-3 whitespace-nowrap"
                    onClick={isManage ? (event) => event.stopPropagation() : undefined}
                    onKeyDown={isManage ? (event) => event.stopPropagation() : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
