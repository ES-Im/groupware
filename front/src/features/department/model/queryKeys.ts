export const departmentKeys = {
  all: ['department'] as const,
  detail: (deptId: number | undefined) => [...departmentKeys.all, 'detail', deptId] as const,
  members: (
    deptId: number | undefined,
    params?: { keyword?: string; isEmpActive?: boolean; page?: number; size?: number },
  ) => [...departmentKeys.all, 'members', deptId, params] as const,
  list: (params?: { keyword?: string; isActive?: boolean; page?: number; size?: number }) =>
    [...departmentKeys.all, 'list', params] as const,
}
