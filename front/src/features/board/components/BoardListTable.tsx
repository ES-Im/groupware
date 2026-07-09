import { useMemo } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Eye, Heart, MessageCircle, Paperclip } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { BoardSummary } from '../model/board'

/**
 * 게시판 목록 표(F301, ROADMAP T10.3). `DepartmentMembersTable`(T2.1-b)의 컬럼 헬퍼 패턴을
 * 그대로 복제한다: `createColumnHelper<BoardSummary>()` + `getCoreRowModel()`만 사용(정렬/필터
 * 로우모델은 이번 스코프 밖 — 정렬/필터는 서버 파라미터(keyword)로만 처리한다).
 *
 * 레퍼런스 목업 테이블(번호·카테고리·제목+요약·작성자·발행일·첨부)의 시각 패턴을 우리 계약
 * (BOARD_LIST response-fields.adoc)에 맞춰 재해석했다:
 * - 우리 BoardSummary에는 per-row 카테고리명·본문 요약 필드가 없다(목록은 단일 카테고리로 필터되어
 *   per-row 카테고리 배지가 중복 정보라 열을 두지 않고, 카테고리는 목록 헤더에서 한 번만 표기한다).
 *   //todo : [계약] per-row 본문 요약(레퍼런스의 회색 2줄)은 BOARD_LIST 응답에 없는 필드다 —
 *           요약을 노출하려면 백엔드 계약 확장이 필요(contract-conformance-reviewer 판단).
 * - 레퍼런스가 접은 조회/좋아요/댓글 수는 우리 실데이터라, 제목 아래 보조 줄(muted)로 옮겨 2줄
 *   리듬을 살리면서 정보를 유지한다.
 *
 * publishedAt은 서버가 `yyyy-MM-ddTHH:mm:ss` 원문(BOARD_LIST response-fields.adoc 실측)으로
 * 내려주므로 dayjs로 표시용 포맷(`YYYY-MM-DD HH:mm`)만 입혀 보여준다(값 자체는 가공하지 않음).
 */
const columnHelper = createColumnHelper<BoardSummary>()

/** 첨부 아이콘 셀만 중앙 정렬한다(그 외 텍스트 컬럼은 좌측 정렬). */
const COLUMN_ALIGN: Record<string, string> = {
  isFileAttached: 'text-center',
}

/** 셀 정렬 클래스(맵에 없으면 좌측 정렬). 헤더·본문 셀이 동일 규칙을 공유한다. */
function alignClass(columnId: string): string {
  return COLUMN_ALIGN[columnId] ?? 'text-left'
}

/** 게시글 지표(조회/좋아요/댓글) 한 항목. 제목 아래 보조 줄에 아이콘+숫자로 나열한다. */
function MetricStat({ icon: Icon, value }: { icon: typeof Eye; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Icon className="size-3.5" aria-hidden="true" />
      {value.toLocaleString()}
    </span>
  )
}

interface BoardListTableProps {
  data: BoardSummary[]
  onRowClick: (boardId: number) => void
}

/** 게시글 1페이지(content)만 렌더하는 표. 행 클릭 시 게시글 상세로 이동하도록 onRowClick을 위임받는다. */
export function BoardListTable({ data, onRowClick }: BoardListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('boardId', {
        header: '번호',
        cell: (info) => <span className="tabular-nums">#{info.getValue()}</span>,
      }),
      columnHelper.accessor('boardTitle', {
        header: '제목',
        cell: (info) => (
          <div className="flex min-w-0 flex-col gap-1">
            {/* 제목이 메타(작성자·날짜)·지표보다 확실히 두드러지도록 semibold로 올리고, 행이 클릭
                가능함을 알리는 hover 밑줄 피드백을 준다(행 <tr>의 group-hover에 연동). */}
            <span className="truncate font-semibold text-foreground group-hover:underline">
              {info.getValue()}
            </span>
            {/* 레퍼런스의 회색 요약 2줄 슬롯을 실데이터(조회·좋아요·댓글)로 채워 2줄 리듬을 유지한다. */}
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
              <MetricStat icon={Eye} value={info.row.original.viewCount} />
              <MetricStat icon={Heart} value={info.row.original.likeCount} />
              <MetricStat icon={MessageCircle} value={info.row.original.commentCount} />
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('authorName', { header: '작성자' }),
      columnHelper.accessor('publishedAt', {
        header: '발행일',
        cell: (info) => dayjs(info.getValue()).format('YYYY-MM-DD HH:mm'),
      }),
      columnHelper.accessor('isFileAttached', {
        header: '첨부',
        cell: (info) =>
          // 첨부 개수는 BOARD_LIST 응답에 없고 boolean(isFileAttached)만 있다 — 레퍼런스의 "1"
          // 같은 개수 대신 존재 여부만 아이콘/대시로 표기한다(근거 없는 개수 발명 금지).
          info.getValue() ? (
            <Paperclip className="inline size-4 text-muted-foreground" aria-label="첨부파일 있음" />
          ) : (
            <span className="text-muted-foreground/60" aria-label="첨부파일 없음">
              -
            </span>
          ),
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
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    'px-3 py-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground',
                    alignClass(header.column.id),
                  )}
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
              className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    'px-3 py-3 align-middle whitespace-nowrap text-muted-foreground',
                    alignClass(cell.column.id),
                  )}
                >
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
