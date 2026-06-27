package com.haruon.groupware.adapter.webapi.schedule;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.schedule.service.command.dto.ManualScheduleCreateRequest;
import com.haruon.groupware.application.schedule.service.command.dto.ManualScheduleUpdateRequest;
import com.haruon.groupware.application.utils.required.CompanyPolicyPort;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.schedule.Schedule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ScheduleApiTest extends IntegrationTestSupport {

    private static final String PASSWORD = "!Q2w3e4r5t";

    @Autowired private ScheduleRepository scheduleRepository;
    @MockitoBean private CompanyPolicyPort companyPolicyPort;

    @BeforeEach
    void setUpCompanyPolicy() {
        when(companyPolicyPort.getStartTime()).thenReturn(LocalTime.of(9, 0));
        when(companyPolicyPort.getEndTime()).thenReturn(LocalTime.of(18, 0));
    }

    @AfterEach
    void tearDownSchedule() {
        scheduleRepository.deleteAll();
        entityManager.clear();
    }

    @Test
    @DisplayName("ScheduleApi 조회 및 명령 API 통합 테스트")
    void scheduleQueriesAndCommands() throws Exception {
        String ownerLoginId = "scheduleOwner";
        String participantLoginId = "scheduleParticipant";
        activatedEmp(ownerLoginId, PASSWORD);
        activatedEmp(participantLoginId, PASSWORD);
        Emp owner = emp(ownerLoginId);
        Emp participant = emp(participantLoginId);
        String accessToken = loginByIdAndPw(ownerLoginId, PASSWORD);

        LocalDateTime startAt = LocalDateTime.of(2099, 6, 21, 10, 0);
        LocalDateTime endAt = LocalDateTime.of(2099, 6, 21, 11, 0);
        ManualScheduleCreateRequest createRequest = ManualScheduleCreateRequest.builder()
                .title("개인 일정")
                .content("일정 내용")
                .startAt(startAt)
                .endAt(endAt)
                .build();

        MvcResult result = mockMvc.perform(post("/api/schedules")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sourceKey").isString())
                .andReturn();

        String sourceKey = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("sourceKey")
                .asText();
        Schedule schedule = scheduleRepository.findBySourceKey(sourceKey).getFirst();

        mockMvc.perform(get("/api/schedules/calendar")
                        .header("Authorization", BEARER + accessToken)
                        .param("start", startAt.toLocalDate().atStartOfDay().toString())
                        .param("end", startAt.toLocalDate().plusDays(1).atStartOfDay().toString())
                        .param("scheduleType", "MANUAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].scheduleId").value(schedule.getId()))
                .andExpect(jsonPath("$[0].title").value("개인 일정"));

        mockMvc.perform(get("/api/schedules/{scheduleId}", schedule.getId())
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scheduleId").value(schedule.getId()))
                .andExpect(jsonPath("$.ownerId").value(owner.getId()))
                .andExpect(jsonPath("$.isEditable").value(true));

        ScheduleCommandApi.TargetParticipants participants =
                new ScheduleCommandApi.TargetParticipants(Set.of(participant.getId()));

        mockMvc.perform(post("/api/schedules/{scheduleId}/participants", schedule.getId())
                        .header("Authorization", BEARER + accessToken)
                        .param("scope", "SINGLE")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(participants)))
                .andExpect(status().isCreated());

        ManualScheduleUpdateRequest updateRequest = ManualScheduleUpdateRequest.builder()
                .title("수정 일정")
                .content("수정 내용")
                .startAt(LocalTime.of(13, 0))
                .endAt(LocalTime.of(14, 0))
                .build();

        mockMvc.perform(patch("/api/schedules/{scheduleId}", schedule.getId())
                        .header("Authorization", BEARER + accessToken)
                        .param("scope", "SINGLE")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(updateRequest)))
                .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/schedules/{scheduleId}/participants", schedule.getId())
                        .header("Authorization", BEARER + accessToken)
                        .param("scope", "SINGLE")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(participants)))
                .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/schedules/{scheduleId}/cancellation", schedule.getId())
                        .header("Authorization", BEARER + accessToken)
                        .param("scope", "SINGLE"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/schedules/{scheduleId}", schedule.getId())
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("수정 일정"))
                .andExpect(jsonPath("$.startAt").value("13:00:00"))
                .andExpect(jsonPath("$.endAt").value("14:00:00"))
                .andExpect(jsonPath("$.isCanceled").value(true))
                .andExpect(jsonPath("$.participantCount").value(1));
    }

    @Test
    @DisplayName("ScheduleApi 인증되지 않은 요청 거부 통합 테스트")
    void rejectUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/api/schedules/calendar"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("ScheduleApi 일정 소유자가 아닌 사원의 수정 요청 거부 통합 테스트")
    void rejectUpdateByNonOwner() throws Exception {
        String ownerLoginId = "scheduleOwner2";
        String otherLoginId = "scheduleOther";
        activatedEmp(ownerLoginId, PASSWORD);
        activatedEmp(otherLoginId, PASSWORD);
        String ownerAccessToken = loginByIdAndPw(ownerLoginId, PASSWORD);
        String otherAccessToken = loginByIdAndPw(otherLoginId, PASSWORD);

        ManualScheduleCreateRequest createRequest = ManualScheduleCreateRequest.builder()
                .title("소유자 일정")
                .content("소유자만 수정")
                .startAt(LocalDateTime.of(2099, 6, 22, 10, 0))
                .endAt(LocalDateTime.of(2099, 6, 22, 11, 0))
                .build();

        MvcResult result = mockMvc.perform(post("/api/schedules")
                        .header("Authorization", BEARER + ownerAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();
        String sourceKey = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("sourceKey")
                .asText();
        Schedule schedule = scheduleRepository.findBySourceKey(sourceKey).getFirst();

        mockMvc.perform(patch("/api/schedules/{scheduleId}", schedule.getId())
                        .header("Authorization", BEARER + otherAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"권한 없는 수정\"}"))
                .andExpect(status().isForbidden());
    }

    private Emp emp(String loginId) {
        return empRepository.findByLoginId(loginId).orElseThrow();
    }
}
