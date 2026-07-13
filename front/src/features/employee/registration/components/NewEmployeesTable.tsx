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

/**
 * 가입 대기(PENDING) 신규 사원 1페이지(content)만 렌더하는 표(목표 디자인 이식).
 * 행별 [승인] 클릭은 상위(T1.6)로 위임한다. EmpManagementTable과 동일한 표 스타일 언어를 쓴다.
 */
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

  // 빈 상태 안내는 이 컴포넌트가 아니라 상위 페이지(NewEmployeeApprovalListPage, T1.6)가 전담한다
  // (참고 패턴 원본 DepartmentMembersTable과 달리 이 표는 data.length===0 가드를 두지 않는다).
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
