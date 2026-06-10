package com.haruon.groupware.adapter.docs.webAPI.emp.attendance;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.emp.attendacne.AttendanceManagementApi;
import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceEditing;
import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceRetriever;
import com.haruon.groupware.application.empInfo.attendance.service.dto.request.ApproveAttendanceByDeptManagerRequest;
import com.haruon.groupware.application.empInfo.attendance.service.dto.request.EditAttendanceByDeptManagerRequest;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.AttendanceInfoResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.AttendanceInfoSummaryResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.DeptAttendanceEmpInfo;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.result.DeptAttendanceResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.result.DeptPendingAttendanceResponse;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class AttendanceManagementDocsTest extends RestDocsSupport {

    private final AttendanceRetriever attendanceRetriever = mock(AttendanceRetriever.class);
    private final AttendanceEditing attendanceEditing = mock(AttendanceEditing.class);
    private final String REQUEST_MAPPING_URL = "/api/employees/attendances";

    @Override
    protected Object initController() {
        return new AttendanceManagementApi(attendanceRetriever, attendanceEditing);
    }

    @Test
    @DisplayName("부서 월별 근태 조회 문서")
    void retrieve_dept_monthly_attendance() throws Exception {
        List<AttendanceInfoResponse> attendanceInfos = List.of(
                new AttendanceInfoResponse(
                        AttendanceStatus.NORMAL,
                        LocalDate.of(2026, 4, 1),
                        LocalTime.of(9, 0),
                        LocalTime.of(18, 0),
                        true,
                        null
                ),
                new AttendanceInfoResponse(
                        AttendanceStatus.LATE_EARLY,
                        LocalDate.of(2026, 4, 2),
                        LocalTime.of(10, 0),
                        LocalTime.of(15, 0),
                        false,
                        null
                )
        );
        DeptAttendanceResponse deptAttendance = new DeptAttendanceResponse(
                deptAttendanceEmpInfo(),
                new AttendanceInfoSummaryResponse(1, 1, 2, 0),
                attendanceInfos
        );
        Page<DeptAttendanceResponse> response = new PageImpl<>(
                List.of(deptAttendance),
                PageRequest.of(0, 10),
                1
        );

        Mockito.when(attendanceRetriever.retrieverDeptAttendanceMonthly(
                eq(1L),
                eq(2L),
                eq(YearMonth.of(2026, 4)),
                eq("홍"),
                eq(AttendanceStatus.NORMAL),
                any(Pageable.class)
        )).thenReturn(response);

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/{deptId}/monthly", 2L)
                                .with(deptManagerAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("yearMonth", "2026-04")
                                .queryParam("keyword", "홍")
                                .queryParam("status", "NORMAL")
                                .queryParam("page", "0")
                                .queryParam("size", "10")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("DEPT_ATTENDANCE_MONTHLY",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("deptId").description("부서 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("yearMonth").optional().description("조회 대상 월, yyyy-MM. 미입력 시 현재 월"),
                                parameterWithName("keyword").optional().description("사원 이름 검색어"),
                                parameterWithName("status").optional().description("근태 상태 필터. NORMAL, ABSENT, LATE_EARLY, HALF_DAY_LEAVE, ALL_DAY_LEAVE, SICK_LEAVE"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),

                        responseFields(deptAttendancePageFields())
                ));
    }

    @Test
    @DisplayName("부서 승인 대기 근태 조회 문서")
    void retrieve_dept_pending_attendance() throws Exception {
        DeptPendingAttendanceResponse pendingAttendance = new DeptPendingAttendanceResponse(
                deptAttendanceEmpInfo(),
                new AttendanceInfoResponse(
                        AttendanceStatus.LATE_EARLY,
                        LocalDate.of(2026, 4, 2),
                        LocalTime.of(10, 0),
                        LocalTime.of(15, 0),
                        false,
                        null
                )
        );
        Page<DeptPendingAttendanceResponse> response = new PageImpl<>(
                List.of(pendingAttendance),
                PageRequest.of(0, 10),
                1
        );

        Mockito.when(attendanceRetriever.retrieverDeptPendingAttendanceMonthly(
                eq(1L),
                eq(2L),
                any(Pageable.class)
        )).thenReturn(response);

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/{deptId}/monthly/pending", 2L)
                                .with(deptManagerAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("page", "0")
                                .queryParam("size", "10")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("DEPT_ATTENDANCE_PENDING",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("deptId").description("부서 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),

                        responseFields(deptPendingAttendancePageFields())
                ));
    }

    @Test
    @DisplayName("부서 매니저 근태 수정 문서")
    void update_attendance() throws Exception {
        EditAttendanceByDeptManagerRequest request = EditAttendanceByDeptManagerRequest.builder()
                .targetEmpId(2L)
                .startAt(LocalTime.of(12, 0))
                .endAt(LocalTime.of(17, 0))
                .editedAt(LocalDateTime.of(2026, 4, 30, 9, 0))
                .editReason("출퇴근 기록 보정")
                .build();

        Mockito.doNothing()
                .when(attendanceEditing).updateAttendanceByDeptManager(
                        eq(1L),
                        eq(10L),
                        any(EditAttendanceByDeptManagerRequest.class)
                );

        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/{attendanceId}", 10L)
                                .with(deptManagerAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsBytes(request))
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("DEPT_ATTENDANCE_UPDATE",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("attendanceId").description("근태 식별 번호")
                        ),

                        requestFields(
                                fieldWithPath("targetEmpId").type(JsonFieldType.NUMBER)
                                        .attributes(key("constraints").value("필수"))
                                        .description("근태 대상 사원 식별 번호"),
                                fieldWithPath("startAt").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("HH:mm:ss. startAt 또는 endAt 중 하나 이상 필수"))
                                        .description("수정할 근무 시작 시각").optional(),
                                fieldWithPath("endAt").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("HH:mm:ss. startAt 또는 endAt 중 하나 이상 필수"))
                                        .description("수정할 근무 종료 시각").optional(),
                                fieldWithPath("editedAt").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("ISO DATE_TIME"))
                                        .description("수정 일시"),
                                fieldWithPath("editReason").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("필수, 100자 이하"))
                                        .description("수정 사유")
                        )
                ));
    }

    @Test
    @DisplayName("부서 매니저 근태 승인 문서")
    void approve_attendance() throws Exception {
        LocalDateTime approvedAt = LocalDateTime.of(2026, 4, 30, 9, 0);

        Mockito.doNothing()
                .when(attendanceEditing).updateApproveAttendance(
                        eq(1L),
                        eq(10L),
                        any(ApproveAttendanceByDeptManagerRequest.class)
                );

        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/{attendanceId}/approval", 10L)
                                .with(deptManagerAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("targetEmpId", "2")
                                .queryParam("approvedAt", "2026-04-30T09:00:00")
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("DEPT_ATTENDANCE_APPROVE",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("attendanceId").description("근태 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("targetEmpId").description("근태 대상 사원 식별 번호"),
                                parameterWithName("approvedAt").description("승인 일시, ISO DATE_TIME 형식. 예: 2026-04-30T09:00:00")
                        )
                ));

        Mockito.verify(attendanceEditing).updateApproveAttendance(
                eq(1L),
                eq(10L),
                argThat(request -> request.targetEmpId().equals(2L) && request.approvedAt().equals(approvedAt))
        );
    }

    private DeptAttendanceEmpInfo deptAttendanceEmpInfo() {
        return new DeptAttendanceEmpInfo(
                2L,
                "202604001",
                "홍길동",
                "IT",
                "STAFF"
        );
    }

    private FieldDescriptor[] deptAttendancePageFields() {
        return concat(new FieldDescriptor[] {
                fieldWithPath("content").type(JsonFieldType.ARRAY).description("부서 사원별 월별 근태 목록"),
                fieldWithPath("content[].empInfo").type(JsonFieldType.OBJECT).description("사원 기본 정보"),
                fieldWithPath("content[].empInfo.empId").type(JsonFieldType.NUMBER).description("사원 식별 번호"),
                fieldWithPath("content[].empInfo.empNo").type(JsonFieldType.STRING).description("사원 번호"),
                fieldWithPath("content[].empInfo.empName").type(JsonFieldType.STRING).description("사원 이름"),
                fieldWithPath("content[].empInfo.deptName").type(JsonFieldType.STRING).description("부서명"),
                fieldWithPath("content[].empInfo.positionName").type(JsonFieldType.STRING).description("직급"),

                fieldWithPath("content[].summary").type(JsonFieldType.OBJECT).description("사원별 월별 근태 요약"),
                fieldWithPath("content[].summary.approvedAttendanceCount").type(JsonFieldType.NUMBER).description("승인 완료 근태 수"),
                fieldWithPath("content[].summary.pendingAttendanceCount").type(JsonFieldType.NUMBER).description("승인 대기 근태 수"),
                fieldWithPath("content[].summary.totalAttendanceCount").type(JsonFieldType.NUMBER).description("전체 근태 수"),
                fieldWithPath("content[].summary.overtimeMinutes").type(JsonFieldType.NUMBER).description("초과 근무 시간 합계, 분 단위"),

                fieldWithPath("content[].attendanceInfo").type(JsonFieldType.ARRAY).description("근태 상세 목록"),
                fieldWithPath("content[].attendanceInfo[].attendanceStatus").type(JsonFieldType.STRING).description("근태 상태"),
                fieldWithPath("content[].attendanceInfo[].attendanceDate").type(JsonFieldType.STRING).description("근태 일자, yyyy-MM-dd"),
                fieldWithPath("content[].attendanceInfo[].startAt").type(JsonFieldType.STRING).description("출근/근무 시작 시각, HH:mm:ss").optional(),
                fieldWithPath("content[].attendanceInfo[].endAt").type(JsonFieldType.STRING).description("퇴근/근무 종료 시각, HH:mm:ss").optional(),
                fieldWithPath("content[].attendanceInfo[].isApproved").type(JsonFieldType.BOOLEAN).description("승인 여부"),
                fieldWithPath("content[].attendanceInfo[].draftId").type(JsonFieldType.NULL).description("연동 기안서 식별 번호. 없으면 null").optional()
        }, pageMetadataFields());
    }

    private FieldDescriptor[] deptPendingAttendancePageFields() {
        return concat(new FieldDescriptor[] {
                fieldWithPath("content").type(JsonFieldType.ARRAY).description("승인 대기 근태 목록"),
                fieldWithPath("content[].empInfo").type(JsonFieldType.OBJECT).description("사원 기본 정보"),
                fieldWithPath("content[].empInfo.empId").type(JsonFieldType.NUMBER).description("사원 식별 번호"),
                fieldWithPath("content[].empInfo.empNo").type(JsonFieldType.STRING).description("사원 번호"),
                fieldWithPath("content[].empInfo.empName").type(JsonFieldType.STRING).description("사원 이름"),
                fieldWithPath("content[].empInfo.deptName").type(JsonFieldType.STRING).description("부서명"),
                fieldWithPath("content[].empInfo.positionName").type(JsonFieldType.STRING).description("직급"),

                fieldWithPath("content[].attendanceInfo").type(JsonFieldType.OBJECT).description("승인 대기 근태 상세"),
                fieldWithPath("content[].attendanceInfo.attendanceStatus").type(JsonFieldType.STRING).description("근태 상태"),
                fieldWithPath("content[].attendanceInfo.attendanceDate").type(JsonFieldType.STRING).description("근태 일자, yyyy-MM-dd"),
                fieldWithPath("content[].attendanceInfo.startAt").type(JsonFieldType.STRING).description("출근/근무 시작 시각, HH:mm:ss").optional(),
                fieldWithPath("content[].attendanceInfo.endAt").type(JsonFieldType.STRING).description("퇴근/근무 종료 시각, HH:mm:ss").optional(),
                fieldWithPath("content[].attendanceInfo.isApproved").type(JsonFieldType.BOOLEAN).description("승인 여부"),
                fieldWithPath("content[].attendanceInfo.draftId").type(JsonFieldType.NULL).description("연동 기안서 식별 번호. 없으면 null").optional()
        }, pageMetadataFields());
    }

    private FieldDescriptor[] pageMetadataFields() {
        return new FieldDescriptor[] {
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

    private FieldDescriptor[] concat(FieldDescriptor[] first, FieldDescriptor[] second) {
        FieldDescriptor[] result = new FieldDescriptor[first.length + second.length];
        System.arraycopy(first, 0, result, 0, first.length);
        System.arraycopy(second, 0, result, first.length, second.length);
        return result;
    }
}
