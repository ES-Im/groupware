package com.haruon.groupware.adapter.webapi.meeting;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.meeting.provided.forCommand.MeetingManagement;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingUpdateRequest;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.domain.employee.Dept;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.employee.enums.PositionCode;
import com.haruon.groupware.domain.employee.enums.SystemRoleCode;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MeetingApiTest extends IntegrationTestSupport {

    @Autowired private MeetingManagement meetingManagement;
    @Autowired private MeetingRepository meetingRepository;
    @Autowired private MeetingRoomRepository meetingRoomRepository;
    @Autowired private ScheduleRepository scheduleRepository;

    @AfterEach
    void tearDownMeeting() {
        scheduleRepository.deleteAll();
        meetingRepository.deleteAll();
        meetingRoomRepository.deleteAll();
    }

    @Test
    @DisplayName("MeetingApi 조회 및 명령 API 통합 테스트")
    void meetingQueries() throws Exception {
        String loginId = "facilityMeetingApi";
        String password = "!Q2w3e4r5t";
        Emp facility = saveFacility(loginId, password);
        MeetingRoom room = meetingRoomRepository.save(
                MeetingRoom.createMeetingRoom("대회의실", "프로젝터 구비", 20)
        );
        LocalDate meetingDate = LocalDate.now(SEOUL_ZONE).plusDays(1);
        long meetingId = meetingManagement.reserve(
                MeetingReserveRequest.builder()
                        .meetingRoomId(room.getId())
                        .reserverId(facility.getId())
                        .title("주간 회의")
                        .meetingDate(meetingDate)
                        .startAt(LocalTime.of(10, 0))
                        .endAt(LocalTime.of(11, 0))
                        .participantIds(Set.of(facility.getId()))
                        .build()
        );
        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(get("/api/meetings/my/reservations/calendar")
                        .header("Authorization", BEARER + accessToken)
                        .param("start", meetingDate.atStartOfDay().toString())
                        .param("end", meetingDate.plusDays(1).atStartOfDay().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].meetingId").value(meetingId));

        mockMvc.perform(get("/api/meetings/{meetingId}", meetingId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meetingId").value(meetingId))
                .andExpect(jsonPath("$.title").value("주간 회의"));

        mockMvc.perform(get("/api/meetings")
                        .header("Authorization", BEARER + accessToken)
                        .param("yearMonth", YearMonth.from(meetingDate).toString())
                        .param("keyword", "주간")
                        .param("meetingRoomId", room.getId().toString())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].meetingId").value(meetingId));

        mockMvc.perform(get("/api/meetings/{meetingId}", Long.MAX_VALUE)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNotFound());

        MeetingReserveRequest reserveRequest = MeetingReserveRequest.builder()
                .meetingRoomId(room.getId())
                .reserverId(facility.getId())
                .title("API 예약")
                .meetingDate(meetingDate.plusDays(1))
                .startAt(LocalTime.of(12, 0))
                .endAt(LocalTime.of(13, 0))
                .participantIds(Set.of(facility.getId()))
                .build();

        mockMvc.perform(post("/api/meetings")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(reserveRequest)))
                .andExpect(status().isCreated());

        MeetingUpdateRequest updateRequest = MeetingUpdateRequest.builder()
                .title("수정된 회의")
                .startAt(LocalTime.of(14, 0))
                .endAt(LocalTime.of(15, 0))
                .build();

        mockMvc.perform(patch("/api/meetings/{meetingId}/reservation-info", meetingId)
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(updateRequest)))
                .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/meetings/{meetingId}/participants", meetingId)
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"participantIds\":[" + facility.getId() + "]}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/meetings/{meetingId}/participants", meetingId)
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"participantIds\":null}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/meetings/{meetingId}/cancel", meetingId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());
    }

    private Emp saveFacility(String loginId, String password) {
        Dept dept = getDept("901", "시설관리팀");
        Emp emp = Emp.register("202690001", "시설담당자", loginId, password, Email.of(loginId, "haruon.com"), encoder);
        emp.approveRegister(LocalDate.of(2026, 1, 1));
        emp.changeBelongingsByHR(dept, PositionCode.STAFF, true, LocalDate.of(2026, 1, 1), null);
        emp.changeInfoByHR(null, null, null, Set.of(SystemRoleCode.FACILITY), null, null);
        return empRepository.save(emp);
    }
}
