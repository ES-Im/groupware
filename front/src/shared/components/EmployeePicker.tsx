import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useDepartmentMembersQuery } from '@/features/department/api/useDepartmentMembersQuery'
import { useDepartmentsQuery } from '@/features/department/api/useDepartmentsQuery'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'

/** 부서원 검색 디바운스 지연(ms). department 도메인(DepartmentsPage·DepartmentDetailView)과 동일 값. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * EmployeePicker가 다루는 사원 선택 단위(empId + 표시용 empName).
 * 소비처는 이 배열로 각자 필요한 payload를 만든다:
 *   - 취소기안 결재선(T4.5): `selected.map((e,i)=>({approverId:e.empId, role:'APPROVER', order:i+1}))`
 *   - 공람 대상(M5 F707): `selected.map(e=>e.empId)` (empIds[])
 */
export interface EmployeePickerEmployee {
  empId: number
  empName: string
}

interface EmployeePickerProps {
  /** 현재 선택된 사원 목록(제어형 — 소유·유지는 소비처). */
  selected: EmployeePickerEmployee[]
  /** 선택 변경 콜백. */
  onChange: (next: EmployeePickerEmployee[]) => void
  /** 다중 선택 여부(기본 true). false면 새 선택이 기존 선택을 대체하는 단일 선택 모드. */
  multiple?: boolean
  /**
   * 선택 불가로 표시할 empId 집합(비활성 렌더). 예: M5 공람 추가 시 이미 공람 지정된 사원,
   * 결재선/공람에서 제외할 본인 등. 소비처가 도메인 규칙에 맞게 채운다.
   */
  disabledEmpIds?: number[]
  /** 부서원 목록 페이지 크기(기본 50). 키워드 검색으로 좁히는 것을 전제로 한 넉넉한 단일 페이지. */
  memberPageSize?: number
}

/**
 * 사원 검색/선택 공용 컴포넌트(ROADMAP(DRAFT) T4.4 — M4 취소기안 결재선·M5 공람 대상 공용).
 *
 * 일반 사원(EMPLOYEE)이 쓸 수 있는 표준 후보 조회 경로가 **부서 선택(DEPTS) → 부서원 목록
 * (DEPT_MEMBERS, EMPLOYEE 게이트·부서제약 없음)**뿐이라(PRD Open Q#1, team-lead 확정), 그
 * 흐름을 그대로 구현한다. department 도메인의 기존 조회 훅(useDepartmentsQuery·
 * useDepartmentMembersQuery)을 **그대로 재사용**한다(신규 사원 검색 API 발명 금지).
 *
 * 제어형(controlled): 선택 상태(`selected`)의 소유·유지는 소비처가 하고, 이 컴포넌트는 부서/부서원
 * 탐색 UI와 토글만 담당한다. 이렇게 두면 취소기안(결재선=role/order 부가)과 공람(empIds only)이
 * 같은 선택 결과 배열을 서로 다른 payload로 매핑해 재사용할 수 있다.
 *
 * 조회 라이프사이클: 이 컴포넌트가 마운트된 동안에만 부서/부서원 쿼리가 활성이다(부모 다이얼로그가
 * 닫히면 Radix가 content를 언마운트 → 쿼리 정지). 부서원 쿼리는 부서 선택 전 enabled:false로 대기.
 */
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

  // 검색 입력 디바운스(DepartmentsPage와 동일 패턴): 300ms 유예 후에만 확정된 keyword를 쿼리에
  // 반영해 키 입력마다 DEPT_MEMBERS 요청이 발생하는 것을 막는다.
  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => setKeyword(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword])

  // 활성 부서만 후보로 노출한다. 부서 수는 많지 않아 넉넉한 단일 페이지로 조회한다(page 미노출).
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
      {/* 선택된 사원 칩(선택 순서 유지 — 결재선 order 매핑의 기준). */}
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
        {/* 부서 목록 */}
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

        {/* 부서원 목록 */}
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
          {/* 검색으로 좁히도록 유도: 결과가 한 페이지를 넘으면 안내(페이지네이션은 MVP 범위 밖). */}
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
