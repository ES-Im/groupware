package com.haruon.groupware.adapter.webapi.meeting;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.meeting.provided.forCommand.MeetingManagement;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomUpdateRequest;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import com.haruon.groupware.domain.shared.Email;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.Set;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MeetingRoomApiTest extends IntegrationTestSupport {

    @Autowired private MeetingManagement meetingManagement;
    @Autowired private MeetingRepository meetingRepository;
    @Autowired private MeetingRoomRepository meetingRoomRepository;
    @Autowired private ScheduleRepository scheduleRepository;

    @AfterEach
    void tearDownMeetingRoom() {
        scheduleRepository.deleteAll();
        meetingRepository.deleteAll();
        meetingRoomRepository.deleteAll();
    }

    @Test
    @DisplayName("MeetingRoomApi 조회 및 명령 API 통합 테스트")
    void meetingRoomQueries() throws Exception {
        String loginId = "facilityRoomApi";
        String password = "!Q2w3e4r5t";
        Emp facility = saveFacility(loginId, password);
        MeetingRoom bookedRoom = meetingRoomRepository.save(
                MeetingRoom.createMeetingRoom("예약 회의실", "예약 있음", 10)
        );
        MeetingRoom emptyRoom = meetingRoomRepository.save(
                MeetingRoom.createMeetingRoom("빈 회의실", "예약 없음", 20)
        );
        LocalDate meetingDate = LocalDate.now(SEOUL_ZONE).plusDays(1);
        meetingManagement.reserve(
                MeetingReserveRequest.builder()
                        .meetingRoomId(bookedRoom.getId())
                        .reserverId(facility.getId())
                        .title("예약된 회의")
                        .meetingDate(meetingDate)
                        .startAt(LocalTime.of(10, 0))
                        .endAt(LocalTime.of(11, 0))
                        .participantIds(Set.of(facility.getId()))
                        .build()
        );
        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(get("/api/meeting-rooms/available")
                        .header("Authorization", BEARER + accessToken)
                        .param("date", meetingDate.toString())
                        .param("startAt", "10:00")
                        .param("endAt", "11:00")
                        .param("capacity", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].meetingRoomId").value(emptyRoom.getId()));

        mockMvc.perform(get("/api/meeting-rooms/management")
                        .header("Authorization", BEARER + accessToken)
                        .param("bookedInFuture", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].meetingRoomId").value(bookedRoom.getId()));

        mockMvc.perform(get("/api/meeting-rooms/management")
                        .header("Authorization", BEARER + accessToken)
                        .param("bookedInFuture", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].meetingRoomId").value(emptyRoom.getId()));

        mockMvc.perform(get("/api/meeting-rooms/{meetingRoomId}/reservations/calendar", bookedRoom.getId())
                        .header("Authorization", BEARER + accessToken)
                        .param("yearMonth", YearMonth.from(meetingDate).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(get("/api/meeting-rooms/{meetingRoomId}", bookedRoom.getId())
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("예약 회의실"));

        mockMvc.perform(get("/api/meeting-rooms/{meetingRoomId}/files", bookedRoom.getId())
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(get("/api/meeting-rooms/{meetingRoomId}", Long.MAX_VALUE)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/meeting-rooms/available")
                        .header("Authorization", BEARER + accessToken)
                        .param("date", meetingDate.toString())
                        .param("startAt", "10:00")
                        .param("endAt", "10:00")
                        .param("capacity", "5"))
                .andExpect(status().isBadRequest());

        MeetingRoomCreateRequest createRequest = MeetingRoomCreateRequest.builder()
                .name("신규 회의실")
                .description("신규 회의실 설명")
                .capacity(12)
                .build();

        mockMvc.perform(post("/api/meeting-rooms")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.meetingRoomId").isNumber());

        MeetingRoomUpdateRequest updateRequest = MeetingRoomUpdateRequest.builder()
                .name("수정 회의실")
                .description("수정된 설명")
                .capacity(25)
                .build();

        mockMvc.perform(patch("/api/meeting-rooms/{meetingRoomId}", emptyRoom.getId())
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(updateRequest)))
                .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/meeting-rooms/{meetingRoomId}/deactivate", emptyRoom.getId())
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/meeting-rooms/{meetingRoomId}/activate", emptyRoom.getId())
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());
    }

    private Emp saveFacility(String loginId, String password) {
        Dept dept = getDept("902", "시설운영팀");
        Emp emp = Emp.register("202690002", "시설운영자", loginId, password, Email.of(loginId, "haruon.com"), encoder);
        emp.approveRegister(LocalDate.of(2026, 1, 1));
        emp.changeBelongingsByHR(dept, PositionCode.STAFF, true, LocalDate.of(2026, 1, 1), null);
        emp.changeInfoByHR(null, null, null, Set.of(SystemRoleCode.FACILITY), null, null);
        return empRepository.save(emp);
    }
}
