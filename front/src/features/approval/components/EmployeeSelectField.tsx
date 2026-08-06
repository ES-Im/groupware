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
  label: string
  description?: string
  selected: EmployeePickerEmployee[]
  onChange: (next: EmployeePickerEmployee[]) => void
  ordered?: boolean
  roleBadge?: string
  roleOptions?: { value: string; label: string }[]
  rolesByEmpId?: Record<number, string>
  onRoleChange?: (empId: number, role: string) => void
  emptyText?: string
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
