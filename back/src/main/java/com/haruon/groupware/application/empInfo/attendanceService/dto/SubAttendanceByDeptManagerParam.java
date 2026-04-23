package com.haruon.groupware.application.empInfo.attendanceService.dto;

//
//@Builder
//public record SubAttendanceByDeptManagerParam(
//
//        String sourceKey,
//
//        LocalTime startAt,
//        LocalTime endAt,
//
//        AttendanceStatus status
//) {
//    public SubAttendanceByDeptManagerParam {
//        requireNonNull(sourceKey, "대상 연차보고서 soruceKey 필수");
//        requireNonNull(startAt, "서브 근태 시작시각 필수");
//        requireNonNull(endAt, "서브 근태 종료시각 필수");
//        requireNonNull(status, "서브 근태 상태 필수");
//        state(!endAt.isBefore(startAt), "서브 근태 종료시각은 시작시각보다 빠를 수 없음");
//    }
//}
