package com.haruon.groupware.adapter.batch.attendance;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**todo
 * chunk 로 ㄱㄱ
 * - JobParameter -> 어제자 날짜 기준 -> @StepScope 적용필요
 * 1. 전날 기준 근태 DB에서 추출 (read)
 * 2. 서비스에서 attendanceStatus 상황에 맞게 고치는 로직 호출 (process)
 * 3. DB에 bulk update (write)
 */
@Slf4j
@RequiredArgsConstructor
public class ClosingAttendanceConfig {

}
