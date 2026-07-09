import { useMemo } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { getAttendanceStatusBadge } from '../lib/attendanceStatusBadge'
import type { AttendanceItem } from '../model/attendance'

/**
 * 내 근태 목록 표(F303). `BoardListTable`(T10.3)의 컬럼 헬퍼 패턴을 그대로 복제한다:
 * `createColumnHelper<AttendanceItem>()` + `getCoreRowModel()`만 사용(정렬/필터 로우모델은 스코프
 * 밖 — 필터는 서버 파라미터 yearMonth/status로만 처리한다). 행 클릭 상세 진입이 없는 조회 전용
 * 목록이라 BoardListTable의 onRowClick/role="button"/키보드 인터랙션 마크업은 제거했다.
 *
 * 표시 규칙(값 자체는 가공하지 않고 표시용 포맷만 입힘):
 *  - attendanceDate: 서버가 "yyyy-MM-dd" 원문(response-body.adoc 실측)을 내려주며 dayjs로 동일 포맷만 재확인.
 *  - startAt/endAt: 서버가 "HH:mm:ss" 원문을 내려주는데(예 "09:00:00"), 초 단위는 표에서 노이즈라
 *    앞 5글자(HH:mm)만 잘라 보여준다. null(시간 없음 상태: 연차/병가/결근)이면 "-".
 */
const columnHelper = createColumnHelper<AttendanceItem>()

/**
 * 컬럼별 정렬 클래스 맵(BoardListTable COLUMN_ALIGN 패턴 복제). 출근/퇴근 시각과 승인 배지는 중앙
 * 정렬하고, 그 외 텍스트 컬럼(일자·상태)은 기본 좌측 정렬한다.
 */
const COLUMN_ALIGN: Record<string, string> = {
  startAt: 'text-center',
  endAt: 'text-center',
  isApproved: 'text-center',
}

/** 헤더 셀 정렬 클래스(맵에 없으면 좌측 정렬). */
function headerAlignClass(columnId: string): string {
  return COLUMN_ALIGN[columnId] ?? 'text-left'
}

/** 본문 셀 클래스: 일자는 강조, 시각은 중앙+tabular-nums, 배지 컬럼은 중앙/좌측, 그 외는 muted. */
function cellClass(columnId: string): string {
  if (columnId === 'attendanceDate') {
    return 'font-medium tabular-nums text-foreground'
  }
  if (columnId === 'startAt' || columnId === 'endAt') {
    return 'text-center tabular-nums text-muted-foreground'
  }
  if (columnId === 'isApproved') {
    return 'text-center'
  }
  return 'text-left text-muted-foreground'
}

/** "HH:mm:ss" 원문에서 표시용 "HH:mm"만 자른다. null(시간 없음 상태)이면 "-"로 표기. */
function formatTime(value: string | null): string {
  return value ? value.slice(0, 5) : '-'
}

interface AttendanceTableProps {
  data: AttendanceItem[]
}

/** 근태 1페이지(content)만 렌더하는 조회 전용 표. */
export function AttendanceTable({ data }: AttendanceTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('attendanceDate', {
        header: '일자',
        cell: (info) => dayjs(info.getValue()).format('YYYY-MM-DD'),
      }),
      columnHelper.accessor('attendanceStatus', {
        header: '상태',
        cell: (info) => {
          const { label, variant } = getAttendanceStatusBadge(info.getValue())
          return <Badge variant={variant}>{label}</Badge>
        },
      }),
      columnHelper.accessor('startAt', {
        header: '출근',
        cell: (info) => formatTime(info.getValue()),
      }),
      columnHelper.accessor('endAt', {
        header: '퇴근',
        cell: (info) => formatTime(info.getValue()),
      }),
      columnHelper.accessor('isApproved', {
        header: '승인여부',
        cell: (info) =>
          info.getValue() ? (
            <Badge variant="secondary">승인</Badge>
          ) : (
            <Badge variant="outline">대기</Badge>
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
    return <p className="py-8 text-center text-sm text-muted-foreground">근태 기록이 없습니다.</p>
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
                  className={cn(
                    'px-4 py-2.5 font-medium whitespace-nowrap text-muted-foreground',
                    headerAlignClass(header.column.id),
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
            <tr key={row.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn('px-4 py-3 whitespace-nowrap', cellClass(cell.column.id))}
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
