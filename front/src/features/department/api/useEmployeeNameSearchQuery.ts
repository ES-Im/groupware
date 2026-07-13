import { useQueries } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import type { DeptMemberSearchResult } from '../model/deptMember'
import { getDepartmentMembers } from './getDepartmentMembers'
import { useDepartmentsQuery } from './useDepartmentsQuery'

/** 전체 부서를 한 페이지에 담기 위한 size. DepartmentsExplorerLayout의 ALL_DEPARTMENTS_PAGE_SIZE와 동일 값. */
const ALL_DEPARTMENTS_PAGE_SIZE = 500

/** 부서 하나당 검색 결과 상한. 팬아웃 호출 비용을 제한하기 위한 값(넘치는 결과는 스크롤로 노출). */
const RESULT_SIZE_PER_DEPARTMENT = 20

/**
 * 전사 사원 이름 검색(헤더 검색 오버레이 전용). EMPLOYEE 권한으로 열려있는 전사 사원 검색
 * API가 없어(`EMPS_FOR_MANAGEMENT`는 HR/DEPT_MANAGER/ADMIN 전용), 전체 부서 목록을 조회한 뒤
 * 부서마다 `DEPT_MEMBERS`(keyword)를 병렬 호출해 결과를 취합하는 방식으로 "실질적 전사 검색"을
 * 구현한다(사용자 확정 결정 — 권한별 분기는 두지 않는다).
 *
 * keyword가 빈 문자열이면 부서 목록 조회부터 팬아웃 조회까지 전부 enabled:false로 대기한다 —
 * 검색어 없이 전체 부서 멤버를 훑는 것은 비용이 매우 커 반드시 막아야 한다. 디바운스는 이 훅을
 * 호출하는 쪽(EmployeeSearchOverlay)이 책임진다 — keyword는 이미 디바운스가 끝난 확정값으로 받는다.
 */
export function useEmployeeNameSearchQuery(keyword: string) {
  const trimmedKeyword = keyword.trim()
  const enabled = trimmedKeyword.length > 0

  const departmentsQuery = useDepartmentsQuery({ size: ALL_DEPARTMENTS_PAGE_SIZE }, { enabled })
  const departments = departmentsQuery.data?.content ?? []

  const memberQueries = useQueries({
    queries: departments.map((dept) => {
      const deptId = dept.deptInfoResponse.deptId
      return {
        queryKey: departmentKeys.members(deptId, {
          keyword: trimmedKeyword,
          size: RESULT_SIZE_PER_DEPARTMENT,
        }),
        queryFn: () =>
          getDepartmentMembers(deptId, { keyword: trimmedKeyword, size: RESULT_SIZE_PER_DEPARTMENT }),
        enabled,
      }
    }),
  })

  const items: DeptMemberSearchResult[] = []
  const seenEmpIds = new Set<number>()
  departments.forEach((dept, index) => {
    const page = memberQueries[index]?.data
    if (!page) {
      return
    }
    const { deptId, deptName } = dept.deptInfoResponse
    page.content.forEach((member) => {
      if (seenEmpIds.has(member.empId)) {
        return
      }
      seenEmpIds.add(member.empId)
      items.push({ ...member, deptId, deptName })
    })
  })

  return {
    items,
    isLoading: enabled && (departmentsQuery.isLoading || memberQueries.some((query) => query.isLoading)),
  }
}
