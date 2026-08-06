import { apiClient } from '@/shared/api/client'
import type { UpdateHrManagedInfoFormValues } from '../model/updateHrManagedInfoSchema'

export interface UpdateHrManagedInfoRequest extends Omit<UpdateHrManagedInfoFormValues, 'password' | 'extensionNo'> {
  password?: string
  extensionNo?: string
}

export async function updateHrManagedInfo(
  empId: number,
  values: UpdateHrManagedInfoRequest,
): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/hr-managed-info`, values)
}
