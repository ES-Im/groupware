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

/** 가입 대기(PENDING) 신규 사원 1페이지(content)만 렌더하는 표. 행별 [승인] 클릭은 상위(T1.6)로 위임한다. */
export function NewEmployeesTable({ data, onApprove }: NewEmployeesTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('empNo', { header: '사원번호' }),
      columnHelper.accessor('name', { header: '이름' }),
      columnHelper.accessor('loginId', { header: '로그인ID' }),
      columnHelper.accessor('email', { header: '이메일' }),
      columnHelper.accessor('extensionNo', { header: '내선번호' }),
      columnHelper.display({
        id: 'approve',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="xs"
            onClick={() => onApprove(row.original.empId, row.original.name, row.original.loginId)}
          >
            승인
          </Button>
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

  // 빈 상태 안내는 이 컴포넌트가 아니라 상위 페이지(NewEmployeeApprovalListPage, T1.6)가 전담한다
  // (참고 패턴 원본 DepartmentMembersTable과 달리 이 표는 data.length===0 가드를 두지 않는다).
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
              className="border-b border-border transition-colors last:border-0 hover:bg-muted/60"
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
