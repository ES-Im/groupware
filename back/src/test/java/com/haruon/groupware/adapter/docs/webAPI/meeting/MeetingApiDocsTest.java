package com.haruon.groupware.adapter.docs.webAPI.meeting;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.meeting.MeetingApi;
import com.haruon.groupware.application.meeting.provided.forCommand.MeetingManagement;
import com.haruon.groupware.application.meeting.provided.forRetreiever.MeetingRetriever;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingReserveRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingUpdateRequest;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
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

class MeetingApiDocsTest extends RestDocsSupport {

    private static final String REQUEST_MAPPING_URL = "/api/meetings";
    private final MeetingRetriever meetingRetriever = mock(MeetingRetriever.class);
    private final MeetingManagement meetingManagement = mock(MeetingManagement.class);

    @Override
    protected Object initController() {
        return new MeetingApi(meetingRetriever, meetingManagement);
    }

    @Test
    @DisplayName("내 월별 회의 예약 조회 문서")
    void getMyReservations() throws Exception {
        when(meetingRetriever.retrieveMyReservations(1L, YearMonth.of(2026, 6)))
                .thenReturn(List.of(reservationResponse()));

        mockMvc.perform(get(REQUEST_MAPPING_URL + "/my/reservations/calendar")
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("yearMonth", "2026-06"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("MY_MEETING_RESERVATIONS_CALENDAR",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        queryParameters(parameterWithName("yearMonth").optional().description("조회 대상 월, yyyy-MM. 미입력 시 현재 월")),
                        responseFields(reservationListFields())
                ));
    }

    @Test
    @DisplayName("회의 예약 상세 조회 문서")
    void getReservationDetail() throws Exception {
        when(meetingRetriever.retrieveReservationByMeetingId(10L)).thenReturn(reservationDetailResponse());

        mockMvc.perform(get(REQUEST_MAPPING_URL + "/{meetingId}", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("MEETING_RESERVATION_DETAIL",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("meetingId").description("회의 예약 식별 번호")),
                        responseFields(reservationDetailFields())
                ));
    }

    @Test
    @DisplayName("시설 담당자 회의 예약 목록 조회 문서")
    void getAllReservations() throws Exception {
        when(meetingRetriever.retrieveAllReservations(
                eq(1L), eq(YearMonth.of(2026, 6)), eq("회의"), eq(3L), any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(reservationResponse()), PageRequest.of(0, 10), 1));

        mockMvc.perform(get(REQUEST_MAPPING_URL)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("yearMonth", "2026-06")
                        .queryParam("keyword", "회의")
                        .queryParam("meetingRoomId", "3")
                        .queryParam("page", "0")
                        .queryParam("size", "10"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("MEETING_RESERVATION_MANAGEMENT",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("시설 담당자 Bearer Access Token")),
                        queryParameters(
                                parameterWithName("yearMonth").optional().description("조회 대상 월, yyyy-MM. 미입력 시 현재 월"),
                                parameterWithName("keyword").optional().description("회의 제목, 예약자 이름, 회의실 이름 검색어"),
                                parameterWithName("meetingRoomId").optional().description("회의실 식별 번호"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),
                        responseFields(reservationPageFields())
                ));
    }

    @Test
    @DisplayName("회의 예약 생성 문서")
    void reserveMeeting() throws Exception {
        MeetingReserveRequest request = MeetingReserveRequest.builder()
                .meetingRoomId(3L)
                .reserverId(1L)
                .title("주간 회의")
                .meetingDate(LocalDate.of(2099, 6, 19))
                .startAt(LocalTime.of(10, 0))
                .endAt(LocalTime.of(11, 0))
                .participantIds(Set.of(1L, 2L))
                .build();

        mockMvc.perform(post(REQUEST_MAPPING_URL)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andDo(document("MEETING_RESERVATION_CREATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        requestFields(
                                fieldWithPath("meetingRoomId").type(JsonFieldType.NUMBER).attributes(key("constraints").value("필수")).description("회의실 식별 번호"),
                                fieldWithPath("reserverId").type(JsonFieldType.NUMBER).attributes(key("constraints").value("필수")).description("예약자 식별 번호"),
                                fieldWithPath("title").type(JsonFieldType.STRING).attributes(key("constraints").value("필수, 공백 불가, 100자 이하")).description("회의 제목"),
                                fieldWithPath("meetingDate").type(JsonFieldType.STRING).attributes(key("constraints").value("필수, 현재 이후 날짜")).description("회의 날짜, yyyy-MM-dd"),
                                fieldWithPath("startAt").type(JsonFieldType.STRING).attributes(key("constraints").value("필수, 현재 이후 시각")).description("시작 시각, HH:mm"),
                                fieldWithPath("endAt").type(JsonFieldType.STRING).attributes(key("constraints").value("필수, 시작 시각 이후")).description("종료 시각, HH:mm"),
                                fieldWithPath("participantIds").type(JsonFieldType.ARRAY).attributes(key("constraints").value("필수, 빈 배열 불가")).description("참여자 식별 번호 목록")
                        )
                ));
    }

    @Test
    @DisplayName("회의 참여자 교체 문서")
    void replaceParticipants() throws Exception {
        MeetingApi.ParticipantReplaceRequest request = new MeetingApi.ParticipantReplaceRequest(Set.of(1L, 2L));

        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{meetingId}/participants", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNoContent())
                .andDo(document("MEETING_PARTICIPANTS_REPLACE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("meetingId").description("회의 예약 식별 번호")),
                        requestFields(fieldWithPath("participantIds").type(JsonFieldType.ARRAY)
                                .attributes(key("constraints").value("필수, 빈 배열 불가"))
                                .description("교체할 참여자 식별 번호 목록"))
                ));
    }

    @Test
    @DisplayName("회의 예약 취소 문서")
    void cancelMeeting() throws Exception {
        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{meetingId}/cancel", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isNoContent())
                .andDo(document("MEETING_RESERVATION_CANCEL",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("meetingId").description("회의 예약 식별 번호"))
                ));
    }

    @Test
    @DisplayName("회의 예약 정보 수정 문서")
    void changeReservationInfo() throws Exception {
        MeetingUpdateRequest request = MeetingUpdateRequest.builder()
                .meetingDate(LocalDate.of(2099, 6, 20))
                .startAt(LocalTime.of(13, 0))
                .endAt(LocalTime.of(14, 0))
                .meetingRoomId(4L)
                .title("수정된 회의")
                .build();

        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{meetingId}/reservation-info", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNoContent())
                .andDo(document("MEETING_RESERVATION_UPDATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("meetingId").description("회의 예약 식별 번호")),
                        requestFields(
                                fieldWithPath("meetingDate").optional().type(JsonFieldType.STRING).attributes(key("constraints").value("선택")).description("변경할 회의 날짜, yyyy-MM-dd"),
                                fieldWithPath("startAt").optional().type(JsonFieldType.STRING).attributes(key("constraints").value("선택")).description("변경할 시작 시각, HH:mm"),
                                fieldWithPath("endAt").optional().type(JsonFieldType.STRING).attributes(key("constraints").value("선택, 시작 시각 이후")).description("변경할 종료 시각, HH:mm"),
                                fieldWithPath("meetingRoomId").optional().type(JsonFieldType.NUMBER).attributes(key("constraints").value("선택")).description("변경할 회의실 식별 번호"),
                                fieldWithPath("title").optional().type(JsonFieldType.STRING).attributes(key("constraints").value("선택, 공백 불가, 100자 이하")).description("변경할 회의 제목")
                        )
                ));
    }

    private ReservationResponse reservationResponse() {
        return new ReservationResponse(
                10L, 3L, "대회의실", 1L, "개발팀", "홍길동", "주간 회의",
                LocalDate.of(2026, 6, 19), LocalTime.of(10, 0), LocalTime.of(11, 0), false, 2
        );
    }

    private ReservationDetailResponse reservationDetailResponse() {
        return new ReservationDetailResponse(
                10L, 3L, "대회의실", 1L, "개발팀", "홍길동", "주간 회의", 2,
                LocalDate.of(2026, 6, 19), LocalTime.of(10, 0), LocalTime.of(11, 0), false,
                List.of(new ReservationDetailResponse.ParticipantResponse(2L, "개발팀", "김사원"))
        );
    }

    private FieldDescriptor[] reservationListFields() {
        FieldDescriptor[] fields = reservationFields("[]");
        FieldDescriptor[] result = new FieldDescriptor[fields.length + 1];
        result[0] = fieldWithPath("[]").type(JsonFieldType.ARRAY).description("회의 예약 목록");
        System.arraycopy(fields, 0, result, 1, fields.length);
        return result;
    }

    private FieldDescriptor[] reservationPageFields() {
        return concat(
                concat(new FieldDescriptor[]{
                        fieldWithPath("content").type(JsonFieldType.ARRAY).description("회의 예약 목록")
                }, reservationFields("content[]")),
                pageFields()
        );
    }

    private FieldDescriptor[] reservationFields(String prefix) {
        return new FieldDescriptor[]{
                fieldWithPath(path(prefix, "meetingId")).type(JsonFieldType.NUMBER).description("회의 예약 식별 번호"),
                fieldWithPath(path(prefix, "meetingRoomId")).type(JsonFieldType.NUMBER).description("회의실 식별 번호"),
                fieldWithPath(path(prefix, "meetingRoomName")).type(JsonFieldType.STRING).description("회의실 이름"),
                fieldWithPath(path(prefix, "reserverId")).type(JsonFieldType.NUMBER).description("예약자 식별 번호"),
                fieldWithPath(path(prefix, "reserverDeptName")).type(JsonFieldType.STRING).description("예약자 부서명"),
                fieldWithPath(path(prefix, "reserverEmpName")).type(JsonFieldType.STRING).description("예약자 이름"),
                fieldWithPath(path(prefix, "title")).type(JsonFieldType.STRING).description("회의 제목"),
                fieldWithPath(path(prefix, "meetingDate")).type(JsonFieldType.STRING).description("회의 날짜"),
                fieldWithPath(path(prefix, "startAt")).type(JsonFieldType.STRING).description("시작 시각"),
                fieldWithPath(path(prefix, "endAt")).type(JsonFieldType.STRING).description("종료 시각"),
                fieldWithPath(path(prefix, "isCanceled")).type(JsonFieldType.BOOLEAN).description("취소 여부"),
                fieldWithPath(path(prefix, "participantCount")).type(JsonFieldType.NUMBER).description("참여자 수")
        };
    }

    private FieldDescriptor[] reservationDetailFields() {
        return concat(reservationFields(""), new FieldDescriptor[]{
                fieldWithPath("participants").type(JsonFieldType.ARRAY).description("참여자 목록"),
                fieldWithPath("participants[].empId").type(JsonFieldType.NUMBER).description("참여자 식별 번호"),
                fieldWithPath("participants[].deptName").type(JsonFieldType.STRING).description("참여자 부서명"),
                fieldWithPath("participants[].empName").type(JsonFieldType.STRING).description("참여자 이름")
        });
    }

    private FieldDescriptor[] pageFields() {
        return new FieldDescriptor[]{
                fieldWithPath("totalElements").type(JsonFieldType.NUMBER).description("전체 데이터 수"),
                fieldWithPath("totalPages").type(JsonFieldType.NUMBER).description("전체 페이지 수"),
                fieldWithPath("number").type(JsonFieldType.NUMBER).description("현재 페이지 번호"),
                fieldWithPath("size").type(JsonFieldType.NUMBER).description("페이지 크기"),
                fieldWithPath("numberOfElements").type(JsonFieldType.NUMBER).description("현재 페이지 데이터 수"),
                fieldWithPath("first").type(JsonFieldType.BOOLEAN).description("첫 페이지 여부"),
                fieldWithPath("last").type(JsonFieldType.BOOLEAN).description("마지막 페이지 여부"),
                fieldWithPath("empty").type(JsonFieldType.BOOLEAN).description("빈 페이지 여부"),
                subsectionWithPath("pageable").ignored(), subsectionWithPath("sort").ignored()
        };
    }

    private FieldDescriptor[] concat(FieldDescriptor[] first, FieldDescriptor[] second) {
        FieldDescriptor[] result = new FieldDescriptor[first.length + second.length];
        System.arraycopy(first, 0, result, 0, first.length);
        System.arraycopy(second, 0, result, first.length, second.length);
        return result;
    }

    private String path(String prefix, String name) {
        return prefix.isEmpty() ? name : prefix + "." + name;
    }
}
