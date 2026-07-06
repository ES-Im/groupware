import { create } from 'zustand'
import { clearAccessToken, setAccessToken } from '@/shared/api/tokenStore'

/**
 * GET /api/employees/me 응답(RETRIEVE_ME_INFO response-body.adoc)과 동일한 형태.
 */
export interface AuthUser {
  empBasicInfo: {
    empNo: string
    name: string
    loginId: string
    email: string
    extensionNo: string
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
  /** 시그니처만 정의한다. 본체(refreshToken 쿠키 기반 세션 복원)는 T1.4에서 구현한다. */
  bootstrap: () => Promise<void>
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  roles: [],
  status: 'idle',
}

/**
 * 인증 상태 zustand 스토어(ROADMAP T0.4 / §A-4).
 *
 * accessToken은 persist 미들웨어 없이 인메모리에만 보관한다(XSS 노출 위험 때문에
 * localStorage/sessionStorage 사용 금지). axios 인터셉터(shared/api/client.ts)는
 * 이 스토어가 아닌 tokenStore.ts를 단일 진실 공급원으로 참조하므로, setToken/clear는
 * 항상 tokenStore와 동기화한다.
 *
 * roles는 JWT `roles` claim(ROLE_ 접두어 포함)을 호출부가 디코드해 rawRoles로 넘기면
 * 이 스토어가 접두어를 제거해 정규화한다(security.md).
 */
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
    // 본체는 T1.4(세션 복원)에서 구현한다.
  },
}))
