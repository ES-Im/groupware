import { useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, UserPlus, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
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
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'

interface EmployeeSelectFieldProps {
  /** 섹션 라벨(예: 결재선, 참여자). */
  label: string
  /** 라벨 아래 한 줄 설명(예: 결재 순서대로 처리됩니다.). */
  description?: string
  /** 현재 선택된 사원 목록(제어형 — 소유·유지는 페이지). EmployeePicker와 동일 계약을 그대로 전달. */
  selected: EmployeePickerEmployee[]
  /** 선택 변경 콜백(페이지가 root 에러 해제 등 부가 처리를 감쌀 수 있음). */
  onChange: (next: EmployeePickerEmployee[]) => void
  /** 선택 순서를 순번 배지로 표시할지(결재선=true, 참여자=false). true면 드래그 재정렬도 켠다. */
  ordered?: boolean
  /** 각 행 우측 역할 배지 텍스트(결재선="결재"). 없으면 배지 미표시. */
  roleBadge?: string
  /**
   * 행별 역할 select 옵션(예: APPROVAL_ROLE_OPTIONS). onRoleChange와 함께 제공하면 정적
   * roleBadge 대신 행마다 역할 select를 렌더한다(결재선 결재/협조 지정). 첫 옵션이 기본값.
   */
  roleOptions?: { value: string; label: string }[]
  /** empId → 현재 역할 값(roleOptions와 함께 사용). 미지정 empId는 첫 옵션으로 폴백. */
  rolesByEmpId?: Record<number, string>
  /** 행 역할 변경 콜백(roleOptions와 함께 사용 — 값 정규화는 페이지 책임). */
  onRoleChange?: (empId: number, role: string) => void
  /** 선택이 비었을 때 안내 문구. */
  emptyText?: string
  /** 다이얼로그 제목(기본은 `${label} 선택`). */
  dialogTitle?: string
}

interface SortableEmployeeRowProps {
  emp: EmployeePickerEmployee
  index: number
  ordered: boolean
  roleBadge?: string
  roleOptions?: { value: string; label: string }[]
  rolesByEmpId?: Record<number, string>
  onRoleChange?: (empId: number, role: string) => void
  onRemove: (empId: number) => void
}

/**
 * 선택 결과 한 행. ordered(결재선)일 때는 dnd-kit sortable 행이 되어 드래그 핸들(GripVertical)로
 * 순서를 바꿀 수 있다 — 행 전체가 아닌 핸들에만 리스너를 달아 역할 select·제거 버튼과의 포인터
 * 충돌을 피하고, 핸들은 버튼이라 키보드(스페이스+방향키, KeyboardSensor)로도 재정렬된다.
 * ordered가 아니면 useSortable을 disabled로 두어 일반 행으로 렌더된다(참여자·공람).
 */
function SortableEmployeeRow({
  emp,
  index,
  ordered,
  roleBadge,
  roleOptions,
  rolesByEmpId,
  onRoleChange,
  onRemove,
}: SortableEmployeeRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: emp.empId,
    disabled: !ordered,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-transparent bg-muted/40 px-3 py-2',
        isDragging && 'relative z-10 opacity-80 shadow-md',
      )}
    >
      {ordered && (
        <button
          type="button"
          aria-label={`${emp.empName} 순서 변경`}
          className="-ml-1 shrink-0 cursor-grab touch-none rounded-md p-1 text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      {ordered && (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {index + 1}
        </span>
      )}
      <Avatar className="size-7 shrink-0">
        <AvatarFallback className="bg-violet-100 text-[10px] font-bold text-violet-700">
          {emp.empName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{emp.empName}</span>
      {roleOptions && onRoleChange ? (
        // 역할 select(결재/협조): 네이티브 select 컨벤션(연가 유형 select 톤)을 행 크기에
        // 맞춰 h-8·text-xs로 소형화한다. 미지정 empId는 첫 옵션(기본 역할)으로 표시.
        <select
          aria-label={`${emp.empName} 역할 선택`}
          value={rolesByEmpId?.[emp.empId] ?? roleOptions[0]?.value ?? ''}
          onChange={(event) => onRoleChange(emp.empId, event.target.value)}
          className="h-8 shrink-0 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        roleBadge && (
          <Badge variant="secondary" className="shrink-0">
            {roleBadge}
          </Badge>
        )
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground"
        onClick={() => onRemove(emp.empId)}
        aria-label={`${emp.empName} 제거`}
      >
        <X />
      </Button>
    </li>
  )
}

/**
 * 사원 다중 선택 필드(레퍼런스 결재선 UI 이식 — "+ 추가" 트리거 + 선택 결과 행 리스트).
 *
 * 선택 UI는 다이얼로그 안에 기존 `EmployeePicker`를 그대로 넣어 재사용한다(EmployeePicker는 부모
 * 다이얼로그가 닫히면 쿼리가 정지되도록 이미 설계됨). 다이얼로그 밖에서는 선택 결과만 레퍼런스
 * 스타일 행 리스트(순번 + 이름 + 역할 배지 + 제거 버튼)로 렌더한다. 순서는 배열 인덱스를 그대로
 * 따르며(결재선 order 매핑 기준), EmployeePicker의 selected/onChange 계약은 변경하지 않는다.
 *
 * ordered(결재선)일 때는 dnd-kit(2026-07-11 사용자 승인 도입)로 행을 드래그해 순서를 바꿀 수
 * 있다. 재정렬 결과는 onChange로 새 배열을 올려보내 페이지의 order(index+1) 매핑에 그대로
 * 반영된다. PointerSensor는 터치를 포함하며(핸들에 touch-none), distance 제약으로 클릭과
 * 드래그를 구분한다.
 */
export function EmployeeSelectField({
  label,
  description,
  selected,
  onChange,
  ordered = false,
  roleBadge,
  roleOptions,
  rolesByEmpId,
  onRoleChange,
  emptyText = '선택된 사원이 없습니다.',
  dialogTitle,
}: EmployeeSelectFieldProps) {
  const [open, setOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function remove(empId: number) {
    onChange(selected.filter((emp) => emp.empId !== empId))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const oldIndex = selected.findIndex((emp) => emp.empId === active.id)
    const newIndex = selected.findIndex((emp) => emp.empId === over.id)
    if (oldIndex < 0 || newIndex < 0) {
      return
    }
    onChange(arrayMove(selected, oldIndex, newIndex))
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Label className="text-base font-bold">{label}</Label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            {/* 한 화면에 이 필드가 여러 개(결재선·공람·참여자)라 접근 이름으로 어느 목록의
                추가인지 구분한다(시각 라벨은 "추가" 유지). */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-primary hover:text-primary"
              aria-label={`${label} 추가`}
            >
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
        <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={selected.map((emp) => emp.empId)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-1.5">
              {selected.map((emp, index) => (
                <SortableEmployeeRow
                  key={emp.empId}
                  emp={emp}
                  index={index}
                  ordered={ordered}
                  roleBadge={roleBadge}
                  roleOptions={roleOptions}
                  rolesByEmpId={rolesByEmpId}
                  onRoleChange={onRoleChange}
                  onRemove={remove}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  )
}
