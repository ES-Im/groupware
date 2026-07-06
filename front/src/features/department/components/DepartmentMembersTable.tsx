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
    // T5.4: 개선된 셸의 넓어진 콘텐츠 영역에서 표에 `w-full`을 주면 브라우저 auto 레이아웃이
    // 남는 공간을 이메일 등 긴 컬럼에 과도하게 배분해, 직위처럼 짧은 마지막 컬럼이 화면 우측
    // 끝까지 밀려나 보이는 어색한 여백이 생긴다. width 클래스를 없애 표 자체가 콘텐츠 폭만큼만
    // shrink-wrap 되게 하고, max-w는 그 위에 상한선만 둔다(기능 변경 없음, 컬럼 구성·클릭·
    // 에러 분기 동일). 래퍼는 표 폭에 맞춰 hug(w-fit)하는 카드형 표면(ring+rounded+bg-card)을
    // 둘러 셸 카드 톤과 통일하고, 좁은 화면에서는 가로 스크롤로 오버플로를 흡수한다.
    <div className="w-fit max-w-full overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
      <table className="max-w-3xl border-collapse text-sm">
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
