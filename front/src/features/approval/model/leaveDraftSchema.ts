import { z } from 'zod'

const LEAVE_TYPES = ['ANNUAL', 'HOURLY', 'SICK', 'OFFICIAL', 'COMPENSATORY', 'SPECIAL'] as const

export type LeaveType = (typeof LEAVE_TYPES)[number]

export const leaveTypeLabels: Record<LeaveType, string> = {
  ANNUAL: '연차',
  HOURLY: '공휴일',
  SICK: '병가',
  OFFICIAL: '공가',
  COMPENSATORY: '대체휴무',
  SPECIAL: '특별휴가',
}

export const leaveTypeOptions = LEAVE_TYPES.filter((value) => value !== 'HOURLY').map((value) => ({
  value,
  label: leaveTypeLabels[value],
}))

const isOnTheHour = (value: string) => /T\d{2}:00(:00)?$/.test(value)
const HOUR_UNIT_MESSAGE = '연가는 1시간 단위로만 사용할 수 있습니다(분 단위 선택 불가)'

export const leaveDraftSchema = z
  .object({
    title: z.string().trim().min(1, '제목을 입력해주세요'),
    content: z.string().trim().min(1, '기안 내용을 입력해주세요'),
    leaveType: z.enum(LEAVE_TYPES, { error: '휴가 유형을 선택해주세요' }),
    startAt: z
      .string()
      .min(1, '휴가 시작 일시를 입력해주세요')
      .refine(isOnTheHour, HOUR_UNIT_MESSAGE),
    endAt: z
      .string()
      .min(1, '휴가 종료 일시를 입력해주세요')
      .refine(isOnTheHour, HOUR_UNIT_MESSAGE),
  })
  .refine(
    (data) =>
      data.startAt === '' || data.endAt === '' || new Date(data.startAt) <= new Date(data.endAt),
    {
      message: '휴가 종료 일시는 시작 일시 이후여야 합니다',
      path: ['endAt'],
    },
  )

export type LeaveDraftFormValues = z.infer<typeof leaveDraftSchema>
