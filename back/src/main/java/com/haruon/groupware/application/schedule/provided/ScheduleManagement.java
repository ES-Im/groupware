package com.haruon.groupware.application.schedule.provided;

import com.haruon.groupware.application.schedule.service.dto.ManualScheduleParam;

import java.util.Set;

/**
 * 일정 취소 및 참여자 변경
 */
public interface ScheduleManagement {

    /** return : 일정에 추가된 인원 수 */
    int addParticipants(Long scheduleId, Set<Long> empId, boolean isForBulkEdit);

    /** return : 일정에 삭제된 인원 수 */
    int removeParticipants(Long scheduleId, Set<Long> empId, boolean isForBulkEdit);

    /** return : 취소된 일정 수 */
    int cancelSchedule(Long scheduleId, boolean isForBulkEdit);

    /** return : 수기일정 내용 변경 성공여부(1=성공)*/
    int updateManualSchedule(Long scheduleId, boolean isForBulkEdit, ManualScheduleParam param);
}
