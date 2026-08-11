import { useQueries } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import type { DeptMemberSearchResult } from '../model/deptMember'
import { getDepartmentMembers } from './getDepartmentMembers'
import { useDepartmentsQuery } from './useDepartmentsQuery'

const ALL_DEPARTMENTS_PAGE_SIZE = 500

const RESULT_SIZE_PER_DEPARTMENT = 20

export function useEmployeeNameSearchQuery(keyword: string) {
  const trimmedKeyword = keyword.trim()
  const enabled = trimmedKeyword.length > 0

  const departmentsQuery = useDepartmentsQuery(
    { isActive: true, size: ALL_DEPARTMENTS_PAGE_SIZE },
    { enabled },
  )
  const departments = departmentsQuery.data?.content ?? []

  const memberQueries = useQueries({
    queries: departments.map((dept) => {
      const deptId = dept.deptInfoResponse.deptId
      return {
        queryKey: departmentKeys.members(deptId, {
          keyword: trimmedKeyword,
          isEmpActive: true,
          size: RESULT_SIZE_PER_DEPARTMENT,
        }),
        queryFn: () =>
          getDepartmentMembers(deptId, {
            keyword: trimmedKeyword,
            isEmpActive: true,
            size: RESULT_SIZE_PER_DEPARTMENT,
          }),
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
