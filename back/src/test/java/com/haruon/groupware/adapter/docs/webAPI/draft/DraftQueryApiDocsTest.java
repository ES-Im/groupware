package com.haruon.groupware.adapter.docs.webapi.draft;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.draft.DraftQueryApi;
import com.haruon.groupware.application.draft.provided.forRetriever.DocumentBoxRetriever;
import com.haruon.groupware.application.draft.service.query.dto.response.DraftDetailResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class DraftQueryApiDocsTest extends RestDocsSupport {

    private final DocumentBoxRetriever documentBoxRetriever = mock(DocumentBoxRetriever.class);
    private final String REQUEST_MAPPING_URL = "/api/drafts";

    @Override
    protected Object initController() {
        return new DraftQueryApi(documentBoxRetriever);
    }

    @Test
    @DisplayName("기안서 상세조회 문서")
    void retrieve_draft_detail() throws Exception {
        Mockito.when(documentBoxRetriever.retrieveDraftDetail(eq(1L), anyList(), eq(10L)))
                .thenReturn(draftDetailResponse());

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/{draftId}", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("DRAFT_DETAIL",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        pathParameters(
                                parameterWithName("draftId").description("기안서 식별 번호")
                        ),
                        responseFields(
                                fieldWithPath("draftId").type(JsonFieldType.NUMBER).description("기안서 식별 번호"),
                                fieldWithPath("draftType").type(JsonFieldType.STRING).description("기안서 유형"),
                                fieldWithPath("drafter").type(JsonFieldType.OBJECT).description("기안자 정보"),
                                fieldWithPath("drafter.empId").type(JsonFieldType.NUMBER).description("기안자 사원 식별 번호"),
                                fieldWithPath("drafter.empName").type(JsonFieldType.STRING).description("기안자 이름"),
                                fieldWithPath("title").type(JsonFieldType.STRING).description("기안서 제목"),
                                fieldWithPath("content").type(JsonFieldType.STRING).description("기안서 본문"),
                                fieldWithPath("submittedAt").type(JsonFieldType.STRING).description("상신 일시, yyyy-MM-dd'T'HH:mm:ss"),
                                fieldWithPath("approvalStatus").type(JsonFieldType.STRING).description("결재 상태 표시명"),

                                fieldWithPath("files").type(JsonFieldType.ARRAY).description("첨부파일 목록"),
                                fieldWithPath("files[].fileId").type(JsonFieldType.NUMBER).description("파일 식별 번호"),
                                fieldWithPath("files[].originalName").type(JsonFieldType.STRING).description("파일 원본명"),
                                fieldWithPath("files[].mimeType").type(JsonFieldType.STRING).description("MIME 타입"),
                                fieldWithPath("files[].extension").type(JsonFieldType.STRING).description("파일 확장자"),
                                fieldWithPath("files[].fileSize").type(JsonFieldType.NUMBER).description("파일 크기"),

                                fieldWithPath("approvers").type(JsonFieldType.ARRAY).description("결재선 목록"),
                                fieldWithPath("approvers[].empId").type(JsonFieldType.NUMBER).description("결재자 사원 식별 번호"),
                                fieldWithPath("approvers[].empName").type(JsonFieldType.STRING).description("결재자 이름"),
                                fieldWithPath("approvers[].role").type(JsonFieldType.STRING).description("결재 역할"),
                                fieldWithPath("approvers[].order").type(JsonFieldType.NUMBER).description("결재 순서"),
                                fieldWithPath("approvers[].approvedAt").type(JsonFieldType.VARIES).description("승인 일시. 미처리 시 null"),
                                fieldWithPath("approvers[].rejectedAt").type(JsonFieldType.VARIES).description("반려 일시. 미처리 시 null"),
                                fieldWithPath("approvers[].rejectReason").type(JsonFieldType.VARIES).description("반려 사유. 미반려 시 null"),

                                fieldWithPath("circulations").type(JsonFieldType.ARRAY).description("공람자 목록"),
                                fieldWithPath("circulations[].empId").type(JsonFieldType.NUMBER).description("공람자 사원 식별 번호"),
                                fieldWithPath("circulations[].empName").type(JsonFieldType.STRING).description("공람자 이름"),
                                fieldWithPath("circulations[].readAt").type(JsonFieldType.VARIES).description("공람 읽음 일시. 미열람 시 null"),

                                fieldWithPath("sourceDraftId").type(JsonFieldType.NULL).description("취소기안인 경우 원본 기안서 식별 번호"),
                                fieldWithPath("cancellationDraftId").type(JsonFieldType.NULL).description("원본 기안인 경우 취소기안 식별 번호"),
                                fieldWithPath("cancellationSubmittedAt").type(JsonFieldType.NULL).description("취소기안 상신 일시"),

                                fieldWithPath("leave").type(JsonFieldType.NULL).description("휴가기안 상세. 다른 기안 유형이면 null"),
                                fieldWithPath("businessTrip").type(JsonFieldType.OBJECT).description("출장기안 상세. 다른 기안 유형이면 null"),
                                fieldWithPath("businessTrip.startAt").type(JsonFieldType.STRING).description("출장 시작 일시"),
                                fieldWithPath("businessTrip.endAt").type(JsonFieldType.STRING).description("출장 종료 일시"),
                                fieldWithPath("businessTrip.destination").type(JsonFieldType.STRING).description("출장지"),
                                fieldWithPath("businessTrip.purpose").type(JsonFieldType.STRING).description("출장 목적"),
                                fieldWithPath("businessTrip.participants").type(JsonFieldType.ARRAY).description("출장 참여자 목록"),
                                fieldWithPath("businessTrip.participants[].empId").type(JsonFieldType.NUMBER).description("참여자 사원 식별 번호"),
                                fieldWithPath("businessTrip.participants[].empName").type(JsonFieldType.STRING).description("참여자 이름"),
                                fieldWithPath("sales").type(JsonFieldType.NULL).description("매출기안 상세. 다른 기안 유형이면 null")
                        )
                ));
    }

    private DraftDetailResponse draftDetailResponse() {
        return new DraftDetailResponse(
                10L,
                "BUSINESS_TRIP",
                new DraftDetailResponse.EmpSummary(1L, "홍길동"),
                "출장 신청",
                "출장 신청 내용",
                LocalDateTime.of(2026, 4, 1, 9, 0),
                "결재진행중",
                List.of(new DraftDetailResponse.DraftFileSummary(
                        100L,
                        "출장계획서.pdf",
                        "application/pdf",
                        "pdf",
                        2048L
                )),
                List.of(new DraftDetailResponse.ApproverSummary(
                        2L,
                        "김결재",
                        "APPROVER",
                        1,
                        LocalDateTime.of(2026, 4, 1, 10, 0),
                        null,
                        null
                )),
                List.of(new DraftDetailResponse.CirculationSummary(
                        3L,
                        "이공람",
                        null
                )),
                null,
                null,
                null,
                null,
                new DraftDetailResponse.BusinessTripDraftDetail(
                        LocalDateTime.of(2026, 4, 10, 9, 0),
                        LocalDateTime.of(2026, 4, 12, 18, 0),
                        "서울",
                        "고객 미팅",
                        List.of(new DraftDetailResponse.EmpSummary(1L, "홍길동"))
                ),
                null
        );
    }
}
