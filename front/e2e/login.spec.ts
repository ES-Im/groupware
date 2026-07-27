import { test, expect } from '@playwright/test'

/**
 * 로그인 테스트 — 배포된 라이브 스택 대상
 * - 네거티브케이스: front→백엔드(api.h4ruon.com)→CORS→에러 매핑 전 구간을 검증
 * - 해피케이스: 실계정 로그인 → / 리다이렉트 → 새로고침해도 세션이 유지
 *
 * 선택자·플로우 근거(실제 컴포넌트):
 * - LoginForm: `#loginId`, `#password`, 제출 버튼 텍스트 "로그인", 에러는 `role="alert"`.
 * - LoginPage: 성공 시 navigate('/'). ProtectedRoute는 미인증이면 즉시 /login으로 되튕긴다.
 *   → "/에 머물고 로그인 폼(#loginId)이 사라짐" = 인증 성공 신호.
 */

const LOGIN_ENDPOINT = '/api/auth/login'
const REISSUE_ENDPOINT = '/api/auth/reissue'

test.describe('로그인 네거티브케이스', () => {
  test('네거티브 — 틀린 자격증명은 401을 받아 에러가 뜨고 /login에 머문다', async ({ page }) => {
    await page.goto('/login')
    // 배포본이 /login 화면을 실제로 렌더하는지(SPA 라우팅·정적 서빙 최소 검증)
    await expect(page.locator('#loginId')).toBeVisible()

    // 빈 값이면 zod 클라검증에 막혀 서버로 안 간다 → '채워진 틀린 값'으로 서버까지 도달
    await page.locator('#loginId').fill('e2e-nonexistent-user')
    await page.locator('#password').fill('e2e-wrong-password-1234')

    // 클릭과 동시에 로그인 응답을 대기 → 실제 백엔드 왕복(+CORS 통과)과 401을 확정
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes(LOGIN_ENDPOINT) && r.request().method() === 'POST',
      ),
      page.getByRole('button', { name: '로그인' }).click(),
    ])
    expect(response.status()).toBe(401)

    // 에러 매핑이 화면(role="alert")까지 렌더, 실패가 성공 흐름으로 새지 않음
    await expect(page.getByRole('alert').first()).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('해피패스 — 실계정 로그인 후 /에 도달하고 새로고침해도 세션이 유지된다', async ({ page }) => {
    const user = process.env.E2E_USER
    const pass = process.env.E2E_PASS

    await page.goto('/login')
    await page.locator('#loginId').fill(user!)
    await page.locator('#password').fill(pass!)
    await page.getByRole('button', { name: '로그인' }).click()

    // 다단계(로그인 → me조회 → roles디코드 → setUser → navigate('/'))가 전부 성공해야 /에 머문다.
    await expect(page).toHaveURL('/')
    await expect(page.locator('#loginId')).toHaveCount(0) // 로그인 폼 사라짐 = /login으로 안 튕김

    // 크로스 서브도메인 쿠키(refreshToken httpOnly · SameSite/Secure) 검증.
    // 새로고침 시 인메모리 토큰은 사라지고 앱이 쿠키로 세션을 복원(bootstrap → POST /reissue).
    // reissue가 200이면 프로덕션 쿠키 배선이 실제로 동작 — 로딩없이 확정.
    const [reissue] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes(REISSUE_ENDPOINT) && r.request().method() === 'POST',
      ),
      page.reload(),
    ])
    expect(reissue.status()).toBe(200)
    await expect(page).toHaveURL('/')
    await expect(page.locator('#loginId')).toHaveCount(0)
  })
})
