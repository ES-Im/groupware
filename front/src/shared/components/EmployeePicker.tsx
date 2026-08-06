import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useDepartmentMembersQuery } from '@/features/department/api/useDepartmentMembersQuery'
import { useDepartmentsQuery } from '@/features/department/api/useDepartmentsQuery'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'

const SEARCH_DEBOUNCE_MS = 300

export interface EmployeePickerEmployee {
  empId: number
  empName: string
}

interface EmployeePickerProps {
  selected: EmployeePickerEmployee[]
  onChange: (next: EmployeePickerEmployee[]) => void
  multiple?: boolean
  disabledEmpIds?: number[]
  memberPageSize?: number
}

export function EmployeePicker({
  selected,
  onChange,
  multiple = true,
  disabledEmpIds,
  memberPageSize = 50,
}: EmployeePickerProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined)
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => setKeyword(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword])

  const deptsQuery = useDepartmentsQuery({ isActive: true, size: 100 })
  const membersQuery = useDepartmentMembersQuery(selectedDeptId, {
    keyword: keyword || undefined,
    size: memberPageSize,
  })

  const depts = deptsQuery.data?.content ?? []
  const members = membersQuery.data?.content ?? []
  const disabledSet = new Set(disabledEmpIds ?? [])

  function isSelected(empId: number) {
    return selected.some((s) => s.empId === empId)
  }

  function toggle(emp: EmployeePickerEmployee) {
    if (disabledSet.has(emp.empId)) {
      return
    }
    if (isSelected(emp.empId)) {
      onChange(selected.filter((s) => s.empId !== emp.empId))
      return
    }
    onChange(multiple ? [...selected, emp] : [emp])
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">부서</p>
          <div className="h-48 overflow-y-auto rounded-lg border p-1">
            {deptsQuery.isLoading ? (
              <p className="p-2 text-xs text-muted-foreground">부서를 불러오는 중...</p>
            ) : depts.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">부서가 없습니다.</p>
            ) : (
              <ul className="space-y-0.5">
                {depts.map((dept) => {
                  const info = dept.deptInfoResponse
                  const active = info.deptId === selectedDeptId
                  return (
                    <li key={info.deptId}>
                      <button
                        type="button"
                        onClick={() => setSelectedDeptId(info.deptId)}
                        className={cn(
                          'w-full truncate rounded px-2 py-1.5 text-left text-sm hover:bg-accent',
                          active && 'bg-accent font-medium',
                        )}
                      >
                        {info.deptName}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">부서원</p>
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="이름 검색"
            disabled={selectedDeptId === undefined}
            aria-label="부서원 이름 검색"
          />
          <div className="h-40 overflow-y-auto rounded-lg border p-1">
            {selectedDeptId === undefined ? (
              <p className="p-2 text-xs text-muted-foreground">부서를 먼저 선택해주세요.</p>
            ) : membersQuery.isLoading ? (
              <p className="p-2 text-xs text-muted-foreground">부서원을 불러오는 중...</p>
            ) : members.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">부서원이 없습니다.</p>
            ) : (
              <ul className="space-y-0.5">
                {members.map((member) => {
                  const checked = isSelected(member.empId)
                  const disabled = disabledSet.has(member.empId)
                  return (
                    <li key={member.empId}>
                      <button
                        type="button"
                        onClick={() => toggle({ empId: member.empId, empName: member.empName })}
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
                        <span className="min-w-0 truncate">{member.empName}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {member.position}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          {membersQuery.data && !membersQuery.data.last && (
            <p className="text-xs text-muted-foreground">
              결과가 많습니다. 이름으로 검색해 좁혀주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
