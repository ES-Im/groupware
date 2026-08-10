package com.haruon.groupware.adapter.docs.webapi.meeting;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.meeting.MeetingRoomApi;
import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import com.haruon.groupware.application.meeting.provided.forCommand.MeetingRoomManagement;
import com.haruon.groupware.application.meeting.provided.forRetriever.MeetingRoomRetriever;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomUpdateRequest;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationsByRoomResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

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

class MeetingRoomApiDocsTest extends RestDocsSupport {

    private static final String REQUEST_MAPPING_URL = "/api/meeting-rooms";
    private final MeetingRoomRetriever meetingRoomRetriever = mock(MeetingRoomRetriever.class);
    private final MeetingRoomManagement meetingRoomManagement = mock(MeetingRoomManagement.class);

    @Override
    protected Object initController() {
        return new MeetingRoomApi(meetingRoomRetriever, meetingRoomManagement);
    }

    @Test
    @DisplayName("예약 가능 회의실 조회 문서")
    void getAvailableMeetingRooms() throws Exception {
        when(meetingRoomRetriever.retrieveAvailableMeetingRooms(
                eq(LocalDate.of(2026, 6, 19)), eq(LocalTime.of(10, 0)),
                eq(LocalTime.of(11, 0)), eq(5), any(Pageable.class)
        )).thenReturn(roomPage());

        mockMvc.perform(get(REQUEST_MAPPING_URL + "/available")
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("date", "2026-06-19")
                        .queryParam("startAt", "10:00")
                        .queryParam("endAt", "11:00")
                        .queryParam("capacity", "5")
                        .queryParam("page", "0")
                        .queryParam("size", "10"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("AVAILABLE_MEETING_ROOMS",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        queryParameters(
                                parameterWithName("date").description("예약 날짜, yyyy-MM-dd"),
                                parameterWithName("startAt").description("예약 시작 시각, HH:mm"),
                                parameterWithName("endAt").description("예약 종료 시각, HH:mm"),
                                parameterWithName("capacity").description("최소 수용 인원"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),
                        responseFields(roomPageFields())
                ));
    }

    @Test
    @DisplayName("관리용 회의실 조회 문서")
    void getMeetingRoomsForManagement() throws Exception {
        when(meetingRoomRetriever.retrieveMeetingRooms(eq(1L), eq(true), eq(true), any(Pageable.class)))
                .thenReturn(roomPage());

        mockMvc.perform(get(REQUEST_MAPPING_URL + "/management")
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("available", "true")
                        .queryParam("bookedInFuture", "true")
                        .queryParam("page", "0")
                        .queryParam("size", "10"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("MEETING_ROOM_MANAGEMENT",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("시설 담당자 Bearer Access Token")),
                        queryParameters(
                                parameterWithName("available").optional().description("회의실 활성화 여부"),
                                parameterWithName("bookedInFuture").optional().description("현재 이후 예약 존재 여부"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),
                        responseFields(roomPageFields())
                ));
    }

    @Test
    @DisplayName("회의실 기간별 예약 조회 문서")
    void getReservationsByRoom() throws Exception {
        LocalDateTime start = LocalDateTime.of(2026, 6, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 7, 1, 0, 0);
        when(meetingRoomRetriever.retrieveReservationsByRoomId(3L, start, end))
                .thenReturn(List.of(new ReservationsByRoomResponse(
                        "개발팀", "홍길동", 2, LocalDate.of(2026, 6, 19),
                        LocalTime.of(10, 0), LocalTime.of(11, 0)
                )));

        mockMvc.perform(get(REQUEST_MAPPING_URL + "/{meetingRoomId}/reservations/calendar", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("start", start.toString())
                        .queryParam("end", end.toString()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("MEETING_ROOM_RESERVATIONS_CALENDAR",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("meetingRoomId").description("회의실 식별 번호")),
                        queryParameters(
                                parameterWithName("start").optional().description("조회 시작 일시, yyyy-MM-dd'T'HH:mm:ss (포함), 미입력시 당월의 1일 0시 0분"),
                                parameterWithName("end").optional().description("조회 종료 일시, yyyy-MM-dd'T'HH:mm:ss (미포함), 미입력시 익월의 1일 0시 0분")
                        ),
                        responseFields(
                                fieldWithPath("[]").type(JsonFieldType.ARRAY).description("회의실 예약 목록"),
                                fieldWithPath("[].reserverDeptName").type(JsonFieldType.STRING).description("예약자 부서명"),
                                fieldWithPath("[].reserverEmpName").type(JsonFieldType.STRING).description("예약자 이름"),
                                fieldWithPath("[].participantCount").type(JsonFieldType.NUMBER).description("참여자 수"),
                                fieldWithPath("[].meetingDate").type(JsonFieldType.STRING).description("회의 날짜"),
                                fieldWithPath("[].startAt").type(JsonFieldType.STRING).description("시작 시각"),
                                fieldWithPath("[].endAt").type(JsonFieldType.STRING).description("종료 시각")
                        )
                ));
    }

    @Test
    @DisplayName("회의실 상세 조회 문서")
    void getMeetingRoomDetail() throws Exception {
        when(meetingRoomRetriever.retrieveMeetingRoomById(3L))
                .thenReturn(new MeetingRoomDetailResponse(3L, "대회의실", "프로젝터 구비", 20, true));

        mockMvc.perform(get(REQUEST_MAPPING_URL + "/{meetingRoomId}", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("MEETING_ROOM_DETAIL",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("meetingRoomId").description("회의실 식별 번호")),
                        responseFields(
                                fieldWithPath("meetingRoomId").type(JsonFieldType.NUMBER).description("회의실 식별 번호"),
                                fieldWithPath("name").type(JsonFieldType.STRING).description("회의실 이름"),
                                fieldWithPath("description").type(JsonFieldType.STRING).description("회의실 설명"),
                                fieldWithPath("capacity").type(JsonFieldType.NUMBER).description("수용 인원"),
                                fieldWithPath("isAvailable").type(JsonFieldType.BOOLEAN).description("활성화 여부")
                        )
                ));
    }

    @Test
    @DisplayName("회의실 첨부파일 목록 조회 문서")
    void getFilesByRoom() throws Exception {
        when(meetingRoomRetriever.retrieveMeetingRoomFiles(3L))
                .thenReturn(List.of(new FileListInfo(7L, "회의실.jpg", "jpg", 1024L)));

        mockMvc.perform(get(REQUEST_MAPPING_URL + "/{meetingRoomId}/files", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("MEETING_ROOM_FILES",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("meetingRoomId").description("회의실 식별 번호")),
                        responseFields(
                                fieldWithPath("[]").type(JsonFieldType.ARRAY).description("회의실 첨부파일 목록"),
                                fieldWithPath("[].fileId").type(JsonFieldType.NUMBER).description("파일 식별 번호"),
                                fieldWithPath("[].originalName").type(JsonFieldType.STRING).description("원본 파일명"),
                                fieldWithPath("[].extension").type(JsonFieldType.STRING).description("확장자"),
                                fieldWithPath("[].fileSize").type(JsonFieldType.NUMBER).description("파일 크기, byte")
                        )
                ));
    }

    @Test
    @DisplayName("회의실 생성 문서")
    void createMeetingRoom() throws Exception {
        MeetingRoomCreateRequest request = MeetingRoomCreateRequest.builder()
                .name("대회의실")
                .description("프로젝터 구비")
                .capacity(20)
                .build();
        when(meetingRoomManagement.createMeetingRoom(eq(1L), any(MeetingRoomCreateRequest.class)))
                .thenReturn(3L);

        mockMvc.perform(post(REQUEST_MAPPING_URL)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andDo(document("MEETING_ROOM_CREATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("시설 담당자 Bearer Access Token")),
                        requestFields(
                                fieldWithPath("name").type(JsonFieldType.STRING).attributes(key("constraints").value("필수, 공백 불가, 50자 이하")).description("회의실 이름"),
                                fieldWithPath("description").type(JsonFieldType.STRING).attributes(key("constraints").value("필수, 공백 불가")).description("회의실 설명"),
                                fieldWithPath("capacity").type(JsonFieldType.NUMBER).attributes(key("constraints").value("필수, 양수")).description("수용 인원")
                        ),
                        responseFields(fieldWithPath("id").type(JsonFieldType.NUMBER).description("생성된 회의실 식별 번호"))
                ));
    }

    @Test
    @DisplayName("회의실 정보 수정 문서")
    void changeMeetingRoomInfo() throws Exception {
        MeetingRoomUpdateRequest request = MeetingRoomUpdateRequest.builder()
                .name("수정 회의실")
                .description("수정된 설명")
                .capacity(25)
                .build();

        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{meetingRoomId}", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNoContent())
                .andDo(document("MEETING_ROOM_UPDATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("시설 담당자 Bearer Access Token")),
                        pathParameters(parameterWithName("meetingRoomId").description("회의실 식별 번호")),
                        requestFields(
                                fieldWithPath("name").optional().type(JsonFieldType.STRING).attributes(key("constraints").value("선택, 공백 불가, 50자 이하")).description("변경할 회의실 이름"),
                                fieldWithPath("description").optional().type(JsonFieldType.STRING).attributes(key("constraints").value("선택, 공백 불가")).description("변경할 회의실 설명"),
                                fieldWithPath("capacity").optional().type(JsonFieldType.NUMBER).attributes(key("constraints").value("선택, 양수")).description("변경할 수용 인원")
                        )
                ));
    }

    @Test
    @DisplayName("회의실 활성화 문서")
    void activateMeetingRoom() throws Exception {
        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{meetingRoomId}/activate", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isNoContent())
                .andDo(document("MEETING_ROOM_ACTIVATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("시설 담당자 Bearer Access Token")),
                        pathParameters(parameterWithName("meetingRoomId").description("회의실 식별 번호"))
                ));
    }

    @Test
    @DisplayName("회의실 비활성화 문서")
    void deactivateMeetingRoom() throws Exception {
        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{meetingRoomId}/deactivate", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isNoContent())
                .andDo(document("MEETING_ROOM_DEACTIVATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("시설 담당자 Bearer Access Token")),
                        pathParameters(parameterWithName("meetingRoomId").description("회의실 식별 번호"))
                ));
    }

    private PageImpl<MeetingRoomResponse> roomPage() {
        return new PageImpl<>(
                List.of(new MeetingRoomResponse(3L, "대회의실", 20, true)),
                PageRequest.of(0, 10), 1
        );
    }

    private FieldDescriptor[] roomPageFields() {
        return new FieldDescriptor[]{
                fieldWithPath("content").type(JsonFieldType.ARRAY).description("회의실 목록"),
                fieldWithPath("content[].meetingRoomId").type(JsonFieldType.NUMBER).description("회의실 식별 번호"),
                fieldWithPath("content[].name").type(JsonFieldType.STRING).description("회의실 이름"),
                fieldWithPath("content[].capacity").type(JsonFieldType.NUMBER).description("수용 인원"),
                fieldWithPath("content[].isAvailable").type(JsonFieldType.BOOLEAN).description("활성화 여부"),
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
}
