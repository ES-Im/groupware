package com.haruon.groupware.application.schedule.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@TestIntegrationConfig
record ScheduleRegisterTest(
    ScheduleRepository scheduleRepository,
    EmpRepository empRepository,
    DeptRepository deptRepository,
    ScheduleRegister scheduleRegister,
    DraftRepository draftRepository,
    EntityManager entityManager
) {

    @AfterEach
    void tearDown() {
        scheduleRepository.deleteAll();
        draftRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @DisplayName("활성화 사원이라면, 수기등록 일정을 등록할 수 있다")
    void register_manual_schedule_by_active_emp_success() {
        // given

        // when

        // then - owner = 참여자로 자동 추가
    }
    
    @Test
    @DisplayName("회의일정 등록시, 회의 일정이 등록된다.")
    void register_meeting_schedule_by_source_key_success() {
        // given - sourceKey로 Meeting이 조회되면 ScheduleType.MEETING 일정
        
        // when
        
        // then - 회의 날짜, 시작/종료시각, 회의실명이 content에 반영, 회의 예약자가 participant로 자동 추가된다.
    }
    
    @Test
    @DisplayName("휴가 기안 결재완료 시, 휴가 일정이 등록된다.")
    void register_leave_schedule_by_approved_leave_draft_success(){
        // given - LeaveDraft sourceKey로 일정 생성.

        // when
        
        // then - 휴가 시작일~종료일이 여러 날짜면 날짜별 일정이 나뉘어 생성
    }
    
    @Test
    @DisplayName("출장 기안 결재완료 시, 출장 일정이 등록된다.")
    void register_business_trip_schedule_by_approved_business_trip_draft_success() {
        // given - BusinessTripDraft sourceKey로 일정 생성.
        
        // when
        
        // then - 출장 기간이 여러 날짜면 날짜별 일정이 나뉘어 생성된다.
    }
    
    @Test
    @DisplayName("수기/회의/출장/휴가 타입이 아니면 일정 등록 실패")
    void register_schedule_by_unsupported_source_key_fail() {
        // given
        
        // when
        
        // then - "지원하지 않는 일정 타입"
    }
    
    @Test
    @DisplayName("비활성 사원은 일정을 등록할 수 없다")
    void register_schedule_by_inactive_owner_fail() {
        // given - scheduleOwner.ensureActive() = false
        
        // when
        
        // then
    }
    
    @Test
    @DisplayName("참가자 추가 시, 비활성 사원을 추가하면 실패한다.")
    void add_participant_by_inactive_emp_fail() {
        // given scheduleOwner.ensureActive() = false
        
        // when
        
        // then -
    }

    @Test
    @DisplayName("단일 일정 참가자 추가")
    void add_participant_to_single_schedule_success() {
        // given - isForBulkEdit=false.
        
        // when
        
        // then - 대상 schedule 하나에만 참가자가 추가된다.
    }
    
    @Test
    @DisplayName("동일 이벤트 전체 일정 참가자 추가")
    void add_participant_to_same_event_schedules_success() {
        // given - isForBulkEdit=true.

        // when
        
        // then - 같은 sourceKey를 가진 모든 일정에 참가자가 추가
    }
    
    @Test
    @DisplayName("단일 일정 참가자 삭제")
    void remove_participant_from_single_schedule_success() {
        // given - isForBulkEdit=false.
        
        // when
        
        // then -  대상 schedule 하나에서만 참가자가 제거된다.
    }
    
    @Test
    @DisplayName("동일 이벤트 전체 일정 참가자 삭제")
    void remove_participant_from_same_event_schedules_success() {
        // given isForBulkEdit=true.
        
        // when
        
        // then - 같은 sourceKey 일정 전체에서 참가자가 제거된다.
    }
    
    @Test
    @DisplayName("단일 이벤트 취소")
    void cancel_single_schedule_success() {
        // given - isForBulkEdit=false.
        
        // when
        
        // then - 대상 schedule 하나만 취소된다.
    }
    
    @Test
    @DisplayName("동일 이벤트 전체 일정 취소")
    void cancel_same_event_schedules_success() {
        // given - isForBulkEdit=true.
        
        // when
        
        // then - 같은 sourceKey 일정 전체가 취소된다.
    }

    @Test
    @DisplayName("수동일정 수정")
    void update_same_event_manual_schedules_success() {
        // given
        
        // when - updateManualSchedule(). 제목, 내용, 시작시각, 종료시각이 변경
        // bulk=false면 단일 일정만 변경된다.
        // bulk=true면 같은 sourceKey 일정 전체가 변경
        // then
    }
    
    @Test
    @DisplayName("여러 날짜 일정 시간 계산")
    void register_multi_day_schedule_split_by_company_work_time_success() {
        // 시작일: startAt ~ 회사 퇴근시간
        // 중간일: 회사 출근시간 ~ 회사 퇴근시간, allDay=true
        // 종료일: 회사 출근시간 ~ endAt
    }
}