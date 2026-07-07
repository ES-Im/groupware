import { useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { DepartmentSummary } from '../api/getDepartments'

/**
 * 부서 목록 표(F201, ROADMAP T6.3). `DepartmentMembersTable`(T2.1-b)의 컬럼 헬퍼 패턴을 복제한다:
 * `createColumnHelper<DepartmentSummary>()` + `getCoreRowModel()`만 사용(정렬/필터 로우모델은
 * 이번 스코프 밖 — 정렬/필터는 서버 파라미터(keyword/isActive)로만 처리한다).
 *
 * 부서장 요약 열: T6.1에서 정규화된 `deptLeader`(공석이면 null)를 그대로 신뢰해
 * `empName` 유무만으로 "미지정"을 판별한다(all-null 객체를 직접 다루지 않음, PRD §부서장 공석 wire 계약).
 */
const columnHelper = createColumnHelper<DepartmentSummary>()

interface DepartmentsTableProps {
  data: DepartmentSummary[]
  onRowClick: (deptId: number) => void
}

/** 부서 목록 1페이지(content)만 렌더하는 표. 행 클릭 시 부서 상세로 이동하도록 onRowClick을 위임받는다. */
export function DepartmentsTable({ data, onRowClick }: DepartmentsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.deptInfoResponse.deptCode, {
        id: 'deptCode',
        header: '부서코드',
      }),
      columnHelper.accessor((row) => row.deptInfoResponse.deptName, {
        id: 'deptName',
        header: '부서명',
      }),
      columnHelper.accessor((row) => row.deptInfoResponse.isActive, {
        id: 'isActive',
        header: '활성여부',
        cell: (info) => (
          <span
            className={
              info.getValue()
                ? 'inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
                : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
            }
          >
            {info.getValue() ? '활성' : '비활성'}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.deptLeader?.empName ?? null, {
        id: 'deptLeader',
        header: '부서장',
        cell: (info) => info.getValue() ?? <span className="text-muted-foreground">미지정</span>,
      }),
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">조회된 부서가 없습니다.</p>
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
              onClick={() => onRowClick(row.original.deptInfoResponse.deptId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onRowClick(row.original.deptInfoResponse.deptId)
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
