import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
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
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { EmployeePicker, type EmployeePickerEmployee } from './EmployeePicker'

interface EmployeeSelectFieldProps {
  /** 섹션 라벨(예: 결재선, 참여자). */
  label: string
  /** 라벨 아래 한 줄 설명(예: 결재 순서대로 처리됩니다.). */
  description?: string
  /** 현재 선택된 사원 목록(제어형 — 소유·유지는 페이지). EmployeePicker와 동일 계약을 그대로 전달. */
  selected: EmployeePickerEmployee[]
  /** 선택 변경 콜백(페이지가 root 에러 해제 등 부가 처리를 감쌀 수 있음). */
  onChange: (next: EmployeePickerEmployee[]) => void
  /** 선택 순서를 순번 배지로 표시할지(결재선=true, 참여자=false). */
  ordered?: boolean
  /** 각 행 우측 역할 배지 텍스트(결재선="결재"). 없으면 배지 미표시. */
  roleBadge?: string
  /** 선택이 비었을 때 안내 문구. */
  emptyText?: string
  /** 다이얼로그 제목(기본은 `${label} 선택`). */
  dialogTitle?: string
}

/**
 * 사원 다중 선택 필드(레퍼런스 결재선 UI 이식 — "+ 추가" 트리거 + 선택 결과 행 리스트).
 *
 * 선택 UI는 다이얼로그 안에 기존 `EmployeePicker`를 그대로 넣어 재사용한다(EmployeePicker는 부모
 * 다이얼로그가 닫히면 쿼리가 정지되도록 이미 설계됨). 다이얼로그 밖에서는 선택 결과만 레퍼런스
 * 스타일 행 리스트(순번 + 이름 + 역할 배지 + 제거 버튼)로 렌더한다. 순서는 배열 인덱스를 그대로
 * 따르며(결재선 order 매핑 기준), EmployeePicker의 selected/onChange 계약은 변경하지 않는다.
 */
export function EmployeeSelectField({
  label,
  description,
  selected,
  onChange,
  ordered = false,
  roleBadge,
  emptyText = '선택된 사원이 없습니다.',
  dialogTitle,
}: EmployeeSelectFieldProps) {
  const [open, setOpen] = useState(false)

  function remove(empId: number) {
    onChange(selected.filter((emp) => emp.empId !== empId))
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Label>{label}</Label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="shrink-0">
              <UserPlus />
              추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{dialogTitle ?? `${label} 선택`}</DialogTitle>
              <DialogDescription>부서를 선택한 뒤 사원을 골라 추가합니다.</DialogDescription>
            </DialogHeader>
            <EmployeePicker selected={selected} onChange={onChange} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">완료</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selected.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {selected.map((emp, index) => (
            <li
              key={emp.empId}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              {ordered && (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{emp.empName}</span>
              {roleBadge && (
                <Badge variant="secondary" className="shrink-0">
                  {roleBadge}
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                onClick={() => remove(emp.empId)}
                aria-label={`${emp.empName} 제거`}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
