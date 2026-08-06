import { apiClient } from '@/shared/api/client'
import type { UpdateDeptManagedInfoFormValues } from '../model/updateDeptManagedInfoSchema'

export interface UpdateDeptManagedInfoRequest extends Omit<UpdateDeptManagedInfoFormValues, 'extensionNo'> {
  extensionNo?: string
}

export async function updateDeptManagedInfo(
  empId: number,
  values: UpdateDeptManagedInfoRequest,
): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/dept-managed-info`, values)
}
