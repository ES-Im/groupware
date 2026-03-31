package com.haruon.groupware.application.empInfo.attendanceService.dto;

import java.time.LocalDate;

import static java.util.Objects.requireNonNull;

public record AttendanceCloseParam(

        Long empId,

        LocalDate attendanceDate

) {
    public AttendanceCloseParam {
        requireNonNull(attendanceDate, "근태 기준 날짜는 null일 수 없음");
        requireNonNull(empId, "사원정보가 없음");
    }
}

// 배치 순서 (to-do)
/*
    1. 활성화된 직원 조회
    2. 해당 직원 중 기준 날짜에 attendance가 있는지 조회
    3. 있다면 해당 param에 attendance를 담고
    4. 없다면 schedule을 담음
    5. attendance와 schedule 둘다 없다면 emp정보와 date를 가져와서 부재 레코드 생성
    5. 이후 EmpAttendance.closeAttendance() 실행 후 attendance도 리스트 형태이므로 closeResult 반환한걸 save()
 */
