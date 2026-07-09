import type { ReactNode } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import type { EmployeePickerEmployee } from './EmployeePicker'

/** 미리보기에 표시할 필드 한 줄(라벨 + 값). 값이 비면 "-"로 대체된다. */
export interface DraftPreviewField {
  label: string
  value: ReactNode
}

interface DraftPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 기안서 타입명(예: 일반기안서) — 미리보기 부제에 노출. */
  typeLabel: string
  /** 타입별 필드 목록(제목/본문/타입 고유 필드 등). 페이지가 현재 폼 값으로 채운다. */
  fields: DraftPreviewField[]
  /** 결재선(선택 순서 유지). */
  approvers: EmployeePickerEmployee[]
}

/** 값이 비었는지 판정(빈 문자열·null·undefined). */
function isEmptyValue(value: ReactNode) {
  return value === '' || value === null || value === undefined
}

/**
 * 기안서 미리보기 모달(백엔드 호출 없는 순수 클라이언트 프리뷰).
 *
 * 페이지가 현재 폼 값(getValues)으로 만든 필드 목록과 결재선을 읽기 전용으로 정리해 보여준다.
 * 4종 작성 페이지가 각자 필드를 채워 공통 모달을 재사용한다(필드 구성은 페이지 책임).
 */
export function DraftPreviewDialog({
  open,
  onOpenChange,
  typeLabel,
  fields,
  approvers,
}: DraftPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>기안서 미리보기</DialogTitle>
          <DialogDescription>{typeLabel} · 상신 전 입력한 내용을 확인하세요.</DialogDescription>
        </DialogHeader>

        <dl className="flex flex-col divide-y rounded-lg border">
          {fields.map((field) => (
            <div
              key={field.label}
              className="grid grid-cols-[minmax(5rem,7rem)_1fr] gap-3 px-3 py-2.5"
            >
              <dt className="text-sm text-muted-foreground">{field.label}</dt>
              <dd className="min-w-0 text-sm break-words whitespace-pre-wrap">
                {isEmptyValue(field.value) ? (
                  <span className="text-muted-foreground">-</span>
                ) : (
                  field.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">결재선</h3>
          {approvers.length === 0 ? (
            <p className="text-sm text-muted-foreground">지정된 결재자가 없습니다.</p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {approvers.map((emp, index) => (
                <li
                  key={emp.empId}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{emp.empName}</span>
                  <Badge variant="secondary" className="shrink-0">
                    결재
                  </Badge>
                </li>
              ))}
            </ol>
          )}
        </section>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              닫기
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
