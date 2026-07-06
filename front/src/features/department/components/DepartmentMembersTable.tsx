import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { DeptMemberResponse } from '../model/deptMember'

/**
 * @tanstack/react-table 최초 도입(ROADMAP T2.1-b). 이후 도메인 목록 화면이 복제할 표준 패턴:
 * 1) `createColumnHelper<RowType>()`로 타입 안전한 컬럼을 정의한다.
 * 2) 정렬/필터/페이징 로우모델은 이번 스코프 밖이므로 `getCoreRowModel()`만 사용한다
 *    (페이징 UI 제외, totalElements 등 메타는 응답에만 존재 — ROADMAP T2.1-b 스코프 확정).
 * 3) 헤더/셀 렌더는 항상 `flexRender`를 거친다(accessor에 `cell`을 지정하지 않으면
 *    react-table 기본 렌더러가 값을 문자열로 표시한다).
 */
const columnHelper = createColumnHelper<DeptMemberResponse>()

const columns = [
  columnHelper.accessor('empNo', { header: '사번' }),
  columnHelper.accessor('empName', { header: '이름' }),
  columnHelper.accessor('extensionNo', { header: '내선번호' }),
  columnHelper.accessor('email', { header: '이메일' }),
  columnHelper.accessor('position', { header: '직위' }),
]

interface DepartmentMembersTableProps {
  data: DeptMemberResponse[]
  onRowClick: (empId: number) => void
}

/** 부서 멤버 1페이지(content)만 렌더하는 표. 행 클릭 시 사원 상세로 이동하도록 onRowClick을 위임받는다. */
export function DepartmentMembersTable({ data, onRowClick }: DepartmentMembersTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">소속 부서 멤버가 없습니다.</p>
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-border">
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="px-3 py-2 text-left font-medium text-muted-foreground"
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
            className="cursor-pointer border-b border-border last:border-0 hover:bg-muted"
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-3 py-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
