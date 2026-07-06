import { create } from 'zustand'
import { requestReissue } from '@/shared/api/client'
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
  /**
   * 부팅/새로고침 세션 복원(ROADMAP T1.4). REISSUE_TOKEN(`POST /api/auth/reissue`)을 1회
   * 호출해 refreshToken 쿠키로 새 accessToken을 받아 setToken한다. 실패(주로 ROLE_002: 쿠키
   * 없음/만료/무효)하면 clear()로 status를 unauthenticated로 확정한다.
   *
   * 사용자 정보 복원(useMeQuery)·status=authenticated 전이는 이 액션의 책임이 아니다 — 이
   * 액션은 store 단독 모듈이라 React Query 훅을 쓸 수 없으므로, 호출부인 부팅 훅
   * (features/auth/hooks/useBootstrapAuth.ts)이 이 액션 성공 후 이어서 처리한다.
   */
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
    try {
      const accessToken = await requestReissue()
      setAccessToken(accessToken)
      set({ accessToken })
    } catch {
      // reissue 실패(대개 ROLE_002: refreshToken 쿠키 없음/만료/무효) → 세션 없음으로 확정.
      clearAccessToken()
      set({ ...initialState, status: 'unauthenticated' })
    }
  },
}))
