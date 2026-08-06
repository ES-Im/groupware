import { apiClient } from '@/shared/api/client'
import type { LoginFormValues } from '../model/loginSchema'

export interface LoginResponse {
  accessToken: string
}

export async function login(values: LoginFormValues): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', values)
  return data
}
