package com.haruon.groupware.application.empInfo.attendanceService;

public class AttendanceCloseAssembler {


//    private final int companyWorkHour;
//    private final int companyBreakHour;
//    private final int requiredWorkHours;
//
//    private final List<AttendanceStatus> WORKING_STATUS = List.of(
//            AttendanceStatus.NORMAL, AttendanceStatus.ABSENT, AttendanceStatus.LATE_EARLY
//    );
//
//    public AttendanceCloseAssembler(CompanyPolicyPort port){
//        this.companyWorkHour = port.getWorkHours();
//        this.companyBreakHour = port.getBreakHours();
//        this.requiredWorkHours = this.companyWorkHour - this.companyBreakHour;
//    }
//
//
//    public AttendanceCloseResult closeAttendance (
//            AttendanceCloseParam param
//    ) {
//        requireNonNull(param);
//
//        if(param.schedules().isEmpty()) return confirmWithoutSchedule(param);     // 스케쥴 없음
//
//        Schedule allDaySchedule
//                = param.schedules().stream()
//                .filter(Schedule::isAllDay)
//                .findFirst().orElse(null);
//
//        if(allDaySchedule != null) return closeDayWithAllDaySchedule(param, allDaySchedule);    // 종일 일정있음
//
//        return closeDayPartialSchedule(param);  // 부분 일정있음
//    }
//
//    private AttendanceCloseResult confirmWithoutSchedule(AttendanceCloseParam param) {
//
//        if(param.attendance() == null) return new AttendanceCloseResult(registerAbsentAttendance(param.emp(), param.attendanceDate()), List.of());
//
//        Attendance attendance = param.attendance();
//
//        if(param.attendance().endAt == null) {
//            attendance.attendanceStatus = AttendanceStatus.ABSENT;
//        } else {
//            attendance.attendanceStatus = getStatusByRecognizedHours(attendance.startAt, attendance.getEndAt(), false);
//        }
//
//        return new AttendanceCloseResult(attendance, List.of());
//    }
//
//    private static AttendanceCloseResult closeDayWithAllDaySchedule(
//            AttendanceCloseParam param,
//            Schedule allDaySchedules
//    ) {
//
//        ScheduleType type = allDaySchedules.getScheduleType();
//        state(type != null, "일정 타입은 null이 될 수 없음");
//
//        Attendance attendance = new Attendance();
//        attendance.emp = param.emp();
//
//
//        switch (type) {
//            case LEAVE -> {
//                attendance.attendanceDate = allDaySchedules.getScheduleDate();
//                attendance.attendanceStatus = AttendanceStatus.ALL_DAY_LEAVE;
//            }
//            case BUSINESS_TRIP -> {
//                attendance.attendanceDate = allDaySchedules.getScheduleDate();
//                attendance.attendanceStatus = AttendanceStatus.NORMAL;
//                attendance.startAt = allDaySchedules.getStartAt();
//                attendance.endAt = allDaySchedules.getEndAt();
//            }
//        }
//
//        return new AttendanceCloseResult(attendance, List.of());
//    }
//
//    private AttendanceCloseResult closeDayPartialSchedule(AttendanceCloseParam param) {
//        List<Schedule> schedules = param.schedules();
//        Attendance mainAttendance = param.attendance();
//        List<Attendance> subAttendances = new ArrayList<>();
//
//        LocalTime entireStartAt = mainAttendance != null ? mainAttendance.startAt : null;
//        LocalTime entireEndAt = mainAttendance != null ? mainAttendance.endAt : null;
//
//        boolean isIncludeLeave = false;
//
//        for (Schedule schedule : schedules) {
//            LocalTime scheduleStartAt = schedule.getStartAt();
//            LocalTime scheduleEndAt = schedule.getEndAt();
//
//            if (schedule.getScheduleType() == ScheduleType.BUSINESS_TRIP) { // 출장이라면 메인 언텐 시간 조정만
//                entireStartAt = getEarlierTime(entireStartAt, scheduleStartAt);
//                entireEndAt = getLaterTime(entireEndAt, scheduleEndAt);
//            }
//
//            if (schedule.getScheduleType() == ScheduleType.LEAVE) { // 연차라면 아예 서브 어탠 객체 생성해서 리스트에 넣기
//                Attendance subAttendances = new Attendance();
//                subAttendances.emp = schedule.getEmp();
//                subAttendances.attendanceStatus = AttendanceStatus.HALF_DAY_LEAVE;
//                subAttendances.startAt = scheduleStartAt;
//                subAttendances.endAt = scheduleEndAt;
//                subAttendances.attendanceDate = schedule.getScheduleDate();
//                subAttendances.add(subAttendances);
//
//                isIncludeLeave = true;
//            }
//        }
//
//        if (mainAttendance == null) {       // 메인 어탠 없는 상황이라면
//            if (entireStartAt == null || entireEndAt == null) { // 출장시각으로 조정했는데도 없다면
//                return new AttendanceCloseResult(
//                        registerAbsentAttendance(param.emp(), param.attendanceDate()),  // 결근 기록으로 넘기기
//                        subAttendances
//                );
//            }
//
//            mainAttendance = new Attendance();
//
//            mainAttendance.emp = requireNonNull(param.emp());
//            mainAttendance.attendanceDate = requireNonNull(param.attendanceDate());  // 일단 메인어탠 직원정보랑 날짜정보 적고
//        }
//
//        if (entireStartAt == null || entireEndAt == null) {
//            mainAttendance.attendanceStatus = AttendanceStatus.ABSENT;      // 조정한 시간이 null이면 결근으로 찍고
//
//            return new AttendanceCloseResult(mainAttendance, subAttendances);
//        }
//
//        mainAttendance.startAt = entireStartAt;     // 조정한 시간 있으면 시간 고치고 상태 확인해서 메인 어탠 수정해서 넘기기
//        mainAttendance.endAt = entireEndAt;
//        mainAttendance.attendanceStatus =
//                getStatusByRecognizedHours(mainAttendance.startAt, mainAttendance.endAt, isIncludeLeave);
//
//        return new AttendanceCloseResult(mainAttendance, subAttendances);
//    }




}
