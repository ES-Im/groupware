package com.haruon.groupware.application.meeting.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.PastTimeNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.meeting.InactivatedMeetingRoomException;
import com.haruon.groupware.application.exception.meeting.MeetingNotFoundException;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.application.meeting.service.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingUpdateRequest;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.meeting.Meeting;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;
import java.util.stream.Stream;

import static com.haruon.groupware.application.dbFixture.EmpFixture.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestIntegrationConfig
record MeetingManagementTest(
        MeetingRepository meetingRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        MeetingRoomRepository meetingRoomRepository,

        MeetingManagement meetingManagement,
        MeetingRoomManagement meetingRoomManagement,
        EntityManager entityManager
) {

    @AfterEach
    void tearDown() {
        meetingRepository.deleteAll();
        meetingRoomRepository.deleteAll();

        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Transactional
    @Test
    @DisplayName("회의 등록 테스트 - 활성화된 사원은 활성화된 회의실 예약을 할 수 있다.")
    void createMeeting_success() {
        Emp emp = saveApprovedEmp(empRepository, "202601001", "approvedEmp");
        long meetingRoomId = saveMeetingRoom();
        Long reserverId = emp.getId();
        String title = "testTitle";
        LocalDate meetingDate = LocalDate.now().plusDays(1);
        LocalTime startAt = LocalTime.of(10,0);
        LocalTime endAt = LocalTime.of(11,0);
        Set<Long> participantIds = Set.of(emp.getId());

        long reservedId = meetingManagement.reserve(
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

        entityManager.flush();
        entityManager.clear();

        Meeting meeting = meetingRepository.findById(reservedId).orElseThrow();
        assertThat(meeting).extracting(
                Meeting::getMeetingDate, Meeting::getStartAt, Meeting::getEndAt, Meeting::getTitle
        ).containsExactly(
                meetingDate, startAt, endAt, title
        );

        assertEquals(meeting.getMeetingRoom().getId(), meetingRoomId);

        assertThat(meeting.getSourceKey())
                .as("일정 식별키는 랜덤값으로 기본값 설정")
                .isNotNull();

        assertThat(meeting.isCancel())
                .as("일정 취소여부는 false가 기본값")
                .isFalse();
    }

    @Transactional
    @Test
    @DisplayName("활성화 되어있지 않은 회의실이라면 예약할 수 없다.")
    void reserve_to_deactivated_room_fail() {
        Emp emp = saveApprovedEmp(empRepository, "202601002", "approvedEmp2");
        long meetingRoomId = saveDeactivatedMeetingRoom();

        entityManager.flush();
        entityManager.clear();

        assertThatThrownBy(() ->
                getSavedTomorrowReservation(emp, meetingRoomRepository.findById(meetingRoomId).orElseThrow())
        ).isInstanceOf(InactivatedMeetingRoomException.class);
    }

    private Stream<Arguments> reserveFailArguments() {
        String title = "title";
        LocalDate meetingDate = LocalDate.now().plusDays(1);
        LocalTime startAt = LocalTime.of(9, 0);
        LocalTime endAt = startAt.plusHours(1);

        return Stream.of(
                Arguments.of("종료시각은 시작시각보다 늦어야 함",
                        title, meetingDate, startAt, startAt.minusHours(1),
                        EndTimeBeforeStartTimeException.class
                ),Arguments.of("회의 제목을 빈값이 될 수없음",
                        "     ", meetingDate, startAt, endAt,
                        BlankValueNotAllowedException.class
                ), Arguments.of("과거일시를 회의일로 지정할 수 없음",
                        title, LocalDate.now().minusDays(1), startAt, endAt,
                        PastTimeNotAllowedException.class
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("reserveFailArguments")
    @DisplayName("예약 실패 케이스")
    void reserve_fails_cases(
            String description, String title, LocalDate meetingDate,
            LocalTime startAt, LocalTime endAt, Class<? extends ApplicationException> exceptedException
    ) {
        Emp emp = saveApprovedEmp(empRepository, "202601011", "approvedEmp11");
        long meetingRoomId = saveMeetingRoom();
        Set<Long> participantIds = Set.of(emp.getId());

        assertThatThrownBy(() ->
            meetingManagement.reserve(
                    MeetingReserveRequest.builder()
                            .meetingRoomId(meetingRoomId)
                            .reserverId(emp.getId())
                            .title(title)
                            .meetingDate(meetingDate)
                            .startAt(startAt)
                            .endAt(endAt)
                            .participantIds(participantIds)
                            .build()
            )
        ).isInstanceOf(exceptedException);
    }

    @Test
    @DisplayName("예약 실패 케이스 - 회의 참가자 없이 예약을 할 수 없다.")
    void reserve_fails_cases() {
        Emp emp = saveApprovedEmp(empRepository, "202601011", "approvedEmp11");
        long meetingRoomId = saveMeetingRoom();
        String title = "title";
        LocalDate meetingDate = LocalDate.now().plusDays(1);
        LocalTime startAt = LocalTime.of(9, 0);
        LocalTime endAt = LocalTime.of(10, 0);
        Set<Long> participantIds = Set.of();

        assertThatThrownBy(() ->
                meetingManagement.reserve(
                        MeetingReserveRequest.builder()
                                .meetingRoomId(meetingRoomId)
                                .reserverId(emp.getId())
                                .title(title)
                                .meetingDate(meetingDate)
                                .startAt(startAt)
                                .endAt(endAt)
                                .participantIds(participantIds)
                                .build()
                )
        ).isInstanceOf(RequiredValueMissingException.class);
    }

    @Transactional
    @Test
    @DisplayName("활성화 되어있지 않은 회의실이라면 예약할 수 없다.")
    void reserve_without_participants_fail() {
        long roomId = saveDeactivatedMeetingRoom();

        entityManager.flush();
        entityManager.clear();
        
        assertThatThrownBy(() ->
                meetingManagement.reserve(
                        MeetingReserveRequest.builder()
                                .meetingRoomId(roomId)
                                .reserverId(1L)
                                .title("testTitle")
                                .meetingDate(LocalDate.now().plusDays(1))
                                .startAt(LocalTime.of(10,0))
                                .endAt(LocalTime.of(11,0))
                                .participantIds(Set.of(saveApprovedEmp(empRepository, "202601003", "approvedEmp3").getId()))
                                .build())
        ).isInstanceOf(InactivatedMeetingRoomException.class);

    }

    @Transactional
    @Test
    @DisplayName("익일 이후의 회의 예약 참가자명단을 수정할 수 있다.")
    void replace_participants() {
        Emp emp = saveApprovedEmp(empRepository, "202601011", "approvedEmp11");
        long meetingRoomId = saveMeetingRoom();
        long reservationId = getSavedTomorrowReservation(emp, meetingRoomRepository.findById(meetingRoomId).orElseThrow());

        Long participantId1 = saveApprovedEmp(empRepository, "202601003", "approvedEmp3").getId();
        Long participantId2 = saveApprovedEmp(empRepository, "202601004", "approvedEmp4").getId();

        meetingManagement.replaceParticipants(
                reservationId, emp.getId(), Set.of(participantId1, participantId2)
        );

        entityManager.flush();
        entityManager.clear();

        Meeting meeting = meetingRepository.findById(reservationId).orElseThrow();

        assertThat(meeting.getMeetingParticipants()).hasSize(2);
        assertThat(meeting.getMeetingParticipants().stream().map(p -> p.getEmp().getId()))
                .containsExactlyInAnyOrder(participantId1, participantId2);
    }

    @Transactional
    @Test
    @DisplayName("익일 이후의 회의를 취소할 수 있다.")
    void cancel_meeting() {
        Emp emp = saveApprovedEmp(empRepository, "202601011", "approvedEmp11");
        long meetingRoomId = saveMeetingRoom();
        long reservationId = getSavedTomorrowReservation(emp, meetingRoomRepository.findById(meetingRoomId).orElseThrow());

        meetingManagement.cancelMeeting(reservationId, emp.getId());

        entityManager.flush();
        entityManager.clear();

        Meeting meeting = meetingRepository.findById(reservationId).orElseThrow();

        assertTrue(meeting.isCancel());
    }

    @Transactional
    @Test
    @DisplayName("익일 이후의 회의 예약정보를 수정할 수 있다.")
    void changeReservation_info_success() {
        Emp emp = saveApprovedEmp(empRepository, "202601011", "approvedEmp11");
        long meetingRoomId = saveMeetingRoom();
        long reservationId = getSavedTomorrowReservation(emp, meetingRoomRepository.findById(meetingRoomId).orElseThrow());

        LocalDate editedMeetingDate = LocalDate.now().plusDays(2);
        LocalTime editedStartAt = LocalTime.of(12, 0);
        LocalTime editedEndAt = LocalTime.of(15, 0);
        String editedTitle = "editedTitle";
        long otherRoomId = saveMeetingRoom("otherRoom");

        meetingManagement.changeReservationInfo(
                MeetingUpdateRequest.builder()
                        .meetingId(reservationId)
                        .reserverId(emp.getId())
                        .meetingDate(editedMeetingDate)
                        .startAt(editedStartAt)
                        .endAt(editedEndAt)
                        .title(editedTitle)
                        .meetingRoomId(otherRoomId)
                .build()
        );

        entityManager.flush();
        entityManager.clear();
        Meeting editedMeeting = meetingRepository.findById(reservationId).orElseThrow();

        assertThat(editedMeeting).extracting(
                Meeting::getMeetingDate, Meeting::getStartAt, Meeting::getEndAt, Meeting::getTitle
        ).containsExactly(
                editedMeetingDate, editedStartAt, editedEndAt, editedTitle
        );

        assertEquals(editedMeeting.getMeetingRoom().getId(), otherRoomId);
    }


    @Transactional
    @Test
    @DisplayName("변경할 정보가 없다면 수정할 수 없다.")
    void changeReservation_info_fail() {
        Emp emp = saveApprovedEmp(empRepository, "202601011", "approvedEmp11");
        long meetingRoomId = saveMeetingRoom();
        long reservationId = getSavedTomorrowReservation(emp, meetingRoomRepository.findById(meetingRoomId).orElseThrow());

        assertThatThrownBy(() ->
                meetingManagement.changeReservationInfo(
                        MeetingUpdateRequest.builder()
                                .meetingId(reservationId)
                                .reserverId(emp.getId())
                                .build()
                )
        ).isInstanceOf(RequiredValueMissingException.class);
    }

    @Transactional
    @Test
    @DisplayName("예약자와 다른 사원이 회의 예약정보를 수정할 수 없다.")
    void changeReservation_info_by_other_reserver_fail() {
        Emp emp = saveApprovedEmp(empRepository, "202601011", "approvedEmp11");
        long meetingRoomId = saveMeetingRoom();
        long reservationId = getSavedTomorrowReservation(emp, meetingRoomRepository.findById(meetingRoomId).orElseThrow());

        Emp otherEmp = saveApprovedEmp(empRepository, "202601002", "approvedEmp2");

        assertThatThrownBy(() ->
                meetingManagement.changeReservationInfo(
                        MeetingUpdateRequest.builder()
                                .meetingId(reservationId)
                                .reserverId(otherEmp.getId())
                                .meetingDate(LocalDate.now().plusDays(2))
                                .startAt(LocalTime.of(12, 0))
                                .endAt(LocalTime.of(15, 0))
                                .title("editedTitle")
                                .build()
                )
        ).isInstanceOf(MeetingNotFoundException.class);
    }

    @Transactional
    @Test
    @DisplayName("존재하지 않은 회의실로 회의 예약정보를 수정할 수 없다.")
    void changeReservation_info_with_not_exist_room_fail() {
        Emp emp = saveApprovedEmp(empRepository, "202601011", "approvedEmp11");
        long meetingRoomId = saveMeetingRoom();
        long reservationId = getSavedTomorrowReservation(emp, meetingRoomRepository.findById(meetingRoomId).orElseThrow());

        long notExistRoomId = 100L;
        assertThatThrownBy(() ->
                meetingManagement.changeReservationInfo(
                        MeetingUpdateRequest.builder()
                                .meetingId(reservationId)
                                .reserverId(emp.getId())
                                .meetingDate(LocalDate.now().plusDays(2))
                                .startAt(LocalTime.of(12, 0))
                                .endAt(LocalTime.of(15, 0))
                                .title("editedTitle")
                                .meetingRoomId(notExistRoomId)
                                .build()
                )
        ).isInstanceOf(InactivatedMeetingRoomException.class);
    }

    private long getSavedTomorrowReservation(Emp reserverEmp, MeetingRoom room) {
        long meetingRoomId = room.getId();
        Long reserverId = reserverEmp.getId();
        String title = "testTitle";
        LocalDate meetingDate = LocalDate.now().plusDays(1);
        LocalTime startAt = LocalTime.of(10,0);
        LocalTime endAt = LocalTime.of(11,0);
        Set<Long> participantIds = Set.of(reserverEmp.getId());

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
        Dept dept = saveDept(deptRepository, "202601100", "facility");

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

    private long saveMeetingRoom(String roomName) {
        Dept dept = saveDept(deptRepository, "202601100", "facility");

        Emp emp = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601001", "facility1", dept, SystemRoleCode.FACILITY
        );

        return meetingRoomManagement.createMeetingRoom(
                MeetingRoomCreateRequest.builder()
                        .editorId(emp.getId())
                        .name(roomName)
                        .description("testDescription")
                        .capacity(10)
                        .build()
        );
    }

    private long saveDeactivatedMeetingRoom() {
        Dept dept = saveDept(deptRepository, "202601100", "facility");

        Emp emp = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601001", "facility1", dept, SystemRoleCode.FACILITY
        );

        long meetingRoom = meetingRoomManagement.createMeetingRoom(
                MeetingRoomCreateRequest.builder()
                        .editorId(emp.getId())
                        .name("testRoom")
                        .description("testDescription")
                        .capacity(10)
                        .build()
        );

        meetingRoomManagement.deactivate(meetingRoom, emp.getId());

        return meetingRoomRepository.findById(meetingRoom).orElseThrow().getId();
    }


}