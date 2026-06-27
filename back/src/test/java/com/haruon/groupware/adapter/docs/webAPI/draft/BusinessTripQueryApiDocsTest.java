package com.haruon.groupware.adapter.docs.webapi.draft;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.draft.BusinessTripQueryApi;
import com.haruon.groupware.application.draft.provided.forRetriever.BusinessTripDraftRetriever;
import com.haruon.groupware.application.draft.service.query.dto.response.BusinessTripRequestHistoryAndEmpInfoResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.BusinessTripRequestHistoryResponse;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
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
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class BusinessTripQueryApiDocsTest extends RestDocsSupport {

    private final BusinessTripDraftRetriever businessTripDraftRetriever = mock(BusinessTripDraftRetriever.class);
    private final String REQUEST_MAPPING_URL = "/api/business-trips";

    @Override
    protected Object initController() {
        return new BusinessTripQueryApi(businessTripDraftRetriever);
    }

    @Test
    @DisplayName("부서 출장 신청 이력 조회 문서")
    void retrieve_dept_business_trip_request_histories() throws Exception {
        BusinessTripRequestHistoryAndEmpInfoResponse content = new BusinessTripRequestHistoryAndEmpInfoResponse(
                2L,
                "202604001",
                "홍길동",
                new BusinessTripRequestHistoryResponse(
                        10L,
                        LocalDate.of(2026, 4, 10),
                        LocalDate.of(2026, 4, 12),
                        "서울",
                        "고객 미팅",
                        "결재대기"
                )
        );
        Page<BusinessTripRequestHistoryAndEmpInfoResponse> response = new PageImpl<>(
                List.of(content),
                PageRequest.of(0, 10),
                1
        );

        Mockito.when(businessTripDraftRetriever.retrieveDeptBusinessTripRequestHistories(
                eq(1L),
                eq(2L),
                eq("홍"),
                eq(ApprovalStatus.WAITING),
                eq(YearMonth.of(2026, 4)),
                any(Pageable.class)
        )).thenReturn(response);

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/departments/{deptId}/request-history", 2L)
                                .with(deptManagerAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("keyword", "홍")
                                .queryParam("approvalStatus", "WAITING")
                                .queryParam("yearMonth", "2026-04")
                                .queryParam("page", "0")
                                .queryParam("size", "10")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("DEPT_BUSINESS_TRIP_REQUEST_HISTORY",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("deptId").description("부서 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("keyword").optional().description("사원 이름 검색어"),
                                parameterWithName("approvalStatus").optional().description("결재 상태 필터. UNSUBMITTED, WAITING, IN_PROGRESS, APPROVED, REJECTED"),
                                parameterWithName("yearMonth").optional().description("조회 대상 월, yyyy-MM. 미입력 시 현재 월"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),

                        responseFields(deptBusinessTripRequestHistoryPageFields())
                ));
    }

    @Test
    @DisplayName("내 출장 신청 이력 조회 문서")
    void retrieve_my_business_trip_request_histories() throws Exception {
        List<BusinessTripRequestHistoryResponse> response = List.of(
                new BusinessTripRequestHistoryResponse(
                        10L,
                        LocalDate.of(2026, 4, 10),
                        LocalDate.of(2026, 4, 12),
                        "서울",
                        "고객 미팅",
                        "결재대기"
                )
        );

        Mockito.when(businessTripDraftRetriever.retrieveMyBusinessTripRequestHistories(
                eq(1L),
                eq(ApprovalStatus.WAITING),
                eq(YearMonth.of(2026, 4))
        )).thenReturn(response);

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/employees/me/request-history")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("approvalStatus", "WAITING")
                                .queryParam("yearMonth", "2026-04")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("MY_BUSINESS_TRIP_REQUEST_HISTORY",
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
                                fieldWithPath("[]").type(JsonFieldType.ARRAY).description("내 출장 신청 이력 목록"),
                                fieldWithPath("[].draftId").type(JsonFieldType.NUMBER).description("출장 신청 기안서 식별 번호"),
                                fieldWithPath("[].startAt").type(JsonFieldType.STRING).description("출장 시작일, yyyy-MM-dd"),
                                fieldWithPath("[].endAt").type(JsonFieldType.STRING).description("출장 종료일, yyyy-MM-dd"),
                                fieldWithPath("[].destination").type(JsonFieldType.STRING).description("출장지"),
                                fieldWithPath("[].purpose").type(JsonFieldType.STRING).description("출장 목적"),
                                fieldWithPath("[].approvalStatus").type(JsonFieldType.STRING).description("결재 상태 표시명")
                        )
                ));
    }

    private FieldDescriptor[] deptBusinessTripRequestHistoryPageFields() {
        return concat(new FieldDescriptor[] {
                fieldWithPath("content").type(JsonFieldType.ARRAY).description("부서 출장 신청 이력 목록"),
                fieldWithPath("content[].empId").type(JsonFieldType.NUMBER).description("사원 식별 번호"),
                fieldWithPath("content[].empNo").type(JsonFieldType.STRING).description("사원 번호"),
                fieldWithPath("content[].empName").type(JsonFieldType.STRING).description("사원 이름"),

                fieldWithPath("content[].historyResponse").type(JsonFieldType.OBJECT).description("출장 신청 이력"),
                fieldWithPath("content[].historyResponse.draftId").type(JsonFieldType.NUMBER).description("출장 신청 기안서 식별 번호"),
                fieldWithPath("content[].historyResponse.startAt").type(JsonFieldType.STRING).description("출장 시작일, yyyy-MM-dd"),
                fieldWithPath("content[].historyResponse.endAt").type(JsonFieldType.STRING).description("출장 종료일, yyyy-MM-dd"),
                fieldWithPath("content[].historyResponse.destination").type(JsonFieldType.STRING).description("출장지"),
                fieldWithPath("content[].historyResponse.purpose").type(JsonFieldType.STRING).description("출장 목적"),
                fieldWithPath("content[].historyResponse.approvalStatus").type(JsonFieldType.STRING).description("결재 상태 표시명")
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
