package com.haruon.groupware.adapter.docs.webAPI.emp.leave;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.emp.leave.MyLeaveInfoApi;
import com.haruon.groupware.application.draft.provided.forRetriever.LeaveDraftRetriever;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryResponse;
import com.haruon.groupware.application.empInfo.leave.provided.LeaveRetriever;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.queryParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class MyLeaveInfoApiDocsTest extends RestDocsSupport {

    private final LeaveRetriever leaveRetriever = mock(LeaveRetriever.class);
    private final LeaveDraftRetriever leaveDraftRetriever = mock(LeaveDraftRetriever.class);
    private final String REQUEST_MAPPING_URL = "/api/employees/me/leaves";

    @Override
    protected Object initController() {
        return new MyLeaveInfoApi(leaveRetriever, leaveDraftRetriever);
    }

    @Test
    @DisplayName("내 휴가 신청 이력 조회 문서")
    void retrieve_my_leave_request_histories() throws Exception {
        List<LeaveRequestHistoryResponse> response = List.of(
                new LeaveRequestHistoryResponse(
                        10L,
                        "연차",
                        LocalDate.of(2026, 4, 10),
                        LocalDate.of(2026, 4, 10),
                        1.0,
                        "결재대기"
                ),
                new LeaveRequestHistoryResponse(
                        11L,
                        "반차",
                        LocalDate.of(2026, 4, 14),
                        LocalDate.of(2026, 4, 14),
                        0.5,
                        "결재대기"
                )
        );

        Mockito.when(leaveDraftRetriever.retrieveMyLeaveRequestHistories(
                eq(1L),
                eq(ApprovalStatus.WAITING),
                eq(YearMonth.of(2026, 4))
        )).thenReturn(response);

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/request-history")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("approvalStatus", "WAITING")
                                .queryParam("yearMonth", "2026-04")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("MY_LEAVE_REQUEST_HISTORY",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(
                                parameterWithName("approvalStatus").optional().description("결재 상태 필터. UNSUBMITTED, WAITING, IN_PROGRESS, APPROVED, REJECTED"),
                                parameterWithName("yearMonth").optional().description("조회 대상 월, yyyy-MM. 미입력 시 현재 월")
                        ),

                        responseFields(
                                fieldWithPath("[]").type(JsonFieldType.ARRAY).description("내 휴가 신청 이력 목록"),
                                fieldWithPath("[].draftId").type(JsonFieldType.NUMBER).description("휴가 신청 기안서 식별 번호"),
                                fieldWithPath("[].leaveType").type(JsonFieldType.STRING).description("휴가 유형 표시명"),
                                fieldWithPath("[].startAt").type(JsonFieldType.STRING).description("휴가 시작일, yyyy-MM-dd"),
                                fieldWithPath("[].endAt").type(JsonFieldType.STRING).description("휴가 종료일, yyyy-MM-dd"),
                                fieldWithPath("[].requestedLeaveDays").type(JsonFieldType.NUMBER).description("신청 휴가 일수"),
                                fieldWithPath("[].approvalStatus").type(JsonFieldType.STRING).description("결재 상태 표시명")
                        )
                ));
    }
}
