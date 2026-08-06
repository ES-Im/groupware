import { describe, expect, it } from 'vitest'
import {
  MEETING_ROOM_FILE_MAX_SIZE_BYTES,
  MeetingRoomFileValidationError,
  validateMeetingRoomFileUpload,
} from './meetingRoomFileValidation'

function makeFile(name: string, size: number): File {
  return new File([new Uint8Array(size)], name)
}

describe('validateMeetingRoomFileUpload', () => {
  it('허용 확장자(jpg/jpeg/png)·용량 이하이면 통과한다(예외 없음)', () => {
    expect(() => validateMeetingRoomFileUpload(makeFile('room.jpg', 100))).not.toThrow()
    expect(() => validateMeetingRoomFileUpload(makeFile('room.jpeg', 100))).not.toThrow()
    expect(() => validateMeetingRoomFileUpload(makeFile('room.png', 100))).not.toThrow()
  })

  it('허용되지 않는 확장자(gif)면 EXTENSION_NOT_ALLOWED/FILE_003으로 거부한다', () => {
    expect(() => validateMeetingRoomFileUpload(makeFile('room.gif', 100))).toThrow(
      MeetingRoomFileValidationError,
    )
    try {
      validateMeetingRoomFileUpload(makeFile('room.gif', 100))
    } catch (error) {
      expect(error).toBeInstanceOf(MeetingRoomFileValidationError)
      expect((error as MeetingRoomFileValidationError).reason).toBe('EXTENSION_NOT_ALLOWED')
      expect((error as MeetingRoomFileValidationError).code).toBe('FILE_003')
    }
  })

  it('확장자가 없으면 EXTENSION_NOT_ALLOWED로 거부하고 메시지에 "(확장자 없음)"이 포함된다', () => {
    try {
      validateMeetingRoomFileUpload(makeFile('room', 100))
      throw new Error('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(MeetingRoomFileValidationError)
      expect((error as MeetingRoomFileValidationError).message).toContain('(확장자 없음)')
    }
  })

  it('용량이 10MB를 초과하면 SIZE_EXCEEDED/FILE_002로 거부한다', () => {
    try {
      validateMeetingRoomFileUpload(makeFile('room.png', MEETING_ROOM_FILE_MAX_SIZE_BYTES + 1))
      throw new Error('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(MeetingRoomFileValidationError)
      expect((error as MeetingRoomFileValidationError).reason).toBe('SIZE_EXCEEDED')
      expect((error as MeetingRoomFileValidationError).code).toBe('FILE_002')
    }
  })

  it('확장자와 용량을 모두 위반해도 확장자 위반(EXTENSION_NOT_ALLOWED)만 먼저 던진다', () => {
    try {
      validateMeetingRoomFileUpload(makeFile('room.gif', MEETING_ROOM_FILE_MAX_SIZE_BYTES + 1))
      throw new Error('should have thrown')
    } catch (error) {
      expect((error as MeetingRoomFileValidationError).reason).toBe('EXTENSION_NOT_ALLOWED')
    }
  })

  it('용량이 정확히 최대치(10MB)이면 통과한다(초과만 거부)', () => {
    expect(() =>
      validateMeetingRoomFileUpload(makeFile('room.png', MEETING_ROOM_FILE_MAX_SIZE_BYTES)),
    ).not.toThrow()
  })
})
