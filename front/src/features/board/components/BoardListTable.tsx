import { useMemo } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Paperclip } from 'lucide-react'
import type { BoardSummary } from '../model/board'

/**
 * 게시판 목록 표(F301, ROADMAP T10.3). `DepartmentMembersTable`(T2.1-b)의 컬럼 헬퍼 패턴을
 * 그대로 복제한다: `createColumnHelper<BoardSummary>()` + `getCoreRowModel()`만 사용(정렬/필터
 * 로우모델은 이번 스코프 밖 — 정렬/필터는 서버 파라미터(keyword)로만 처리한다).
 *
 * publishedAt은 서버가 `yyyy-MM-ddTHH:mm:ss` 원문(BOARD_LIST response-fields.adoc 실측)으로
 * 내려주므로 dayjs로 표시용 포맷(`YYYY-MM-DD HH:mm`)만 입혀 보여준다(값 자체는 가공하지 않음).
 */
const columnHelper = createColumnHelper<BoardSummary>()

interface BoardListTableProps {
  data: BoardSummary[]
  onRowClick: (boardId: number) => void
}

/** 게시글 1페이지(content)만 렌더하는 표. 행 클릭 시 게시글 상세로 이동하도록 onRowClick을 위임받는다. */
export function BoardListTable({ data, onRowClick }: BoardListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('boardTitle', { header: '제목' }),
      columnHelper.accessor('authorName', { header: '작성자' }),
      columnHelper.accessor('publishedAt', {
        header: '발행시각',
        cell: (info) => dayjs(info.getValue()).format('YYYY-MM-DD HH:mm'),
      }),
      columnHelper.accessor('viewCount', { header: '조회' }),
      columnHelper.accessor('likeCount', { header: '좋아요' }),
      columnHelper.accessor('commentCount', { header: '댓글' }),
      columnHelper.accessor('isFileAttached', {
        header: '첨부',
        cell: (info) =>
          info.getValue() ? (
            <Paperclip className="size-4 text-muted-foreground" aria-label="첨부파일 있음" />
          ) : null,
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
    return <p className="py-8 text-center text-sm text-muted-foreground">게시글이 없습니다.</p>
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
              onClick={() => onRowClick(row.original.boardId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onRowClick(row.original.boardId)
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
