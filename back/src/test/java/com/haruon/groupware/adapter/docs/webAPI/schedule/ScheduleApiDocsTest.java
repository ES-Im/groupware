package com.haruon.groupware.adapter.docs.webapi.schedule;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.schedule.ScheduleCommandApi;
import com.haruon.groupware.adapter.webapi.schedule.ScheduleQueryApi;
import com.haruon.groupware.application.schedule.provided.forCommand.ScheduleManagement;
import com.haruon.groupware.application.schedule.provided.forRetriever.ScheduleRetriever;
import com.haruon.groupware.application.schedule.service.command.dto.ManualScheduleCreateRequest;
import com.haruon.groupware.application.schedule.service.command.dto.ManualScheduleUpdateRequest;
import com.haruon.groupware.application.schedule.service.query.dto.ScheduleDetailResponse;
import com.haruon.groupware.application.schedule.service.query.dto.ScheduleResponse;
import com.haruon.groupware.domain.schedule.ScheduleType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ScheduleApiDocsTest extends RestDocsSupport {

    private static final String REQUEST_MAPPING_URL = "/api/schedules";
    private final ScheduleRetriever scheduleRetriever = mock(ScheduleRetriever.class);
    private final ScheduleManagement scheduleManagement = mock(ScheduleManagement.class);

    @Override
    protected Object[] initControllers() {
        return new Object[]{
                new ScheduleQueryApi(scheduleRetriever),
                new ScheduleCommandApi(scheduleManagement)
        };
    }

    @Test
    @DisplayName("기간별 일정 조회 문서")
    void getSchedules() throws Exception {
        LocalDateTime start = LocalDateTime.of(2026, 6, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 7, 1, 0, 0);
        when(scheduleRetriever.retrieveSchedules(1L, start, end, ScheduleType.MANUAL))
                .thenReturn(List.of(scheduleResponse()));

        mockMvc.perform(get(REQUEST_MAPPING_URL + "/calendar")
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("start", start.toString())
                        .queryParam("end", end.toString())
                        .queryParam("scheduleType", "MANUAL"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("SCHEDULE_CALENDAR",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        queryParameters(
                                parameterWithName("start").optional().description("조회 시작 일시, yyyy-MM-dd'T'HH:mm:ss (포함). 미입력 시 조회 기준 월의 1일 0시 0분"),
                                parameterWithName("end").optional().description("조회 종료 일시, yyyy-MM-dd'T'HH:mm:ss (미포함). 미입력 시 조회 기준 다음 월의 1일 0시 0분"),
                                parameterWithName("scheduleType").optional().description("일정 유형: MANUAL, MEETING, LEAVE, BUSINESS_TRIP")
                        ),
                        responseFields(scheduleListFields())
                ));
    }

    @Test
    @DisplayName("일정 상세 조회 문서")
    void getSchedule() throws Exception {
        when(scheduleRetriever.retrieveSchedule(1L, 10L)).thenReturn(scheduleDetailResponse());

        mockMvc.perform(get(REQUEST_MAPPING_URL + "/{scheduleId}", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("SCHEDULE_DETAIL",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("scheduleId").description("일정 식별 번호")),
                        responseFields(scheduleDetailFields())
                ));
    }

    @Test
    @DisplayName("수기 일정 등록 문서")
    void registerManualSchedule() throws Exception {
        ManualScheduleCreateRequest request = ManualScheduleCreateRequest.builder()
                .title("개인 일정")
                .content("일정 내용")
                .startAt(LocalDateTime.of(2099, 6, 21, 10, 0))
                .endAt(LocalDateTime.of(2099, 6, 21, 11, 0))
                .build();
        when(scheduleManagement.registerSchedules(eq(1L), any(ManualScheduleCreateRequest.class)))
                .thenReturn("schedule-source-key");

        mockMvc.perform(post(REQUEST_MAPPING_URL)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("MANUAL_SCHEDULE_CREATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        requestFields(
                                fieldWithPath("title").type(JsonFieldType.STRING).attributes(key("constraints").value("필수, 공백 불가, 100자 이하")).description("일정 제목"),
                                fieldWithPath("content").type(JsonFieldType.STRING).attributes(key("constraints").value("필수, 공백 불가")).description("일정 내용"),
                                fieldWithPath("startAt").type(JsonFieldType.STRING).attributes(key("constraints").value("필수")).description("시작 일시, yyyy-MM-dd'T'HH:mm:ss"),
                                fieldWithPath("endAt").type(JsonFieldType.STRING).attributes(key("constraints").value("필수, 시작 일시 이후")).description("종료 일시, yyyy-MM-dd'T'HH:mm:ss")
                        ),
                        responseFields(fieldWithPath("sourceKey").type(JsonFieldType.STRING).description("동일 일정 묶음 식별 키"))
                ));
    }

    @Test
    @DisplayName("일정 참여자 추가 문서")
    void addScheduleParticipants() throws Exception {
        ScheduleCommandApi.TargetParticipants request =
                new ScheduleCommandApi.TargetParticipants(Set.of(2L, 3L));

        mockMvc.perform(post(REQUEST_MAPPING_URL + "/{scheduleId}/participants", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("scope", "SERIES")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andDo(document("SCHEDULE_PARTICIPANTS_ADD",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("일정 소유자 Bearer Access Token")),
                        pathParameters(parameterWithName("scheduleId").description("일정 식별 번호")),
                        queryParameters(parameterWithName("scope").optional().description("적용 범위: SINGLE(기본값), SERIES(동일 일정 전체)")),
                        requestFields(fieldWithPath("participantIds").type(JsonFieldType.ARRAY)
                                .attributes(key("constraints").value("필수, 빈 배열 및 null 요소 불가"))
                                .description("추가할 참여자 식별 번호 목록"))
                ));
    }

    @Test
    @DisplayName("일정 참여자 제외 문서")
    void removeScheduleParticipants() throws Exception {
        ScheduleCommandApi.TargetParticipants request =
                new ScheduleCommandApi.TargetParticipants(Set.of(2L, 3L));

        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{scheduleId}/participants", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("scope", "SERIES")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNoContent())
                .andDo(document("SCHEDULE_PARTICIPANTS_REMOVE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("일정 소유자 Bearer Access Token")),
                        pathParameters(parameterWithName("scheduleId").description("일정 식별 번호")),
                        queryParameters(parameterWithName("scope").optional().description("적용 범위: SINGLE(기본값), SERIES(동일 일정 전체)")),
                        requestFields(fieldWithPath("participantIds").type(JsonFieldType.ARRAY)
                                .attributes(key("constraints").value("필수, 빈 배열 및 null 요소 불가, 일정 소유자 제외 불가"))
                                .description("제외할 참여자 식별 번호 목록"))
                ));
    }

    @Test
    @DisplayName("일정 취소 문서")
    void cancelSchedules() throws Exception {
        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{scheduleId}/cancellation", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("scope", "SERIES"))
                .andExpect(status().isNoContent())
                .andDo(document("SCHEDULE_CANCEL",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("일정 소유자 Bearer Access Token")),
                        pathParameters(parameterWithName("scheduleId").description("일정 식별 번호")),
                        queryParameters(parameterWithName("scope").optional().description("적용 범위: SINGLE(기본값), SERIES(동일 일정 전체)"))
                ));
    }

    @Test
    @DisplayName("수기 일정 수정 문서")
    void updateSchedulesInfo() throws Exception {
        ManualScheduleUpdateRequest request = ManualScheduleUpdateRequest.builder()
                .title("수정 일정")
                .content("수정 내용")
                .startAt(LocalTime.of(13, 0))
                .endAt(LocalTime.of(14, 0))
                .build();

        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{scheduleId}", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("scope", "SERIES")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNoContent())
                .andDo(document("MANUAL_SCHEDULE_UPDATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("일정 소유자 Bearer Access Token")),
                        pathParameters(parameterWithName("scheduleId").description("일정 식별 번호")),
                        queryParameters(parameterWithName("scope").optional().description("적용 범위: SINGLE(기본값), SERIES(동일 일정 전체)")),
                        requestFields(
                                fieldWithPath("title").optional().type(JsonFieldType.STRING).attributes(key("constraints").value("선택, 공백 불가, 100자 이하")).description("변경할 일정 제목"),
                                fieldWithPath("content").optional().type(JsonFieldType.STRING).attributes(key("constraints").value("선택, 공백 불가")).description("변경할 일정 내용"),
                                fieldWithPath("startAt").optional().type(JsonFieldType.STRING).attributes(key("constraints").value("선택")).description("변경할 시작 시각, HH:mm:ss"),
                                fieldWithPath("endAt").optional().type(JsonFieldType.STRING).attributes(key("constraints").value("선택, 시작 시각 이후")).description("변경할 종료 시각, HH:mm:ss")
                        )
                ));
    }

    private ScheduleResponse scheduleResponse() {
        return new ScheduleResponse(
                10L, ScheduleType.MANUAL, "개인 일정",
                LocalDate.of(2026, 6, 21), LocalTime.of(10, 0), LocalTime.of(11, 0),
                false, false
        );
    }

    private ScheduleDetailResponse scheduleDetailResponse() {
        return new ScheduleDetailResponse(
                10L, ScheduleType.MANUAL,
                1L, "개발팀", "홍길동", true,
                "개인 일정", "일정 내용", LocalDate.of(2026, 6, 21),
                LocalTime.of(10, 0), LocalTime.of(11, 0), false, false,
                2, List.of(
                        new ScheduleDetailResponse.ParticipantResponse(1L, "개발팀", "홍길동"),
                        new ScheduleDetailResponse.ParticipantResponse(2L, "기획팀", "김기획")
                )
        );
    }

    private FieldDescriptor[] scheduleListFields() {
        return new FieldDescriptor[]{
                fieldWithPath("[]").type(JsonFieldType.ARRAY).description("일정 목록"),
                fieldWithPath("[].scheduleId").type(JsonFieldType.NUMBER).description("일정 식별 번호"),
                fieldWithPath("[].scheduleType").type(JsonFieldType.STRING).description("일정 유형"),
                fieldWithPath("[].title").type(JsonFieldType.STRING).description("일정 제목"),
                fieldWithPath("[].scheduleDate").type(JsonFieldType.STRING).description("일정 날짜, yyyy-MM-dd"),
                fieldWithPath("[].startAt").type(JsonFieldType.STRING).description("시작 시각, HH:mm:ss"),
                fieldWithPath("[].endAt").type(JsonFieldType.STRING).description("종료 시각, HH:mm:ss"),
                fieldWithPath("[].isAllDay").type(JsonFieldType.BOOLEAN).description("종일 일정 여부"),
                fieldWithPath("[].isCanceled").type(JsonFieldType.BOOLEAN).description("취소 여부")
        };
    }

    private FieldDescriptor[] scheduleDetailFields() {
        return new FieldDescriptor[]{
                fieldWithPath("scheduleId").type(JsonFieldType.NUMBER).description("일정 식별 번호"),
                fieldWithPath("scheduleType").type(JsonFieldType.STRING).description("일정 유형"),
                fieldWithPath("ownerId").type(JsonFieldType.NUMBER).description("일정 소유자 식별 번호"),
                fieldWithPath("ownerDeptName").type(JsonFieldType.STRING).description("일정 소유자 부서명"),
                fieldWithPath("ownerEmpName").type(JsonFieldType.STRING).description("일정 소유자 이름"),
                fieldWithPath("isEditable").type(JsonFieldType.BOOLEAN).description("현재 로그인 사원의 수정 가능 여부"),
                fieldWithPath("title").type(JsonFieldType.STRING).description("일정 제목"),
                fieldWithPath("content").type(JsonFieldType.STRING).description("일정 내용"),
                fieldWithPath("scheduleDate").type(JsonFieldType.STRING).description("일정 날짜, yyyy-MM-dd"),
                fieldWithPath("startAt").type(JsonFieldType.STRING).description("시작 시각, HH:mm:ss"),
                fieldWithPath("endAt").type(JsonFieldType.STRING).description("종료 시각, HH:mm:ss"),
                fieldWithPath("isAllDay").type(JsonFieldType.BOOLEAN).description("종일 일정 여부"),
                fieldWithPath("isCanceled").type(JsonFieldType.BOOLEAN).description("취소 여부"),
                fieldWithPath("participantCount").type(JsonFieldType.NUMBER).description("참여자 수"),
                fieldWithPath("participants").type(JsonFieldType.ARRAY).description("참여자 목록"),
                fieldWithPath("participants[].empId").type(JsonFieldType.NUMBER).description("참여자 식별 번호"),
                fieldWithPath("participants[].deptName").type(JsonFieldType.STRING).description("참여자 부서명"),
                fieldWithPath("participants[].empName").type(JsonFieldType.STRING).description("참여자 이름")
        };
    }
}
