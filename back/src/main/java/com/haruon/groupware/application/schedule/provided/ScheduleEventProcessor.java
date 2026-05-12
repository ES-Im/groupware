package com.haruon.groupware.application.schedule.provided;

import java.util.Set;

/**
 * Domain Event에 의해 일정 등록/수정/취소
 * createSchedule <- 휴가기안승인, 출장기안승인, 회의예약
 * updateParticipants <- 회의참가자 추가
 * deleteParticipants <- 회의참가자 삭제
 * withdrewSchedule <- 휴가취소기안 승인, 출장취소기안 승인, 회의취소
 */
public interface ScheduleEventProcessor {

    void applyScheduleCreation(String sourceKey);

    void applyParticipantAddition(
            String sourceKey, Set<Long> participantEmpIds
    );

    void applyParticipantRemoval(
            String sourceKey, Set<Long> participantEmpIds
    );

    void applyScheduleCancellation(String sourceKey);

}
