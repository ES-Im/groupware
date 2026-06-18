package com.haruon.groupware.application.meeting.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.exception.meeting.ReservedMeetingExistException;
import com.haruon.groupware.application.meeting.provided.forCommand.MeetingManagement;
import com.haruon.groupware.application.meeting.provided.forCommand.MeetingRoomManagement;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomUpdateRequest;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

import static com.haruon.groupware.application.dbFixture.EmpFixture.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@TestIntegrationConfig
record MeetingRoomManagementTest(
        MeetingRepository meetingRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        MeetingRoomRepository meetingRoomRepository,
        ScheduleRepository scheduleRepository,

        MeetingRoomManagement meetingRoomManagement,
        MeetingManagement meetingManagement,
        EntityManager entityManager
) {
    @AfterEach
    void tearDown() {
        scheduleRepository.deleteAll();
        meetingRepository.deleteAll();
        meetingRoomRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @DisplayName("회의실 등록 테스트 - Facility 권한을 가진 활성사원이라면 회의실 등록이 가능하다")
    void createMeetingRoom_success() {
        Emp emp = getFacilityRoleEmp("202601001", "facility1");

        String roomName = "testRoom";
        String description = "testDescription";
        int capacity = 10;

        long meetingRoomId = meetingRoomManagement.createMeetingRoom(
                emp.getId(),
                MeetingRoomCreateRequest.builder()
                        .name(roomName)
                        .description(description)
                        .capacity(capacity)
                        .build()
        );

        MeetingRoom room = meetingRoomRepository.findById(meetingRoomId).orElseThrow();

        assertThat(room).extracting(
                MeetingRoom::getName, MeetingRoom::getDescription, MeetingRoom::getCapacity
        ).containsExactly(roomName, description, capacity);

        assertThat(room.isAvailable())
                .as("회의실 등록시, 기본 활성화 기본값은 true이다")
                .isTrue();
    }

    @Transactional
    @Test
    @DisplayName("회의실 등록 테스트 - Facility 권한을 가진 활성사원이라면 회의실 수정이 가능하다")
    void updateMeetingRoom_info_success() {
        Emp emp = getFacilityRoleEmp("202601001", "facility1");

        String editedRoomName = "edit_testRoom";
        String editedDescription = "edit_testDescription";
        int editedCapacity = 11;

        long meetingRoom = saveMeetingRoom(emp);

        meetingRoomManagement.changeRoomInfo(
                meetingRoom,
                emp.getId(),
                MeetingRoomUpdateRequest.builder()
                        .name(editedRoomName)
                        .description(editedDescription)
                        .capacity(editedCapacity)
                .build()
        );

        MeetingRoom room = meetingRoomRepository.findById(meetingRoom).orElseThrow();

        assertThat(room).extracting(
                MeetingRoom::getName, MeetingRoom::getDescription, MeetingRoom::getCapacity
        ).containsExactly(editedRoomName, editedDescription, editedCapacity);
    }

    @Test
    @DisplayName("회의실 등록 테스트 - Facility 또는 Admin 권한이 없다면 회의실 수정이 불가능")
    void createMeetingRoom_info_by_not_having_role_fail() {
        Emp notHavingRoleEmp = saveApprovedEmp(empRepository, "202601002", "normalEmp2");

        assertThatThrownBy(() ->
                saveMeetingRoom(notHavingRoleEmp)
        ).isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    @DisplayName("회의실 비활성화 테스트 - 미래에 예약이 없는 회의실 대상 비활성화 가능")
    void deactivate_room_success() {
        Emp emp = getFacilityRoleEmp("202601001", "facility1");

        long roomId = saveMeetingRoom(emp);

        meetingRoomManagement.deactivate(roomId, emp.getId());

        MeetingRoom room = meetingRoomRepository.findById(roomId).orElseThrow();
        assertFalse(room.isAvailable());
    }

    @Test
    @DisplayName("회의실 활성화 테스트 - 비활성화된 회의실 활성화가능")
    void activate_room_success() {
        Emp emp = getFacilityRoleEmp("202601001", "facility1");

        long roomId = saveMeetingRoom(emp);
        meetingRoomManagement.deactivate(roomId, emp.getId());

        meetingRoomManagement.activate(roomId, emp.getId());

        MeetingRoom room = meetingRoomRepository.findById(roomId).orElseThrow();
        assertTrue(room.isAvailable());
    }

    @Test
    @DisplayName("회의실 수정 테스트 - 미래에 예약된 건이 있다면 회의실 수정이 불가")
    void update_room_info_when_already_have_reservation_future_fail() {
        Emp emp = getFacilityRoleEmp("202601001", "facility1");

        long roomId = saveMeetingRoom(emp);
        MeetingRoom room = meetingRoomRepository.findById(roomId).orElseThrow();
        getSavedReservation(emp, room);

        assertThatThrownBy(() ->
                meetingRoomManagement.changeRoomInfo(
                        roomId,
                        emp.getId(),
                        MeetingRoomUpdateRequest.builder()
                                .name("name")
                                .build()
                )
        ).isInstanceOf(ReservedMeetingExistException.class);

        assertThatThrownBy(() ->
                meetingRoomManagement.deactivate(roomId, emp.getId())
        ).isInstanceOf(ReservedMeetingExistException.class);
    }

    private long saveMeetingRoom(Emp emp) {
        String roomName = "testRoom";
        String description = "testDescription";
        int capacity = 10;

        return meetingRoomManagement.createMeetingRoom(
                emp.getId(),
                MeetingRoomCreateRequest.builder()
                        .name(roomName)
                        .description(description)
                        .capacity(capacity)
                        .build()
        );
    }

    private Emp getFacilityRoleEmp(String empNo, String loginId) {
        Dept dept = saveDept(deptRepository, "facility", "001");

        return saveEmpWithRoleAndDept(
                empRepository, deptRepository, empNo, loginId, dept, SystemRoleCode.FACILITY
        );
    }

    private long getSavedReservation(Emp reserverEmp, MeetingRoom room) {
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
}
