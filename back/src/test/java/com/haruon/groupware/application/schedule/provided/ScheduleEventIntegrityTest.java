package com.haruon.groupware.application.schedule.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.draft.provided.BusinessTripDraftManagement;
import com.haruon.groupware.application.draft.provided.GeneralDraftManagement;
import com.haruon.groupware.application.draft.provided.LeaveCancelDraftManagement;
import com.haruon.groupware.application.draft.provided.LeaveDraftManagement;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.*;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.schedule.EditForbiddenScheduleException;
import com.haruon.groupware.application.exception.schedule.UnsupportedScheduleTypeException;
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
import com.haruon.groupware.application.schedule.required.ScheduleQueryRepository;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.LeaveCancelDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.meeting.Meeting;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.haruon.groupware.application.dbFixture.EmpFixture.*;
import static com.haruon.groupware.domain.empInfo.EmpLeave.createEmpLeave;
import static java.util.Set.of;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Slf4j
@TestIntegrationConfig
record ScheduleEventIntegrityTest(
        ScheduleRepository scheduleRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        DraftRepository draftRepository,
        MeetingRepository meetingRepository,
        MeetingRoomRepository meetingRoomRepository,
        EmpLeaveRepository empLeaveRepository,
        ScheduleQueryRepository scheduleQueryRepository,

        ScheduleEventProcessor scheduleProcessor,
        MeetingManagement meetingManagement,
        MeetingRoomManagement meetingRoomManagement,
        GeneralDraftManagement generalDraftManagement,
        BusinessTripDraftManagement businessTripDraftManagement,
        LeaveDraftManagement leaveDraftManagement,

        LeaveCancelDraftManagement leaveCancelDraftManagement

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

    @Test
    @DisplayName("회의일정 등록시, 회의 일정이 등록된다.")
    void register_meeting_schedule_by_source_key_success() {
        long roomId = saveMeetingRoom();
        Emp reserverEmp = saveApprovedEmp(empRepository, "202601100", "reserverEmp");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601101", "otherEmp");
        MeetingRoom room = meetingRoomRepository.findById(roomId).orElseThrow();
        String roomName = room.getName();

        String title = "testTitle";
        LocalDate meetingDate = BASE_DATE;
        LocalTime startAt = LocalTime.of(10, 0);
        LocalTime endAt = LocalTime.of(11, 0);
        Set<Long> participantIds = Set.of(reserverEmp.getId(), otherEmp.getId());

        long reservationId = getSavedTomorrowReservation(
                reserverEmp,
                room,
                title,
                meetingDate,
                startAt,
                endAt,
                participantIds
        );

        log.info("================== 회의 등록 종료 =========================");

        Meeting meeting = meetingRepository
                .findByIdAndEmpId(reservationId, reserverEmp.getId())
                .orElseThrow();

//        scheduleProcessor.applyScheduleCreation(meeting.getSourceKey());

        String format = ScheduleContentFormatter.format(
                new MeetingScheduleContentDto(roomName, meeting.getTitle())
        );

        assertThat(scheduleRepository.findBySourceKey(meeting.getSourceKey()))
                .singleElement()
                .satisfies(s -> {
                    assertThat(s).extracting(
                            Schedule::getTitle, Schedule::getScheduleDate, Schedule::getStartAt,
                            Schedule::getEndAt, Schedule::isCanceled
                    ).containsExactly(
                            title, meetingDate, startAt, endAt, false
                    );

                    assertThat(s.getScheduleType())
                            .as("회의 일정 반영시, scheduleType은 Meeting이다.")
                            .isEqualTo(ScheduleType.MEETING);

                    assertThat(s.getSourceKey())
                            .as("일정 sourceKey는 회의 sourceKey와 동일하다")
                            .isEqualTo(meeting.getSourceKey());

                    assertThat(s.getContent())
                            .as("일정 내용은 포맷팅한 내용으로 들어간다. [회의실: / 회의주제: ]형식 = %s", s.getContent())
                            .isEqualTo(format);
                });

        Long participantCount = scheduleQueryRepository
                .countScheduleParticipantsByScheduleId(scheduleRepository.findBySourceKey(meeting.getSourceKey()).getFirst().getId())
                .orElseThrow();

        assertThat(participantCount).isEqualTo(2);
    }

    @Test
    @DisplayName("회의 취소 테스트")
    void cancel_meeting_apply_schedule() {
        long roomId = saveMeetingRoom();
        Emp reserverEmp = saveApprovedEmp(empRepository, "202601100", "reserverEmp");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601101", "otherEmp");
        MeetingRoom room = meetingRoomRepository.findById(roomId).orElseThrow();

        String title = "testTitle";
        LocalTime startAt = LocalTime.of(10, 0);
        LocalTime endAt = LocalTime.of(11, 0);
        Set<Long> participantIds = Set.of(reserverEmp.getId(), otherEmp.getId());

        long reservationId = getSavedTomorrowReservation(
                reserverEmp,
                room,
                title,
                BASE_DATE,
                startAt,
                endAt,
                participantIds
        );

        Meeting meeting = meetingRepository
                .findByIdAndEmpId(reservationId, reserverEmp.getId())
                .orElseThrow();

        meetingManagement.cancelMeeting(meeting.getId(), reserverEmp.getId());

        log.info("================== 회의 취소 종료 =========================");
        List<Schedule> schedules = scheduleRepository.findBySourceKey(meeting.getSourceKey());

        assertThat(schedules.stream()).isNotEmpty().allMatch(Schedule::isCanceled);
    }

    @Test
    @DisplayName("회의는 참가라목록을 추가 할 수 있다.")
    void applyParticipantEdit() {
        long roomId = saveMeetingRoom();
        Emp reserverEmp = saveApprovedEmp(empRepository, "202601100", "reserverEmp");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601101", "otherEmp");
        MeetingRoom room = meetingRoomRepository.findById(roomId).orElseThrow();

        log.info("=============reserverEmp : {}, otherEmp : {}", reserverEmp.getId(), otherEmp.getId());    // reserverEmp : 3313, otherEmp : 3314
        String title = "testTitle";
        LocalTime startAt = LocalTime.of(10, 0);
        LocalTime endAt = LocalTime.of(11, 0);
        Set<Long> participantIds = Set.of(reserverEmp.getId(), otherEmp.getId());

        long reservationId = getSavedTomorrowReservation(
                reserverEmp,
                room,
                title,
                BASE_DATE,
                startAt,
                endAt,
                participantIds
        );

        Meeting meeting = meetingRepository
                .findByIdAndEmpId(reservationId, reserverEmp.getId())
                .orElseThrow();
        String sourceKey = meeting.getSourceKey();

        Set<Long> newParticipantIds = of(
                reserverEmp.getId(),
                otherEmp.getId(),
                saveApprovedEmp(empRepository, "202601105", "newParticipant").getId()
        );
        meetingManagement.replaceParticipants(
                meeting.getId(),
                reserverEmp.getId(),
                newParticipantIds
        );

        List<Schedule> schedules = scheduleRepository.findSchedulesBySourceKey(sourceKey);

        List<List<Long>> participantIdsInSchedules = schedules.stream()
                .map(s -> scheduleQueryRepository.findScheduleParticipantsByScheduleId(s.getId()))
                .toList();


        assertThat(participantIdsInSchedules)
                .isNotEmpty()
                .allSatisfy(participantId -> {
                        assertThat(participantId.size()).isEqualTo(3);
                    participantId.forEach(p ->
                                log.info("============참가자 목록 : {}", p)  // 3317 3319
                        );

                });
    }
    @Test
    @DisplayName("회의는 참가라목록을 삭제 할 수 있다.")
    void applyParticipantRemoval_success() {
        long roomId = saveMeetingRoom();
        Emp reserverEmp = saveApprovedEmp(empRepository, "202601100", "reserverEmp");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601101", "otherEmp");
        MeetingRoom room = meetingRoomRepository.findById(roomId).orElseThrow();

        log.info("=============reserverEmp : {}, otherEmp : {}", reserverEmp.getId(), otherEmp.getId());    // 3100, 3101
        String title = "testTitle";
        LocalTime startAt = LocalTime.of(10, 0);
        LocalTime endAt = LocalTime.of(11, 0);
        Set<Long> participantIds = Set.of(reserverEmp.getId(), otherEmp.getId());

        long reservationId = getSavedTomorrowReservation(
                reserverEmp,
                room,
                title,
                BASE_DATE,
                startAt,
                endAt,
                participantIds
        );

        Meeting meeting = meetingRepository
                .findByIdAndEmpId(reservationId, reserverEmp.getId())
                .orElseThrow();
        String sourceKey = meeting.getSourceKey();

        Set<Long> newParticipantIds = of(
                reserverEmp.getId()
        );
        meetingManagement.replaceParticipants(
                meeting.getId(),
                reserverEmp.getId(),
                newParticipantIds
        );

        List<Schedule> schedules = scheduleRepository.findSchedulesBySourceKey(sourceKey);

        List<List<Long>> participantIdsInSchedules = schedules.stream()
                .map(s -> scheduleQueryRepository.findScheduleParticipantsByScheduleId(s.getId()))
                .toList();


        assertThat(participantIdsInSchedules)
                .isNotEmpty()
                .allSatisfy(participantId -> {
                        assertThat(participantId.size()).isEqualTo(1);
                    participantId.forEach(p ->
                                log.info("============참가자 목록 : {}", p)  // 3100
                        );

                });
    }

    @Test
    @DisplayName("연가와 출장은 참가자목록을 수정할 수 없다")
    void applyParticipantEdit_fail() {
        Emp drafter = saveApprovedEmp(empRepository);
        LeaveType annual = LeaveType.ANNUAL;
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);

        Draft getApprovedLeaveDraft = createAndApproveLeaveDraft(drafter, annual, startAt, endAt);

        List<Schedule> schedules = scheduleRepository.findBySourceKey(getApprovedLeaveDraft.getSourceKey());

        assertThatThrownBy(() ->
                scheduleProcessor.applyParticipantAddition(schedules.getFirst().getSourceKey(), of(saveApprovedEmp(empRepository, "202601202", "newParticipant11").getId()))
        ).isInstanceOf(EditForbiddenScheduleException.class);
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

    @Test
    @DisplayName("휴가 기안 결재완료 시, 휴가 일정이 등록된다.")
    void register_leave_schedule_by_approved_leave_draft_success(){
        Emp drafter = saveApprovedEmp(empRepository);
        LeaveType annual = LeaveType.ANNUAL;
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);
        Draft getApprovedLeaveDraft = createAndApproveLeaveDraft(drafter, annual, startAt, endAt);
        String format = ScheduleContentFormatter.format(
                new LeaveScheduleContentDto(annual.getDescription())
        );

        List<Schedule> schedules = scheduleRepository.findBySourceKey(getApprovedLeaveDraft.getSourceKey());

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

            assertThat(first.getContent())
                    .as("일정 내용은 포맷팅한 내용으로 들어간다. [휴가타입: ]형식 = %s", first.getContent())
                    .isEqualTo(format);
        });


        List<Long> participantsByScheduleId = scheduleQueryRepository.findScheduleParticipantsByScheduleId(schedules.getFirst().getId());
        assertThat(participantsByScheduleId)
                .as("기안자 그대로 일정 참가자로 들어가며, 일정 참가자는 무조건 1명이다.")
                .containsExactly(drafter.getId());
    }

    @Test
    @DisplayName("휴가 기안 취소 테스트")
    void cancel_leave_apply_schedule_check() {
        Emp drafter = saveApprovedEmp(empRepository);
        LeaveType annual = LeaveType.ANNUAL;
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);
        Draft getApprovedLeaveDraft = createAndApproveLeaveDraft(drafter, annual, startAt, endAt);

        String sourceKey = getApprovedLeaveDraft.getSourceKey();

        List<Schedule> schedules = scheduleRepository.findBySourceKey(getApprovedLeaveDraft.getSourceKey());
        log.info("============ 취소 전, {}",schedules.toString());

        Emp approver = saveApprovedEmp(empRepository, "202601602", "approver999");
        leaveCancelDraftManagement.createDraft(
                CancelDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(drafter.getId())
                                .title("test").content("test")
                                .approvers(List.of(new ApproversRequest(approver.getId(), ApprovalRole.APPROVER, 1)))
                                .submittedAt(LocalDateTime.of(2026,3,1,0,0,0))
                                .build()
                        ).sourceKey(sourceKey)
                        .build()
        );
        LeaveCancelDraft draft = (LeaveCancelDraft) draftRepository.findBySourceKey(sourceKey).stream()
                .filter(d -> d instanceof LeaveCancelDraft)
                .findFirst()
                .orElseThrow();

        leaveCancelDraftManagement.approve(draft.getId(), approver.getId(), LocalDateTime.of(2026,3,1,9,0,0));

        List<Schedule> cancelledSchedules = scheduleRepository.findBySourceKey(getApprovedLeaveDraft.getSourceKey());

        for (Schedule cancelledSchedule : cancelledSchedules) {
            log.info("cancelledSchedule : {}", cancelledSchedule);
        }
        assertThat(cancelledSchedules.stream().allMatch(Schedule::isCanceled)).isTrue();
    }

    @Test
    @DisplayName("출장 기안 결재완료 시, 출장 일정이 등록된다.")  // x
    void register_business_trip_schedule_by_approved_business_trip_draft_success() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp participant = saveApprovedEmp(empRepository, "202601091", "participant91");
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, LocalTime.of(15, 0, 0)).plusDays(2);
        String destination = "destination";
        String purpose = "purpose";
        Set<Emp> participants = of(drafter, participant);
        String format = ScheduleContentFormatter.format(
                new BusinessTripScheduleContentDto(destination, purpose)
        );

        Draft businessTrip = createAndApproveBTDraft(drafter, startAt, endAt, destination, purpose, participants);

        List<Schedule> schedules = scheduleRepository.findBySourceKey(businessTrip.getSourceKey());

//        for (Schedule schedule : schedules) {
//            log.info("============ schedule : {}", schedule);
//        }

        int days = (int) Duration.between(startAt, endAt).toDays() + 1;

        assertThat(schedules)
                .as("출장 일수만큼 일정이 생성된다.")
                .hasSize(days);

        Schedule first = schedules.getFirst();
        assertThat(schedules).satisfies(s -> {
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


        });

        Set<Long> participantIds = new HashSet<>(scheduleQueryRepository.findScheduleParticipantsByScheduleId(schedules.getFirst().getId()));

        participantIds.forEach(p -> log.info("============ participantIds : {}", p));

        assertThat(participantIds)
                .as("출장 참여자가 일정 참여자로 반영된다.")
                .containsExactlyInAnyOrder(drafter.getId(), participant.getId());

    }

    @Test
    @DisplayName("회의/출장/휴가 타입이 아니면 일정 등록 이벤트 실패")
    void register_schedule_by_unsupported_source_key_fail() {
        Draft draft = getApprovedGeneralDraft();

        assertThatThrownBy(() ->
                scheduleProcessor.applyScheduleCreation(draft.getSourceKey())
        ).isInstanceOf(UnsupportedScheduleTypeException.class);

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