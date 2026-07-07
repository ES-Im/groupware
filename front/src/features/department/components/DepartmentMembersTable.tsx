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

/**
 * @tanstack/react-table 최초 도입(ROADMAP T2.1-b). 이후 도메인 목록 화면이 복제할 표준 패턴:
 * 1) `createColumnHelper<RowType>()`로 타입 안전한 컬럼을 정의한다.
 * 2) 정렬/필터/페이징 로우모델은 이번 스코프 밖이므로 `getCoreRowModel()`만 사용한다
 *    (페이징 UI 제외, totalElements 등 메타는 응답에만 존재 — ROADMAP T2.1-b 스코프 확정).
 * 3) 헤더/셀 렌더는 항상 `flexRender`를 거친다(accessor에 `cell`을 지정하지 않으면
 *    react-table 기본 렌더러가 값을 문자열로 표시한다).
 * 4) dept-manager/admin 전용 "관리" 액션 컬럼은 `canManage`가 true일 때만 컬럼 배열 끝에
 *    조건부로 붙는다(false/undefined면 컬럼 자체가 없어 일반 사원에게는 기존 5열 표와 동일).
 *    이 컬럼은 조건부이므로 컬럼 정의를 모듈 상단 상수에서 컴포넌트 내부 `useMemo`로 옮겼다.
 */
const columnHelper = createColumnHelper<DeptMemberResponse>()

interface DepartmentMembersTableProps {
  data: DeptMemberResponse[]
  onRowClick: (empId: number) => void
  // canManage: dept-manager/admin 여부. role 계산은 상위 페이지(react-router-developer 담당)에서
  // 수행해 prop으로 주입한다. optional(기본 false)이라 아직 주입 전이어도 타입/렌더 회귀가 없다.
  canManage?: boolean
}

/** 부서 멤버 1페이지(content)만 렌더하는 표. 행 클릭 시 사원 상세로 이동하도록 onRowClick을 위임받는다. */
export function DepartmentMembersTable({
  data,
  onRowClick,
  canManage = false,
}: DepartmentMembersTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('empNo', { header: '사번' }),
      columnHelper.accessor('empName', { header: '이름' }),
      columnHelper.accessor('extensionNo', { header: '내선번호' }),
      columnHelper.accessor('email', { header: '이메일' }),
      columnHelper.accessor('position', { header: '직위' }),
      // canManage가 true일 때만 마지막에 "관리" 액션 컬럼을 추가한다. 값 접근이 없는 열이므로
      // accessor가 아닌 display 컬럼으로 정의한다.
      ...(canManage
        ? [
            columnHelper.display({
              id: 'actions',
              header: '관리',
              cell: ({ row }) => (
                <Button
                  variant="outline"
                  size="xs"
                  // 버튼 클릭 시 <tr>의 onClick으로 이벤트가 버블링되어 onRowClick이 중복
                  // 호출되는 것을 막는다(목적지는 동일하나 불필요한 중복 호출 방지).
                  onClick={(event) => {
                    event.stopPropagation()
                    onRowClick(row.original.empId)
                  }}
                >
                  <UserCog />
                  관리
                </Button>
              ),
            }),
          ]
        : []),
    ],
    [canManage, onRowClick],
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
    // 부서 상세 화면(레퍼런스 참고, 공통 레이아웃 제외 전체 폭 사용 확정)에서는 표가 카드
    // 컨테이너의 가용 폭을 전부 채워야 하므로 `w-full`로 되돌린다(T5.4 당시의 shrink-wrap
    // 결정을 이번 요청으로 갱신 — 컬럼 구성·클릭·에러 분기는 변경 없음). 좁은 화면에서는
    // 래퍼의 가로 스크롤로 오버플로를 흡수한다.
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
