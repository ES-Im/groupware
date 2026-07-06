import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useAuthStore } from '../store/authStore'
import { useBootstrapAuth } from './useBootstrapAuth'

/**
 * T1.4 세션 복원(authStore.bootstrap + useBootstrapAuth)의 실제 동작을 검증한다.
 * REISSUE_TOKEN·RETRIEVE_ME_INFO 호출을 MSW로 목킹해 성공/실패 경로를 각각 확인한다.
 */

const REISSUE_URL = `${BASE_URL}/api/auth/reissue`
const ME_URL = `${BASE_URL}/api/employees/me`

const meFixture = {
  empBasicInfo: {
    empNo: '000000001',
    name: '홍길동',
    loginId: 'user01',
    email: 'user01@haruon.com',
    extensionNo: '101-0001',
  },
  activeFiles: [],
  currentDepts: [
    {
      deptId: 1,
      deptCode: 'HQ',
      deptName: '본사',
      positionName: '사원',
      isPrimary: true,
      startAt: '2024-01-01T00:00:00',
      endAt: null,
    },
  ],
}

/** {alg,typ} 헤더 + payload만 갖춘 가짜 JWT(서명 검증 없이 payload만 디코드하므로 서명은 더미). */
function makeFakeAccessToken(roles: string[]): string {
  const toBase64Url = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

  const header = toBase64Url({ alg: 'HS256', typ: 'JWT' })
  const payload = toBase64Url({
    sub: 'user01',
    roles,
    type: 'access',
    iat: 0,
    exp: 9999999999,
  })
  return `${header}.${payload}.signature`
}

function Harness() {
  useBootstrapAuth()
  const status = useAuthStore((s) => s.status)
  const roles = useAuthStore((s) => s.roles)
  const userName = useAuthStore((s) => s.user?.empBasicInfo.name ?? '')
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="roles">{roles.join(',')}</span>
      <span data-testid="userName">{userName}</span>
    </div>
  )
}

describe('useBootstrapAuth (T1.4 세션 복원)', () => {
  afterEach(() => {
    // 스토어는 모듈 싱글턴이므로 테스트 간 상태가 새지 않도록 초기화한다.
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('reissue 성공 시 me를 복원하고 status를 authenticated로 전이한다', async () => {
    const fakeToken = makeFakeAccessToken(['ROLE_EMPLOYEE', 'ROLE_HR'])
    server.use(
      http.post(REISSUE_URL, () => HttpResponse.json({ accessToken: fakeToken })),
      http.get(ME_URL, () => HttpResponse.json(meFixture)),
    )

    render(<Harness />)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    )
    expect(screen.getByTestId('userName')).toHaveTextContent('홍길동')
    // ROLE_ 접두어가 제거되어 정규화됐는지 확인.
    expect(screen.getByTestId('roles')).toHaveTextContent('EMPLOYEE,HR')
    expect(useAuthStore.getState().accessToken).toBe(fakeToken)
  })

  it('reissue 성공 → me 조회 실패 시 clear 후 status를 unauthenticated로 전이한다', async () => {
    const fakeToken = makeFakeAccessToken(['ROLE_EMPLOYEE'])
    server.use(
      http.post(REISSUE_URL, () => HttpResponse.json({ accessToken: fakeToken })),
      // 404는 queryClient의 재시도 대상이 아니므로(shared/api/queryClient.ts) waitFor가 빠르게 확정된다.
      http.get(ME_URL, () => HttpResponse.json({ code: 'RESOURCE_001' }, { status: 404 })),
    )

    render(<Harness />)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    )
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('reissue는 성공했지만 accessToken이 빈 문자열인 비정상 응답이면 clear 후 unauthenticated로 전이한다', async () => {
    server.use(http.post(REISSUE_URL, () => HttpResponse.json({ accessToken: '' })))

    render(<Harness />)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    )
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('reissue 실패(ROLE_002) 시 clear 후 status를 unauthenticated로 전이한다', async () => {
    server.use(
      http.post(REISSUE_URL, () =>
        HttpResponse.json(
          { code: 'ROLE_002', name: 'PERMISSION_DENIED_EXCEPTION', httpStatus: 401, message: '권한이 없습니다' },
          { status: 401 },
        ),
      ),
    )

    render(<Harness />)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    )
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
