import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { updateAttendance } from './updateAttendance'

/**
 * updateAttendance(F307·DEPT_ATTENDANCE_UPDATE, ROADMAP T4.2) 단위 테스트.
 *
 * apiClient.patch를 직접 모킹해 axios 호출 인자(URL에 attendanceId path param 포함, 바디)만
 * 검증한다(getDeptAttendanceMonthly.test.ts와 동일한 조건부 필드 생략 검증 패턴).
 *
 * startAt/endAt은 falsy(빈 문자열 ''/undefined)면 body에서 생략되어야 한다 — 빈 문자열을
 * 그대로 서버에 보내면 안 된다는 것이 이번 태스크의 핵심 요구사항.
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('updateAttendance', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockClear()
  })

  it('attendanceId path param을 그대로 사용한 URL로 PATCH 요청한다', async () => {
    await updateAttendance(42, {
      targetEmpId: 7,
      startAt: '09:00:00',
      endAt: '',
      editReason: '지각 정정',
      editedAt: '2026-07-08T10:00:00',
    })

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/employees/attendances/42')
  })

  it('startAt/endAt이 둘 다 있으면 body에 그대로 포함된다', async () => {
    await updateAttendance(1, {
      targetEmpId: 7,
      startAt: '09:00:00',
      endAt: '18:00:00',
      editReason: '출퇴근 시각 정정',
      editedAt: '2026-07-08T10:00:00',
    })

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toEqual({
      targetEmpId: 7,
      editedAt: '2026-07-08T10:00:00',
      editReason: '출퇴근 시각 정정',
      startAt: '09:00:00',
      endAt: '18:00:00',
    })
  })

  it('startAt만 있으면 endAt은 body에서 생략된다', async () => {
    await updateAttendance(1, {
      targetEmpId: 7,
      startAt: '09:00:00',
      endAt: '',
      editReason: '출근 시각 정정',
      editedAt: '2026-07-08T10:00:00',
    })

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toEqual({
      targetEmpId: 7,
      editedAt: '2026-07-08T10:00:00',
      editReason: '출근 시각 정정',
      startAt: '09:00:00',
    })
    expect(body).not.toHaveProperty('endAt')
  })

  it('endAt만 있으면 startAt은 body에서 생략된다', async () => {
    await updateAttendance(1, {
      targetEmpId: 7,
      startAt: '',
      endAt: '18:00:00',
      editReason: '퇴근 시각 정정',
      editedAt: '2026-07-08T10:00:00',
    })

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toEqual({
      targetEmpId: 7,
      editedAt: '2026-07-08T10:00:00',
      editReason: '퇴근 시각 정정',
      endAt: '18:00:00',
    })
    expect(body).not.toHaveProperty('startAt')
  })

  it('startAt/endAt이 둘 다 빈 문자열이면 둘 다 body에서 생략된다', async () => {
    await updateAttendance(1, {
      targetEmpId: 7,
      startAt: '',
      endAt: '',
      editReason: '사유만 정정',
      editedAt: '2026-07-08T10:00:00',
    })

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toEqual({
      targetEmpId: 7,
      editedAt: '2026-07-08T10:00:00',
      editReason: '사유만 정정',
    })
    expect(body).not.toHaveProperty('startAt')
    expect(body).not.toHaveProperty('endAt')
  })

  it('startAt/endAt이 둘 다 undefined여도 둘 다 body에서 생략된다', async () => {
    await updateAttendance(1, {
      targetEmpId: 7,
      startAt: undefined,
      endAt: undefined,
      editReason: '사유만 정정',
      editedAt: '2026-07-08T10:00:00',
    })

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toEqual({
      targetEmpId: 7,
      editedAt: '2026-07-08T10:00:00',
      editReason: '사유만 정정',
    })
  })

  it('targetEmpId/editedAt/editReason은 항상 body에 포함된다', async () => {
    await updateAttendance(1, {
      targetEmpId: 99,
      startAt: '09:00:00',
      endAt: '',
      editReason: '테스트 사유',
      editedAt: '2026-07-08T12:34:56',
    })

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toMatchObject({
      targetEmpId: 99,
      editedAt: '2026-07-08T12:34:56',
      editReason: '테스트 사유',
    })
  })

  it('204 응답이므로 반환값이 없다(void)', async () => {
    const result = await updateAttendance(1, {
      targetEmpId: 7,
      startAt: '09:00:00',
      endAt: '',
      editReason: '테스트',
      editedAt: '2026-07-08T10:00:00',
    })
    expect(result).toBeUndefined()
  })
})
