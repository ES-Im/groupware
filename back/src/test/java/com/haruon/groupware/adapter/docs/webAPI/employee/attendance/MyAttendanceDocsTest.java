package com.haruon.groupware.adapter.docs.webapi.employee.attendance;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.employee.attendance.MyAttendanceApi;
import com.haruon.groupware.application.employee.attendance.provided.forCommand.AttendanceRecord;
import com.haruon.groupware.application.employee.attendance.provided.forRetriever.AttendanceRetriever;
import com.haruon.groupware.application.employee.attendance.service.query.dto.AttendanceInfoResponse;
import com.haruon.groupware.application.employee.attendance.service.query.dto.AttendanceInfoSummaryResponse;
import com.haruon.groupware.domain.employee.enums.AttendanceStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.queryParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class MyAttendanceDocsTest extends RestDocsSupport {

    private final AttendanceRetriever attendanceRetriever = mock(AttendanceRetriever.class);
    private final AttendanceRecord attendanceRecord = mock(AttendanceRecord.class);
    private final String REQUEST_MAPPING_URL = "/api/employees/attendances/me";


    @Override
    protected Object initController() {
        return new MyAttendanceApi(attendanceRetriever, attendanceRecord);
    }

    @Test
    @DisplayName("내 월별 근태 조회 문서")
    void retrieve_my_monthly_attendance() throws Exception {
        List<AttendanceInfoResponse> content = List.of(
                new AttendanceInfoResponse(
                        100L,
                        AttendanceStatus.NORMAL,
                        LocalDate.of(2026, 4, 1),
                        LocalTime.of(9, 0),
                        LocalTime.of(18, 0),
                        true,
                        null
                ),
                new AttendanceInfoResponse(
                        101L,
                        AttendanceStatus.NORMAL,
                        LocalDate.of(2026, 4, 2),
                        LocalTime.of(9, 0),
                        LocalTime.of(19, 0),
                        false,
                        null
                )
        );
        Page<AttendanceInfoResponse> response = new PageImpl<>(content, PageRequest.of(0, 10), content.size());

        Mockito.when(attendanceRetriever.retrieverMyAttendanceMonthly(
                eq(1L),
                eq(YearMonth.of(2026, 4)),
                eq(AttendanceStatus.NORMAL),
                any(Pageable.class)
        )).thenReturn(response);

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/monthly")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("yearMonth", "2026-04")
                                .queryParam("status", "NORMAL")
                                .queryParam("page", "0")
                                .queryParam("size", "10")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("MY_ATTENDANCE_MONTHLY",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(
                                parameterWithName("yearMonth").optional().description("조회 대상 월, yyyy-MM. 미입력 시 현재 월"),
                                parameterWithName("status").optional().description("근태 상태 필터. NORMAL, ABSENT, LATE_EARLY, HALF_DAY_LEAVE, ALL_DAY_LEAVE, SICK_LEAVE"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),

                        responseFields(pageFieldsWithAttendanceContent("내 월별 근태 목록"))
                ));
    }

    @Test
    @DisplayName("내 월별 근태 요약 조회 문서")
    void retrieve_my_monthly_attendance_summary() throws Exception {
        AttendanceInfoSummaryResponse response = new AttendanceInfoSummaryResponse(
                1,
                1,
                2,
                60
        );

        Mockito.when(attendanceRetriever.retrieverMyAttendanceSummaryMonthly(
                eq(1L),
                eq(YearMonth.of(2026, 4))
        )).thenReturn(response);

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/monthly/summary")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("yearMonth", "2026-04")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("MY_ATTENDANCE_MONTHLY_SUMMARY",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(
                                parameterWithName("yearMonth").optional().description("조회 대상 월, yyyy-MM. 미입력 시 현재 월")
                        ),

                        responseFields(
                                fieldWithPath("approvedAttendanceCount").type(JsonFieldType.NUMBER).description("승인 완료 근태 수"),
                                fieldWithPath("pendingAttendanceCount").type(JsonFieldType.NUMBER).description("승인 대기 근태 수"),
                                fieldWithPath("totalAttendanceCount").type(JsonFieldType.NUMBER).description("전체 근태 수"),
                                fieldWithPath("overtimeMinutes").type(JsonFieldType.NUMBER).description("초과 근무 시간 합계, 분 단위")
                        )
                ));
    }

    @Test
    @DisplayName("출근 기록 문서")
    void check_in() throws Exception {
        Mockito.doNothing()
                .when(attendanceRecord).recordCheckIn(eq(1L), any(LocalDateTime.class));

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/check-in")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("MY_ATTENDANCE_CHECK_IN",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        )
                ));
    }

    @Test
    @DisplayName("퇴근 기록 문서")
    void check_out() throws Exception {
        Mockito.doNothing()
                .when(attendanceRecord).recordCheckOut(eq(1L), any(LocalDateTime.class));

        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/check-out")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("MY_ATTENDANCE_CHECK_OUT",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        )
                ));
    }

    private org.springframework.restdocs.payload.FieldDescriptor[] pageFieldsWithAttendanceContent(String contentDescription) {
        return new org.springframework.restdocs.payload.FieldDescriptor[] {
                fieldWithPath("content").type(JsonFieldType.ARRAY).description(contentDescription),
                fieldWithPath("content[].attendanceId").type(JsonFieldType.NUMBER).description("근태 식별 번호"),
                fieldWithPath("content[].attendanceStatus").type(JsonFieldType.STRING).description("근태 상태"),
                fieldWithPath("content[].attendanceDate").type(JsonFieldType.STRING).description("근태 일자, yyyy-MM-dd"),
                fieldWithPath("content[].startAt").type(JsonFieldType.STRING).description("출근/근무 시작 시각, HH:mm:ss").optional(),
                fieldWithPath("content[].endAt").type(JsonFieldType.STRING).description("퇴근/근무 종료 시각, HH:mm:ss").optional(),
                fieldWithPath("content[].isApproved").type(JsonFieldType.BOOLEAN).description("승인 여부"),
                fieldWithPath("content[].draftId").type(JsonFieldType.NULL).description("연동 기안서 식별 번호. 없으면 null").optional(),

                fieldWithPath("totalElements").type(JsonFieldType.NUMBER).description("전체 데이터 수"),
                fieldWithPath("totalPages").type(JsonFieldType.NUMBER).description("전체 페이지 수"),
                fieldWithPath("number").type(JsonFieldType.NUMBER).description("현재 페이지 번호"),
                fieldWithPath("size").type(JsonFieldType.NUMBER).description("페이지 크기"),
                fieldWithPath("numberOfElements").type(JsonFieldType.NUMBER).description("현재 페이지의 데이터 수"),
                fieldWithPath("first").type(JsonFieldType.BOOLEAN).description("첫 페이지 여부"),
                fieldWithPath("last").type(JsonFieldType.BOOLEAN).description("마지막 페이지 여부"),
                fieldWithPath("empty").type(JsonFieldType.BOOLEAN).description("현재 페이지가 비어있는지 여부"),

                subsectionWithPath("pageable").ignored(),
                subsectionWithPath("sort").ignored()
        };
    }
}
