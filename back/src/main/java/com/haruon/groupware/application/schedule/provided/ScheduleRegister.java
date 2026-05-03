package com.haruon.groupware.application.schedule.provided;

import com.haruon.groupware.application.schedule.service.ScheduleCreateRequest;

/**
 * 연차신청 결재, 출장신청 결재, 회의참여로 인한 일정 등록 및 정정
 */
public interface ScheduleRegister {

    /** return : 등록된 일정 건수 */
    String registerSchedules(ScheduleCreateRequest param);

}
