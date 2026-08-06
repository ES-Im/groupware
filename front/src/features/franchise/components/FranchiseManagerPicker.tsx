import { useMemo, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import type { EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'
import { useFranchiseAssignableManagersQuery } from '../api/useFranchiseAssignableManagersQuery'

interface FranchiseManagerPickerProps {
  selected: EmployeePickerEmployee[]
  onChange: (next: EmployeePickerEmployee[]) => void
  multiple?: boolean
  disabledEmpIds?: number[]
}

export function FranchiseManagerPicker({
  selected,
  onChange,
  multiple = true,
  disabledEmpIds,
}: FranchiseManagerPickerProps) {
  const [keyword, setKeyword] = useState('')
  const { data, isLoading, error } = useFranchiseAssignableManagersQuery()

  const managers = data ?? []
  const disabledSet = new Set(disabledEmpIds ?? [])

  const filtered = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase()
    if (!trimmed) {
      return managers
    }
    return managers.filter((manager) => manager.empName.toLowerCase().includes(trimmed))
  }, [managers, keyword])

  function isSelected(empId: number) {
    return selected.some((s) => s.empId === empId)
  }

  function toggle(manager: EmployeePickerEmployee) {
    if (disabledSet.has(manager.empId)) {
      return
    }
    if (isSelected(manager.empId)) {
      onChange(selected.filter((s) => s.empId !== manager.empId))
      return
    }
    onChange(multiple ? [...selected, manager] : [manager])
  }

  function removeSelected(empId: number) {
    onChange(selected.filter((s) => s.empId !== empId))
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((emp) => (
            <span
              key={emp.empId}
              className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs text-foreground"
            >
              {emp.empName}
              <button
                type="button"
                onClick={() => removeSelected(emp.empId)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`${emp.empName} 선택 해제`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="이름 검색"
          aria-label="가맹점 담당 사원 이름 검색"
          className="pl-8"
        />
      </div>

      <div className="h-56 overflow-y-auto rounded-lg border p-1">
        {isLoading ? (
          <p className="p-2 text-xs text-muted-foreground">불러오는 중...</p>
        ) : error ? (
          <p className="p-2 text-xs text-muted-foreground">사원 목록을 불러오지 못했습니다.</p>
        ) : filtered.length === 0 ? (
          <p className="p-2 text-xs text-muted-foreground">
            {managers.length === 0 ? '가맹점 권한 사원이 없습니다.' : '검색 결과가 없습니다.'}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((manager) => {
              const checked = isSelected(manager.empId)
              const disabled = disabledSet.has(manager.empId)
              return (
                <li key={manager.empId}>
                  <button
                    type="button"
                    onClick={() => toggle({ empId: manager.empId, empName: manager.empName })}
                    disabled={disabled}
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent',
                      checked && 'bg-accent',
                      disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded border',
                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                      )}
                    >
                      {checked && <Check className="size-3" />}
                    </span>
                    <span className="min-w-0 truncate">{manager.empName}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
