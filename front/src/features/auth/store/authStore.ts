import { create } from 'zustand'
import { requestReissue } from '@/shared/api/client'
import { clearAccessToken, setAccessToken } from '@/shared/api/tokenStore'

export interface AuthUser {
  empBasicInfo: {
    empNo: string
    name: string
    loginId: string
    email: string
    extensionNo: string | null
  }
  activeFiles: Array<{
    file: {
      fileId: number
      originalName: string
      extension: string
      fileSize: number
    }
    type: string
    isActive: boolean
  }>
  currentDepts: Array<{
    deptId: number
    deptCode: string
    deptName: string
    positionName: string
    isPrimary: boolean
    startAt: string
    endAt: string | null
  }>
}

export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated'

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  roles: string[]
  status: AuthStatus
}

interface AuthActions {
  setToken: (token: string) => void
  setUser: (user: AuthUser, rawRoles: string[]) => void
  clear: () => void
  bootstrap: () => Promise<void>
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  roles: [],
  status: 'idle',
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,
  setToken: (token) => {
    setAccessToken(token)
    set({ accessToken: token })
  },
  setUser: (user, rawRoles) => {
    set({
      user,
      roles: rawRoles.map((role) => role.replace(/^ROLE_/, '')),
      status: 'authenticated',
    })
  },
  clear: () => {
    clearAccessToken()
    set({ ...initialState, status: 'unauthenticated' })
  },
  bootstrap: async () => {
    try {
      const accessToken = await requestReissue()
      setAccessToken(accessToken)
      set({ accessToken })
    } catch {
      clearAccessToken()
      set({ ...initialState, status: 'unauthenticated' })
    }
  },
}))
