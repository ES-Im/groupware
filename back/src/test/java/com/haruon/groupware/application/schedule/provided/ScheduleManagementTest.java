package com.haruon.groupware.application.schedule.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.draft.provided.BusinessTripDraftManagement;
import com.haruon.groupware.application.draft.provided.GeneralDraftManagement;
import com.haruon.groupware.application.draft.provided.LeaveDraftManagement;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.dto.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.LeaveDraftCreateRequest;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.meeting.provided.MeetingManagement;
import com.haruon.groupware.application.meeting.provided.MeetingRoomManagement;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.application.meeting.service.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.schedule.contentFormatter.BusinessTripScheduleContentDto;
import com.haruon.groupware.application.schedule.contentFormatter.LeaveScheduleContentDto;
import com.haruon.groupware.application.schedule.contentFormatter.MeetingScheduleContentDto;
import com.haruon.groupware.application.schedule.contentFormatter.ScheduleContentFormatter;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.schedule.service.ManualScheduleParam;
import com.haruon.groupware.application.schedule.service.ScheduleCreateRequest;
import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.meeting.Meeting;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleParticipant;
import com.haruon.groupware.domain.schedule.ScheduleType;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.haruon.groupware.application.dbFixture.EmpFixture.*;
import static com.haruon.groupware.domain.empInfo.EmpLeave.createEmpLeave;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

@Slf4j
@TestIntegrationConfig
record ScheduleManagementTest(
    ScheduleRepository scheduleRepository,
    EmpRepository empRepository,
    DeptRepository deptRepository,
    DraftRepository draftRepository,
    MeetingRepository meetingRepository,
    MeetingRoomRepository meetingRoomRepository,
    EmpLeaveRepository empLeaveRepository,

    ScheduleRegister scheduleRegister,
    ScheduleEditing scheduleEditing,
    MeetingManagement meetingManagement,
    MeetingRoomManagement meetingRoomManagement,
    GeneralDraftManagement generalDraftManagement,
    BusinessTripDraftManagement businessTripDraftManagement,
    LeaveDraftManagement leaveDraftManagement,

    EntityManager entityManager
) {

    private static final LocalDate BASE_DATE = LocalDate.of(2100, 5, 1);
    private static final LocalTime START_TIME = LocalTime.of(9, 0);
    private static final LocalTime END_TIME = LocalTime.of(18, 0);

    @AfterEach
    void tearDown() {
        scheduleRepository.deleteAll();
        meetingRepository.deleteAll();
        meetingRoomRepository.deleteAll();
        draftRepository.deleteAll();
        empLeaveRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Transactional
    @Test
    @DisplayName("활성화 사원이라면, 수기등록 일정을 등록할 수 있다")
    void register_manual_schedule_by_active_emp_success() {
        Emp emp = saveApprovedEmp(empRepository,"202601100", "loginEmp1");

        Long ownerId = emp.getId();
        String title = "title";
        String content = "content";
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);

        String getSourceKey = scheduleRegister.registerSchedules(
                ScheduleCreateRequest.builder()
                        .manualScheduleParam(
                                ManualScheduleParam.builder()
                                        .ownerId(ownerId)
                                        .title(title)
                                        .content(content)
                                        .startAt(startAt)
                                        .endAt(endAt)
                                        .build()
                        )
                        .build()
        );

        entityManager.flush();
        entityManager.clear();

        List<Schedule> schedule = scheduleRepository.findBySourceKey(getSourceKey);

        assertThat(schedule.getFirst().isCanceled())
                .as("취소여부 기본값은 false이다")
                .isFalse();

        assertThat(schedule.getFirst().getSourceKey())
                .as("수기일정 여부 생성시, sourceKey가 UUID로 생성된다.")
                .isInstanceOf(String.class)
                .isNotNull();

        assertThat(schedule.getFirst().getScheduleParticipants().stream().findFirst().get().getEmp())
                .as("일정 등록자는 자동으로 추가된다.")
                .isEqualTo(emp);

        assertThat(schedule)
                .as("날짜마다 일정이 건건이 등록된다.")
                .hasSize(3);
    }

    @Transactional
    @Test
    @DisplayName("회의일정 등록시, 회의 일정이 등록된다.")
    void register_meeting_schedule_by_source_key_success() {
        long roomId = saveMeetingRoom();
        Emp reserverEmp = saveApprovedEmp(empRepository, "202601100", "reserverEmp");
        MeetingRoom room = meetingRoomRepository.findById(roomId).orElseThrow();

        Emp otherEmp = saveApprovedEmp(empRepository, "202601101", "otherEmp");

        String title = "testTitle";
        LocalDate meetingDate = BASE_DATE;
        LocalTime startAt = LocalTime.of(10,0);
        LocalTime endAt = LocalTime.of(11,0);
        Set<Long> participantIds = Set.of(reserverEmp.getId(), otherEmp.getId());
        long reservationId = getSavedTomorrowReservation(
                reserverEmp,
                room,
                title,
                meetingDate,
                startAt, endAt,
                participantIds
        );

        Meeting meeting = meetingRepository.findByIdAndEmpId(reservationId, reserverEmp.getId()).orElseThrow();

        scheduleRegister.registerSchedules(
                ScheduleCreateRequest.builder()
                        .sourceKey(meeting.getSourceKey())
                .build()
        );

        entityManager.flush();
        entityManager.clear();

        List<Schedule> schedule = scheduleRepository.findBySourceKey(meeting.getSourceKey());

        String format = ScheduleContentFormatter.format(
                new MeetingScheduleContentDto(meeting.getMeetingRoom().getName(), meeting.getTitle())
        );

        assertThat(schedule)
                .singleElement()
                .satisfies(s -> {
                    assertThat(s).extracting(
                            Schedule::getEmp,
                            Schedule::getTitle, Schedule::getScheduleDate, Schedule::getStartAt,
                            Schedule::getEndAt, Schedule::isCanceled
                    ).containsExactly(
                            reserverEmp, title, meetingDate, startAt, endAt, false
                    );

                    assertThat(s.getScheduleType())
                            .as("회의 일정 반영시, scheduleType은 Meeting이다.")
                            .isEqualTo(ScheduleType.MEETING);

                    assertThat(s.getSourceKey())
                            .as("일정 sourceKey는 회의 sourceKey와 동일하다")
                            .isEqualTo(meeting.getSourceKey());

                    assertThat(s.getScheduleParticipants().stream().map(e -> e.getEmp().getId()).collect(Collectors.toSet()))
                            .as("회의 참가자 그대로 일정 참가자로 반영된다.")
                            .containsAnyElementsOf(participantIds);

                    assertThat(s.getContent())
                            .as("일정 내용은 포맷팅한 내용으로 들어간다. [회의실: / 회의주제: ]형식 = %s", s.getContent())
                            .isEqualTo(format);
        });
    }


    private long getSavedTomorrowReservation(
            Emp reserverEmp,
            MeetingRoom room,
            String title,
            LocalDate meetingDate,
            LocalTime startAt,
            LocalTime endAt,
            Set<Long> participantIds
    ) {
        long meetingRoomId = room.getId();
        Long reserverId = reserverEmp.getId();

        return meetingManagement.reserve(
                MeetingReserveRequest.builder()
                        .meetingRoomId(meetingRoomId)
                        .reserverId(reserverId)
                        .title(title)
                        .meetingDate(meetingDate)
                        .startAt(startAt)
                        .endAt(endAt)
                        .participantIds(participantIds)
                        .build()
        );
    }

    private long saveMeetingRoom() {
        Dept dept = saveDept(deptRepository, "facility", "001");

        Emp emp = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601001", "facility1", dept, SystemRoleCode.FACILITY
        );

        return meetingRoomManagement.createMeetingRoom(
                MeetingRoomCreateRequest.builder()
                        .editorId(emp.getId())
                        .name("testRoom")
                        .description("testDescription")
                        .capacity(10)
                        .build()
        );
    }

    @Transactional
    @Test
    @DisplayName("휴가 기안 결재완료 시, 휴가 일정이 등록된다.")
    void register_leave_schedule_by_approved_leave_draft_success(){
        Emp drafter = saveApprovedEmp(empRepository);

        LeaveType annual = LeaveType.ANNUAL;
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);
        Draft getApprovedLeaveDraft = createAndApproveLeaveDraft(drafter, annual, startAt, endAt);

        scheduleRegister.registerSchedules(
                ScheduleCreateRequest.builder()
                        .sourceKey(getApprovedLeaveDraft.getSourceKey())
                        .build()
        );

        List<Schedule> schedules = scheduleRepository.findBySourceKey(getApprovedLeaveDraft.getSourceKey());

        String format = ScheduleContentFormatter.format(
                new LeaveScheduleContentDto(annual.getDescription())
        );

        int days = (int) Duration.between(startAt, endAt).toDays() + 1;

        assertThat(schedules)
                .as("연차 일수만큼 일정이 생성된다.")
                .hasSize(days);

        assertThat(schedules).satisfies(s -> {
                    Schedule first = s.getFirst();

                    assertThat(first).extracting(
                            Schedule::getEmp,
                            Schedule::isCanceled
                    ).containsExactly(
                            drafter, false
                    );

                    assertThat(first.getTitle())
                            .as("휴가신청의 일정 제목은 휴가타입명이다")
                            .isEqualTo(annual.getDescription());

                    assertThat(first.getScheduleType())
                            .as("휴가 일정 반영시, scheduleType은 LEAVE이다.")
                            .isEqualTo(ScheduleType.LEAVE);

                    assertThat(first.getSourceKey())
                            .as("일정 sourceKey는 휴가 sourceKey와 동일하다")
                            .isEqualTo(getApprovedLeaveDraft.getSourceKey());

                    assertThat(first.getScheduleParticipants().stream().findFirst().get().getEmp())
                            .as("휴가 신청자 그대로 일정 참가자로 반영된다.")
                            .isEqualTo(drafter);

                    assertThat(first.getContent())
                            .as("일정 내용은 포맷팅한 내용으로 들어간다. [휴가타입: ]형식 = %s", first.getContent())
                            .isEqualTo(format);
        });
    }

    @Transactional
    @Test
    @DisplayName("출장 기안 결재완료 시, 출장 일정이 등록된다.")
    void register_business_trip_schedule_by_approved_business_trip_draft_success() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp participant = saveApprovedEmp(empRepository, "202601091", "participant91");

        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);

        String destination = "destination";
        String purpose = "purpose";
        Set<Emp> participants = Set.of(drafter, participant);
        Draft businessTrip = createAndApproveBTDraft(drafter, startAt, endAt, destination, purpose, participants);

        entityManager.flush();
        entityManager.clear();

        scheduleRegister.registerSchedules(
                ScheduleCreateRequest.builder()
                        .sourceKey(businessTrip.getSourceKey())
                        .build()
        );

        entityManager.flush();
        entityManager.clear();

        List<Schedule> schedules = scheduleRepository.findBySourceKey(businessTrip.getSourceKey());

        String format = ScheduleContentFormatter.format(
                new BusinessTripScheduleContentDto(destination, purpose)
        );

        int days = (int) Duration.between(startAt, endAt).toDays() + 1;

        assertThat(schedules)
                .as("출장 일수만큼 일정이 생성된다.")
                .hasSize(days);

        assertThat(schedules).satisfies(s -> {
            Schedule first = s.getFirst();

            assertThat(first).extracting(
                    Schedule::getEmp,
                    Schedule::isCanceled
            ).containsExactly(
                    drafter, false
            );

            assertThat(first.getScheduleType())
                    .as("휴가 일정 반영시, scheduleType은 BUSINESS_TRIP이다.")
                    .isEqualTo(ScheduleType.BUSINESS_TRIP);

            assertThat(first.getSourceKey())
                    .as("일정 sourceKey는 출장기안서 sourceKey와 동일하다")
                    .isEqualTo(businessTrip.getSourceKey());

            assertThat(first.getContent())
                    .as("일정 내용은 포맷팅한 내용이다 [출장] 목적지-목적, first.getContent()")
                    .isEqualTo(format);

            assertThat(first.getTitle())
                    .as("일정 제목은 포맷팅한 내용이다 [출장] 목적지-목적, first.getContent()")
                    .isEqualTo(format);

            assertThat(first.getScheduleParticipants().stream().map(ScheduleParticipant::getEmp).collect(Collectors.toSet()))
                    .as("출장 참여자가 일정 참여자로 반영된다.")
                    .containsAnyElementsOf(participants);
        });
    }

    @Test
    @DisplayName("수기/회의/출장/휴가 타입이 아니면 일정 등록 실패")
    void register_schedule_by_unsupported_source_key_fail() {
        Draft draft = getApprovedGeneralDraft();

        assertThatThrownBy(() ->
                scheduleRegister.registerSchedules(
                        ScheduleCreateRequest.builder()
                                .sourceKey(draft.getSourceKey())
                                .build()
                )
        ).hasMessage("지원하지 않는 일정 타입");

    }

    @Test
    @DisplayName("비활성 사원은 일정을 등록할 수 없다")
    void register_schedule_by_inactive_owner_fail() {
        Emp inactiveEmp = saveRegisteredEmp(empRepository);

        assertThatThrownBy(() ->
                getManualSchedules(
                        inactiveEmp,
                        LocalDateTime.of(BASE_DATE, START_TIME),
                        LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
                )
        ).isInstanceOf(ActiveEmployeeNotFoundException.class);
    }

    @Transactional
    @Test
    @DisplayName("참가자 추가 시, 비활성 사원을 추가하면 실패한다.")
    void add_participant_by_inactive_emp_fail() {
        Emp inactiveEmp = saveRegisteredEmp(empRepository);

        List<Schedule> manualSchedules = getManualSchedules(
                saveApprovedEmp(empRepository, "202601101", "emp111"),
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        assertThatThrownBy(() ->
                scheduleEditing.addParticipants(manualSchedules.getFirst().getId(), Set.of(inactiveEmp.getId()), false)
        ).isInstanceOf(ActiveEmployeeNotFoundException.class);

    }

    @Transactional
    @Test
    @DisplayName("단일 일정 참가자 추가 - bulkEdit = false")
    void add_participant_to_single_schedule_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "emp222");

        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        scheduleEditing.addParticipants(firstDayOfSchedule.getId(), Set.of(otherEmp.getId()), false);

        Schedule updatedSchedule = scheduleRepository.findById(firstDayOfSchedule.getId()).orElseThrow();

        List<Schedule> otherDaysOfSchedule = scheduleRepository.findBySourceKey(firstDayOfSchedule.getSourceKey());
        otherDaysOfSchedule.remove(firstDayOfSchedule);

        assertThat(updatedSchedule.getScheduleParticipants().stream().map(ScheduleParticipant::getEmp).collect(Collectors.toSet()))
                .as("단일 일정에 참여자 등록시, 해당 날짜에 참여자가 등록된다.")
                .containsExactlyInAnyOrder(register, otherEmp);

        otherDaysOfSchedule.forEach(s -> {
            s.getScheduleParticipants().stream()
                    .map(ScheduleParticipant::getEmp)
                    .collect(Collectors.toSet())
                    .forEach(emp -> assertThat(emp)
                            .as("단일 일정에 참여자 등록시, 다른 날짜에 해당 참여자는 등록되지 않는다.")
                            .isNotEqualTo(otherEmp));
        });

    }

    @Transactional
    @Test
    @DisplayName("동일 이벤트 전체 일정 참가자 추가 - bulkEdit = true")
    void add_participant_to_same_event_schedules_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "emp222");

        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        scheduleEditing.addParticipants(firstDayOfSchedule.getId(), Set.of(otherEmp.getId()), true);

        List<Schedule> allDaysOfSchedule = scheduleRepository.findBySourceKey(firstDayOfSchedule.getSourceKey());

        allDaysOfSchedule.stream()
                .map(ad -> ad.getScheduleParticipants().stream()
                        .map(ScheduleParticipant::getEmp)
                ).collect(Collectors.toSet())
                .forEach(result ->
                        assertThat(result)
                                .as("전체 일정 참가자 추가 시, 해당 일정(같은 sourceKey공유)의 참여자 목록에 추가된다.")
                                .containsExactlyInAnyOrder(register, otherEmp)
                );
    }

    @Transactional
    @Test
    @DisplayName("단일 일정 참가자 삭제 - bulkEdit = false")
    void remove_participant_from_single_schedule_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "emp222");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        scheduleEditing.addParticipants(firstDayOfSchedule.getId(), Set.of(otherEmp.getId()), true);
        scheduleEditing.removeParticipants(firstDayOfSchedule.getId(), Set.of(otherEmp.getId()), false);
        String sourceKey = firstDayOfSchedule.getSourceKey();

        entityManager.flush();
        entityManager.clear();

        List<Schedule> Schedules = scheduleRepository.findBySourceKey(sourceKey);

        Schedule removedDay = Schedules.stream()
                .filter(s -> s.getId().equals(firstDayOfSchedule.getId())).findFirst().orElseThrow();
        Schedules.remove(removedDay);

        Set<Emp> removeParticipantDay
                = firstDayOfSchedule.getScheduleParticipants().stream()
                .map(ScheduleParticipant::getEmp).collect(Collectors.toSet());
        assertThat(removeParticipantDay)
                .as("삭제 대상 일에는 해당 사원이 제외된다.")
                .doesNotContain(otherEmp);

        Schedules.forEach(s -> {
            Set<Emp> participants = s.getScheduleParticipants().stream()
                    .map(ScheduleParticipant::getEmp)
                    .collect(Collectors.toSet());

            assertThat(participants)
                    .as("삭제 제외 일에는 해당 사원이 제외되지 않는다.")
                    .containsExactlyInAnyOrder(register, otherEmp);
        });

    }

    @Transactional
    @Test
    @DisplayName("동일 이벤트 전체 일정 참가자 삭제 - bulkEdit = true")
    void remove_participant_from_same_event_schedules_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "emp222");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        String sourceKey = firstDayOfSchedule.getSourceKey();

        scheduleEditing.addParticipants(firstDayOfSchedule.getId(), Set.of(otherEmp.getId()), true);

        entityManager.flush();
        entityManager.clear();

        Schedule reloadedFirstDay = scheduleRepository.findBySourceKey(sourceKey).getFirst();

//        log.info("before remove = {}", firstDayOfSchedule.getScheduleParticipants()
//                .stream().map(p -> p.getEmp().getId()).toList());

        scheduleEditing.removeParticipants(reloadedFirstDay.getId(), Set.of(otherEmp.getId()), true);

        entityManager.flush();
        entityManager.clear();

        List<Schedule> schedules = scheduleRepository.findBySourceKey(sourceKey);

//        log.info("after remove = {}", schedules.getFirst().getScheduleParticipants()
//                .stream().map(p -> p.getEmp().getId()).toList());
//
//
//        schedules.forEach(s -> {
//            List<Long> participantIds = s.getScheduleParticipants().stream()
//                    .map(p -> p.getEmp().getId())
//                    .toList();
//
//            log.info("scheduleId={}, sourceKey={}, date={}, participants={} : id랑 날짜만 달라야함",
//                    s.getId(),
//                    s.getSourceKey(),
//                    s.getScheduleDate(),
//                    participantIds);
//        });

//        schedules.forEach(s -> {
//            List<Long> participantIds = s.getScheduleParticipants().stream()
//                    .map(p -> p.getEmp().getId())
//                    .toList();
//
//            // 왜 orphan 상태인데 컬렉션에 그대로 있는 것이냐.. <- add랑 remove를 같은 영속성 컨테이너에서 해서 그럼
//            log.info("최종 result scheduleId={}, date={}, participants={}",
//                    s.getId(),
//                    s.getScheduleDate(),
//                    participantIds);
//        });
        schedules.forEach(s -> {
            Set<Long> participants = s.getScheduleParticipants().stream()
                    .map(p -> p.getEmp().getId())
                    .collect(Collectors.toSet());

            assertThat(participants).doesNotContain(otherEmp.getId());
            assertThat(participants).contains(register.getId());
        });
    }

    @Transactional
    @Test
    @DisplayName("단일 이벤트 취소 - isForBulkEdit=false.")
    void cancel_single_schedule_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();

        entityManager.flush();
        entityManager.clear();

        scheduleEditing.cancelSchedule(firstDayOfSchedule.getId(), false);

        entityManager.flush();
        entityManager.clear();

        Schedule updatedSchedule = scheduleRepository.findById(firstDayOfSchedule.getId()).orElseThrow();
        List<Schedule> otherDaysOfCancelledDaySchedule = scheduleRepository.findBySourceKey(updatedSchedule.getSourceKey());
        otherDaysOfCancelledDaySchedule.remove(updatedSchedule);

        assertThat(updatedSchedule.isCanceled())
                .as("해당 일정 중 특정일 취소 확인")
                .isTrue();

        otherDaysOfCancelledDaySchedule.forEach(s -> {
            assertThat(s.isCanceled())
                    .as("해당 일정 중 특정일 외는 취소 x")
                    .isFalse();
        });


    }
    
    @Test
    @Transactional
    @DisplayName("동일 이벤트 전체 일정 취소 - isForBulkEdit=true")
    void cancel_same_event_schedules_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();

        entityManager.flush();
        entityManager.clear();

        scheduleEditing.cancelSchedule(firstDayOfSchedule.getId(), true);

        entityManager.flush();
        entityManager.clear();

        List<Schedule> updatedSchedule = scheduleRepository.findBySourceKey(firstDayOfSchedule.getSourceKey());


        updatedSchedule.forEach(s -> {
            assertThat(s.isCanceled())
                    .as("모든 일정 취소")
                    .isTrue();
        });
    }

    @Transactional
    @Test
    @DisplayName("단일 일정 수정 - isForBulkEdit = false")
    void update_single_event_manual_schedules_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        String sourceKey = firstDayOfSchedule.getSourceKey();

        entityManager.flush();
        entityManager.clear();

        String editedTitle = "editedTitle9";
        String editedContent = "editedContent9";
        LocalDateTime editedStartAt = LocalDateTime.of(firstDayOfSchedule.getScheduleDate(), LocalTime.of(13, 0));
        LocalDateTime editedEndAt = LocalDateTime.of(firstDayOfSchedule.getScheduleDate(), LocalTime.of(14, 0));
        scheduleEditing.updateManualSchedule(
                firstDayOfSchedule.getId(), false, 
                ManualScheduleParam.builder()
                        .ownerId(register.getId()).title(editedTitle).content(editedContent).startAt(editedStartAt).endAt(editedEndAt)
                .build()
        );

        entityManager.flush();
        entityManager.clear();

        List<Schedule> updatedSchedules = scheduleRepository.findBySourceKey(sourceKey);
        Schedule updatedSchedule = scheduleRepository.findById(firstDayOfSchedule.getId()).orElseThrow();
        updatedSchedules.remove(updatedSchedule);

        assertThat(updatedSchedule).extracting(
                Schedule::getTitle, Schedule::getContent, Schedule::getStartAt, Schedule::getEndAt
        ).containsExactly(
                editedTitle, editedContent, editedStartAt.toLocalTime(), editedEndAt.toLocalTime()
        );

        updatedSchedules.forEach(s -> {
//            log.info("title = {}, content = {}, startAt = {}, endAt = {}",s.getTitle(), s.getContent(), s.getStartAt(), s.getEndAt());

            assertNotEquals(editedTitle, s.getTitle());
            assertNotEquals(editedContent, s.getContent());
            assertNotEquals(editedStartAt, s.getStartAt());
            assertNotEquals(editedEndAt, s.getEndAt());
        });
    }

    @Transactional
    @Test
    @DisplayName("동일 일정 수정 - isForBulkEdit = true 시, 같은 sourceKey의 일정 정보가 다 바뀐다.")
    void update_same_event_manual_schedules_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        String sourceKey = firstDayOfSchedule.getSourceKey();

        entityManager.flush();
        entityManager.clear();

        String editedTitle = "editedTitle9";
        String editedContent = "editedContent9";
        LocalDateTime editedStartAt = LocalDateTime.of(firstDayOfSchedule.getScheduleDate(), LocalTime.of(13, 0));
        LocalDateTime editedEndAt = LocalDateTime.of(firstDayOfSchedule.getScheduleDate(), LocalTime.of(14, 0));

        scheduleEditing.updateManualSchedule(
                firstDayOfSchedule.getId(), true,
                ManualScheduleParam.builder()
                        .ownerId(register.getId()).title(editedTitle).content(editedContent).startAt(editedStartAt).endAt(editedEndAt)
                        .build()
        );

        entityManager.flush();
        entityManager.clear();

        List<Schedule> updatedSchedules = scheduleRepository.findBySourceKey(sourceKey);

        updatedSchedules.forEach(s -> {
            assertThat(s).extracting(
                    Schedule::getTitle, Schedule::getContent, Schedule::getStartAt, Schedule::getEndAt
            ).containsExactly(
                    editedTitle, editedContent, editedStartAt.toLocalTime(), editedEndAt.toLocalTime()
            );
        });
    }

    private static Stream<Arguments> variousScheduleTimes() {
        LocalDate baseDate = BASE_DATE;

        return Stream.of(
                Arguments.of(
                        "단일 날짜 일정",
                        LocalDateTime.of(baseDate, LocalTime.of(10, 0)),
                        LocalDateTime.of(baseDate, LocalTime.of(11, 0)),
                        List.of(
                                new ExpectedScheduleTime(
                                        baseDate,
                                        LocalTime.of(10, 0),
                                        LocalTime.of(11, 0),
                                        false
                                )
                        )
                ),
                Arguments.of(
                        "2일 일정 - 시작일은 시작시각부터 퇴근시간까지, 종료일은 출근시간부터 종료시각까지",
                        LocalDateTime.of(baseDate, LocalTime.of(13, 0)),
                        LocalDateTime.of(baseDate.plusDays(1), LocalTime.of(14, 0)),
                        List.of(
                                new ExpectedScheduleTime(
                                        baseDate,
                                        LocalTime.of(13, 0),
                                        LocalTime.of(18, 0),
                                        false
                                ),
                                new ExpectedScheduleTime(
                                        baseDate.plusDays(1),
                                        LocalTime.of(9, 0),
                                        LocalTime.of(14, 0),
                                        false
                                )
                        )
                ),
                Arguments.of(
                        "3일 일정 - 중간일은 전일 일정",
                        LocalDateTime.of(baseDate, LocalTime.of(13, 0)),
                        LocalDateTime.of(baseDate.plusDays(2), LocalTime.of(14, 0)),
                        List.of(
                                new ExpectedScheduleTime(
                                        baseDate,
                                        LocalTime.of(13, 0),
                                        LocalTime.of(18, 0),
                                        false
                                ),
                                new ExpectedScheduleTime(
                                        baseDate.plusDays(1),
                                        LocalTime.of(9, 0),
                                        LocalTime.of(18, 0),
                                        true
                                ),
                                new ExpectedScheduleTime(
                                        baseDate.plusDays(2),
                                        LocalTime.of(9, 0),
                                        LocalTime.of(14, 0),
                                        false
                                )
                        )
                ),
                Arguments.of(
                        "근무시간 전체를 채운 2일 일정",
                        LocalDateTime.of(baseDate, LocalTime.of(9, 0)),
                        LocalDateTime.of(baseDate.plusDays(1), LocalTime.of(18, 0)),
                        List.of(
                                new ExpectedScheduleTime(
                                        baseDate,
                                        LocalTime.of(9, 0),
                                        LocalTime.of(18, 0),
                                        true
                                ),
                                new ExpectedScheduleTime(
                                        baseDate.plusDays(1),
                                        LocalTime.of(9, 0),
                                        LocalTime.of(18, 0),
                                        true
                                )
                        )
                )
        );
    }

    @Transactional
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("variousScheduleTimes")
    @DisplayName("여러 날짜 일정 시간 계산")
    void register_multi_day_schedule_split_by_company_work_time_success(
            String description,
            LocalDateTime startAt,
            LocalDateTime endAt,
            List<ExpectedScheduleTime> expectedTimes
    ) {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");

        List<Schedule> schedules = getManualSchedules(register, startAt, endAt).stream()
                .sorted(Comparator.comparing(Schedule::getScheduleDate))
                .toList();

        assertThat(schedules)
                .as("시작일~종료일 사이 날짜 수만큼 일정이 생성된다.")
                .hasSize(expectedTimes.size());

        for (int i = 0; i < expectedTimes.size(); i++) {
            Schedule schedule = schedules.get(i);
            ExpectedScheduleTime expected = expectedTimes.get(i);

            assertThat(schedule).extracting(
                    Schedule::getScheduleDate,
                    Schedule::getStartAt,
                    Schedule::getEndAt,
                    Schedule::isAllDay
            ).containsExactly(
                    expected.scheduleDate(),
                    expected.startAt(),
                    expected.endAt(),
                    expected.isAllDay()
            );
        }
    }

    private record ExpectedScheduleTime(
            LocalDate scheduleDate,
            LocalTime startAt,
            LocalTime endAt,
            boolean isAllDay
    ) {
    }

    private List<Schedule> getManualSchedules(Emp emp, LocalDateTime startAt, LocalDateTime endAt) {
        Long ownerId = emp.getId();
        String title = "title";
        String content = "content";

        String getSourceKey = scheduleRegister.registerSchedules(
                ScheduleCreateRequest.builder()
                        .manualScheduleParam(
                                ManualScheduleParam.builder()
                                        .ownerId(ownerId)
                                        .title(title)
                                        .content(content)
                                        .startAt(startAt)
                                        .endAt(endAt)
                                        .build()
                        )
                        .build()
        );

        entityManager.flush();
        entityManager.clear();

        return scheduleRepository.findBySourceKey(getSourceKey);
    }

    private Draft createAndApproveBTDraft(
            Emp drafter,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose,
            Set<Emp> participants
    ) {

        Emp approver1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        businessTripDraftManagement.createSubmitted(
                BusinessTripDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(drafter.getId())
                                .title("test")
                                .content("test")
                                .approvers(List.of(
                                        new ApproversRequest(approver1.getId(), ApprovalRole.APPROVER, 1)
                                ))
                                .submittedAt(LocalDateTime.of(2026,3,1,0,0,0))
                                .build()
                        )
                        .startAt(startAt)
                        .endAt(endAt)
                        .destination(destination)
                        .purpose(purpose)
                        .participantIds(participants.stream()
                                .map(AbstractEntity::getId)
                                .collect(Collectors.toSet())
                        )
                        .build()
        );

        Draft draft = draftRepository.findByEmp(drafter).stream().findFirst().orElseThrow();
        businessTripDraftManagement.approve(draft.getId(), approver1.getId(), LocalDateTime.of(2026,3,1,0,0,0));

        return draftRepository.findById(draft.getId()).orElseThrow();
    }


    private Draft createAndApproveLeaveDraft(
            Emp drafter,
            LeaveType leaveType,
            LocalDateTime startAt,
            LocalDateTime endAt
    ) {
        int year = BASE_DATE.getYear();
        EmpLeave empLeave = createEmpLeave(drafter, year, 15);
        empLeaveRepository.save(empLeave);
        empLeave.adjustCompensatoryGrantDays(3.0);
        empLeave.adjustSpecialGrantDays(3.0);

        Emp approver1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approver2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        leaveDraftManagement.createSubmitted(
                LeaveDraftCreateRequest.builder()
                        .param(
                                CommonDraftCreateRequest.builder()
                                        .empId(drafter.getId())
                                        .title("test")
                                        .content("test")
                                        .approvers(List.of(
                                                new ApproversRequest(approver1.getId(), ApprovalRole.APPROVER, 1),
                                                new ApproversRequest(approver2.getId(), ApprovalRole.APPROVER, 2)
                                        ))
                                        .submittedAt(LocalDateTime.of(year, 4, 1, 0, 0))
                                        .build()
                        )
                        .startAt(startAt)
                        .endAt(endAt)
                        .leaveType(leaveType)
                        .build()
        );

        entityManager.flush();
        entityManager.clear();

        Draft draft = draftRepository.findByEmp(drafter).stream()
                .max(Comparator.comparing(Draft::getCreatedAt))
                .orElseThrow();

        leaveDraftManagement.approve(
                draft.getId(),
                approver1.getId(),
                LocalDateTime.of(year, 4, 1, 0, 0)
        );

        leaveDraftManagement.approve(
                draft.getId(),
                approver2.getId(),
                LocalDateTime.of(year, 4, 1, 5, 0)
        );

        return draftRepository.findById(draft.getId()).orElseThrow();
    }


    private Draft getApprovedGeneralDraft() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        List<ApproversRequest> approversRequests = new ArrayList<>();
        approversRequests.add(new ApproversRequest(approverEmp1.getId(), ApprovalRole.APPROVER, 1));
        int year = BASE_DATE.getYear();
        generalDraftManagement.createSubmitted(
                CommonDraftCreateRequest.builder()
                        .empId(drafter.getId())
                        .title("title")
                        .content("content")
                        .approvers(approversRequests)
                        .submittedAt(LocalDateTime.of(year, 1, 1, 0, 0, 0))
                        .build()
        );
        Draft draft = draftRepository.findByEmp(drafter).stream().findFirst().orElseThrow();

        generalDraftManagement.approve(
                draft.getId(), approverEmp1.getId(), LocalDateTime.of(year, 1, 1, 0, 0, 5)
        );

        return draft;
    }
}