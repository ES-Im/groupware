export const employeeKeys = {
  all: ['employee'] as const,
  me: () => [...employeeKeys.all, 'me'] as const,
  detail: (empId: number | undefined) => [...employeeKeys.all, 'detail', empId] as const,
  filesInfos: () => [...employeeKeys.all, 'filesInfos'] as const,
  empsForManagement: (params?: {
    deptId?: number
    status?: string
    keyword?: string
    page?: number
    size?: number
  }) => [...employeeKeys.all, 'empsForManagement', params] as const,
  newEmployees: (params?: { keyword?: string; page?: number; size?: number }) =>
    params === undefined
      ? ([...employeeKeys.all, 'newEmployees'] as const)
      : ([...employeeKeys.all, 'newEmployees', params] as const),
}
