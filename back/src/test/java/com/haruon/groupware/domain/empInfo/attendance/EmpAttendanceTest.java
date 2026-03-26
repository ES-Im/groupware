package com.haruon.groupware.domain.empInfo.attendance;

import static org.junit.jupiter.api.Assertions.*;

class EmpAttendanceTest {
    // 테스트 항목 to - do : schedule 엔티티 끝나면 시행
    /*
     * 근태마감시 attendanceCloseParam -> 도메인 내 정책/행위 메서드 이용해서 CloseResult로 내려줌
     */

    // registerAttendanceByEmp - 직원이 출근 찍으면 객체가 생성됌

    // recordEndAtByEmp - 직원이 퇴근 찍으면 이미 생성된 당일 메인 어텐에 퇴근 시간이 찍힘

    // recordEndAtByEmp - 배치용 메서드, 상황에 따라 처리하는 마감법 다름
    /* 1. private confirmWithoutSchedule : 스케쥴 없을때 case
     *  - Result = 서브 어텐 리스트는 빈 list
     *  - 당일 직원이 출근찍어서 어텐이 있다면 -> 퇴근시간안 찍혀있으면 상태 ABSENT로 변경 후 Result
     *  - 당일 직원이 출근안찍어서 어텐이 없다면 -> registerAbsentAttendance -> 새로운 객체 상태 ABSENT로 찍고 후 Result
     *
     * 2. private closeDayWithAllDaySchedule : 종일 일정만 있을 때
     *  - Result = 서브 어텐 리스트는 빈 list
     *  - 스케쥴이 연차일때, 출장일때에 맞춰서 새 객체 꾸려서 Result
     *
     * 3. closeDayPartialSchedule
     *  - 반차 일 때 :
     *      메인 어탠 Result
     *          1. 4시간 근무하면 정상근무
     *          2. 2시간 이상 근무하면 지각 혹은 조퇴
     *          3. 2시간 미만 근무하면 결근
     *      서브 어탠 Result
     *          1. 반차 시작시간 종료시간을 포함해서 새로운 객체 리스트에 담김
     *  - 출장 일 때 :
     *      메인 어탠 Result
     *          1. 출근시간이 null이거나 출장 시작시각보다 늦는 경우 : 메인 어탠의 출장 시작시간으로 바꿔서 상태 체크(getStatusByRecognizedHours)함
     *          2. 퇴근시간이 null이거나 출장 종료시각보다 이른 경우 : 메인 어탠의 출장 종료시간으로 바꿔서 상태 체크
     *      서브 어탠 Result - 없음
     */

    // 근태 수정 AttendanceEditParam -> changeAttendanceByDeptManager

    // 근태 승인 approveAttendance

}