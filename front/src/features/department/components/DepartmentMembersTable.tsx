import { useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { UserCog } from 'lucide-react'
import type { DeptMemberResponse } from '../model/deptMember'
import { Button } from '@/shared/ui/button'

const columnHelper = createColumnHelper<DeptMemberResponse>()

interface DepartmentMembersTableProps {
  data: DeptMemberResponse[]
  onRowClick: (empId: number) => void
  canManage?: boolean
  compact?: boolean
}

export function DepartmentMembersTable({
  data,
  onRowClick,
  canManage = false,
  compact = false,
}: DepartmentMembersTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('empNo', { header: '사번' }),
      columnHelper.accessor('empName', { header: '이름' }),
      ...(compact
        ? []
        : [
            columnHelper.accessor('extensionNo', { header: '내선번호' }),
            columnHelper.accessor('email', { header: '이메일' }),
          ]),
      columnHelper.accessor('position', { header: '직위' }),
      ...(canManage
        ? [
            columnHelper.display({
              id: 'actions',
              header: '관리',
              cell: ({ row }) => (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRowClick(row.original.empId)
                  }}
                >
                  <UserCog />
                  멤버 관리
                </Button>
              ),
            }),
          ]
        : []),
    ],
    [canManage, onRowClick, compact],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">소속 부서 멤버가 없습니다.</p>
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2.5 text-left font-medium whitespace-nowrap text-muted-foreground"
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
              onClick={() => onRowClick(row.original.empId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onRowClick(row.original.empId)
                }
              }}
              className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
