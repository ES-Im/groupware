package com.haruon.groupware.application.meeting.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.application.meeting.service.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomFileCreateRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomUpdateRequest;
import com.haruon.groupware.application.utils.FileDto;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@TestIntegrationConfig
record MeetingRoomManagementTest(
        MeetingRepository meetingRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        MeetingRoomRepository meetingRoomRepository,

        MeetingRoomManagement meetingRoomManagement,
        MeetingManagement meetingManagement,
        EntityManager entityManager
) {
    @AfterEach
    void tearDown() {
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
                MeetingRoomCreateRequest.builder()
                        .editorId(emp.getId())
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

    @Test
    @DisplayName("회의실 등록 테스트 - Facility 권한을 가진 활성사원이라면 회의실 수정이 가능하다")
    void updateMeetingRoom_info_success() {
        Emp emp = getFacilityRoleEmp("202601001", "facility1");

        String editedRoomName = "edit_testRoom";
        String editedDescription = "edit_testDescription";
        int editedCapacity = 11;

        long meetingRoom = saveMeetingRoom(emp);

        meetingRoomManagement.changeRoomInfo(
                MeetingRoomUpdateRequest.builder()
                        .roomId(meetingRoom)
                        .editorId(emp.getId())
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
        ).hasMessage("권한이 없습니다.");
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

    private static Stream<Arguments> RoomFileFailArguments() {
        String mimeType = "image/png";
        String originalFileFullName = "originName.png";
        Long fileSize = 10*1024*1024L;

        return Stream.of(
                Arguments.of("확장자는  'jpg', 'jpeg', 'png' 가능하며 그 이외는 추가할 수 없다.",
                        FileDto.builder()
                                .mimeType(mimeType)
                                .originalFileFullName("orginName.exe")
                                .fileSize(fileSize)
                                .build(),
                        "허용되지 않는 파일 확장자"
                ), Arguments.of("mimeType은 'image/jpeg', 'image/jpg', 'image/png' 가능하며 그 이외에는 추가할 수 없다.",
                        FileDto.builder()
                                .mimeType("application/octet-stream")
                                .originalFileFullName(originalFileFullName)
                                .fileSize(fileSize)
                                .build(),
                        "허용되지 않는 MIME 타입"
                ), Arguments.of("파일 크기는 10 * 1024 * 1024L 까지 가능",
                        FileDto.builder()
                                .mimeType(mimeType)
                                .originalFileFullName(originalFileFullName)
                                .fileSize(fileSize+1L)
                                .build(),
                        "파일 크기 제한 초과"
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("RoomFileFailArguments")
    @DisplayName("회의실 파일 등록 실패 테스트")
    void addRoomFile_fail(String description, FileDto fileDto, String expectedMessage) {
        Emp emp = getFacilityRoleEmp("202601001", "facility1");
        long roomId = saveMeetingRoom(emp);
        
        assertThatThrownBy(() ->
                meetingRoomManagement.addRoomFile(
                        MeetingRoomFileCreateRequest.builder()
                                .meetingRoomId(roomId)
                                .editorId(emp.getId())
                                .file(fileDto)
                                .build()
                )
        ).hasMessage(expectedMessage);
    }

    @Transactional
    @Test
    @DisplayName("회의실 파일 등록 테스트 - 활성화여부와 예약상태 상관없이 회의실 이미지 편집 가능")
    void addRoomFile_success() {
        Emp emp = getFacilityRoleEmp("202601001", "facility1");
        long roomId = saveMeetingRoom(emp);

        meetingRoomManagement.addRoomFile(
                MeetingRoomFileCreateRequest.builder()
                        .meetingRoomId(roomId)
                        .editorId(emp.getId())
                        .file(
                                FileDto.builder()
                                        .mimeType("image/png")
                                        .originalFileFullName("orginName.png")
                                        .fileSize(10*1024*1024L)
                                        .build()
                        )
                .build()
        );

        entityManager.flush();
        entityManager.clear();

        MeetingRoom room = meetingRoomRepository.findById(roomId).orElseThrow();

        assertThat(room.getRoomFiles()).hasSize(1);
    }

    @Transactional
    @Test
    @DisplayName("회의실 파일 삭제 테스트 - 활성화여부와 예약상태 상관없이 회의실 이미지 편집 가능")
    void removeRoomFile_success() {
        Emp emp = getFacilityRoleEmp("202601001", "facility1");
        long roomId = saveMeetingRoom(emp);

        meetingRoomManagement.addRoomFile(
                MeetingRoomFileCreateRequest.builder()
                        .meetingRoomId(roomId)
                        .editorId(emp.getId())
                        .file(
                                FileDto.builder()
                                        .mimeType("image/png")
                                        .originalFileFullName("orginName.png")
                                        .fileSize(10*1024*1024L)
                                        .build()
                        )
                .build()
        );

        entityManager.flush();
        entityManager.clear();

        MeetingRoom room = meetingRoomRepository.findById(roomId).orElseThrow();
        Long id = room.getRoomFiles().getFirst().getId();

        meetingRoomManagement.removeRoomFile(roomId, emp.getId(), id);

        assertThat(meetingRoomRepository.findById(roomId).orElseThrow().getRoomFiles()).isEmpty();
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
                        MeetingRoomUpdateRequest.builder()
                                .roomId(roomId)
                                .editorId(emp.getId())
                                .name("name")
                                .build()
                )
        ).hasMessage("미래에 예약된 회의가 있어 회의실 정보 수정 불가");

        assertThatThrownBy(() ->
                meetingRoomManagement.deactivate(roomId, emp.getId())
        ).hasMessage("미래에 예약된 회의가 있어 회의실 정보 수정 불가");
    }


    private long saveMeetingRoom(Emp emp) {
        String roomName = "testRoom";
        String description = "testDescription";
        int capacity = 10;

        return meetingRoomManagement.createMeetingRoom(
                MeetingRoomCreateRequest.builder()
                        .editorId(emp.getId())
                        .name(roomName)
                        .description(description)
                        .capacity(capacity)
                        .build()
        );
    }

    private Emp getFacilityRoleEmp(String empNo, String loginId) {
        Dept dept = saveDept(deptRepository, "001", "facility");

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