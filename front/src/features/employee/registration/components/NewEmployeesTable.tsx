import { useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { NewEmpRecord } from '../model/newEmployee'
import { Button } from '@/shared/ui/button'

const columnHelper = createColumnHelper<NewEmpRecord>()

interface NewEmployeesTableProps {
  data: NewEmpRecord[]
  onApprove: (empId: number, name: string, loginId: string) => void
}

export function NewEmployeesTable({ data, onApprove }: NewEmployeesTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('empNo', {
        header: '사원번호',
        cell: ({ getValue }) => <span className="font-mono text-xs text-muted-foreground">{getValue()}</span>,
      }),
      columnHelper.accessor('name', {
        header: '이름',
        cell: ({ getValue }) => <span className="font-semibold text-foreground">{getValue()}</span>,
      }),
      columnHelper.accessor('loginId', { header: '로그인ID' }),
      columnHelper.accessor('email', {
        header: '이메일',
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
      }),
      columnHelper.accessor('extensionNo', { header: '내선번호' }),
      columnHelper.display({
        id: 'approve',
        header: () => <div className="text-right">처리</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              size="xs"
              onClick={() => onApprove(row.original.empId, row.original.name, row.original.loginId)}
            >
              승인
            </Button>
          </div>
        ),
      }),
    ],
    [onApprove],
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
              className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
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
