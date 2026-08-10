package com.haruon.groupware.adapter.docs.webapi.chat;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.chat.ChatCommandApi;
import com.haruon.groupware.adapter.webapi.chat.ChatQueryApi;
import com.haruon.groupware.application.chat.provided.forCommand.ChatRoomManagement;
import com.haruon.groupware.application.chat.provided.forRetriever.ChatMessageRetriever;
import com.haruon.groupware.application.chat.provided.forRetriever.ChatRoomRetriever;
import com.haruon.groupware.application.chat.service.query.dto.ChatMessagesResponse;
import com.haruon.groupware.application.chat.service.query.dto.ChatRoomDetailResponse;
import com.haruon.groupware.application.chat.service.query.dto.MyChatRoomsResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;

import java.time.LocalDateTime;
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

class ChatApiDocsTest extends RestDocsSupport {

    private static final String REQUEST_MAPPING_URL = "/api/chat/rooms";

    private final ChatMessageRetriever chatMessageRetriever = mock(ChatMessageRetriever.class);
    private final ChatRoomRetriever chatRoomRetriever = mock(ChatRoomRetriever.class);
    private final ChatRoomManagement chatRoomManagement = mock(ChatRoomManagement.class);

    @Override
    protected Object[] initControllers() {
        return new Object[]{
                new ChatQueryApi(chatMessageRetriever, chatRoomRetriever),
                new ChatCommandApi(chatRoomManagement)
        };
    }

    @Test
    @DisplayName("내 채팅방 목록 조회 문서")
    void getMyJoinedChatRooms() throws Exception {
        when(chatRoomRetriever.retrieveChatRooms(eq(1L), eq("업무"), eq(true)))
                .thenReturn(List.of(new MyChatRoomsResponse(
                        3L, "업무방", "마지막 메시지", LocalDateTime.of(2026, 6, 24, 10, 30),
                        2L, true, false, true, 3L, List.of("김영희", "박지민")
                )));

        mockMvc.perform(get(REQUEST_MAPPING_URL)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("keyword", "업무")
                        .queryParam("isBookmark", "true"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("CHAT_ROOM_LIST",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        queryParameters(
                                parameterWithName("keyword").optional().description("채팅방 표시명 또는 참여자 이름 검색어"),
                                parameterWithName("isBookmark").optional().description("즐겨찾기 여부")
                        ),
                        responseFields(
                                fieldWithPath("[]").type(JsonFieldType.ARRAY).attributes(destinationType("Array")).description("내 채팅방 목록"),
                                fieldWithPath("[].chatRoomId").type(JsonFieldType.NUMBER).attributes(destinationType("Number")).description("채팅방 식별 번호"),
                                fieldWithPath("[].roomName").type(JsonFieldType.STRING).attributes(destinationType("String")).optional().description("내 채팅방 표시명"),
                                fieldWithPath("[].lastMessageContent").type(JsonFieldType.STRING).attributes(destinationType("String")).optional().description("마지막 메시지 내용"),
                                fieldWithPath("[].lastMessagedAt").type(JsonFieldType.STRING).attributes(destinationType("String")).optional().description("마지막 메시지 발송 일시"),
                                fieldWithPath("[].unreadMessageCount").type(JsonFieldType.NUMBER).attributes(destinationType("Number")).optional().description("미읽음 메시지 수"),
                                fieldWithPath("[].isGroup").type(JsonFieldType.BOOLEAN).attributes(destinationType("Boolean")).description("그룹 채팅방 여부"),
                                fieldWithPath("[].isPastRoom").type(JsonFieldType.BOOLEAN).attributes(destinationType("Boolean")).description("오래된 채팅방 여부"),
                                fieldWithPath("[].isBookmarked").type(JsonFieldType.BOOLEAN).attributes(destinationType("Boolean")).description("즐겨찾기 여부"),
                                fieldWithPath("[].joinedMemberCount").type(JsonFieldType.NUMBER).attributes(destinationType("Number")).description("현재 참여자 수"),
                                fieldWithPath("[].participantNames").type(JsonFieldType.ARRAY).attributes(destinationType("Array")).description("참여자 이름 목록(본인 제외, 표시명 폴백용)")
                        )
                ));
    }

    @Test
    @DisplayName("채팅방 상세 조회 문서")
    void getRoomDetail() throws Exception {
        when(chatRoomRetriever.retrieveChatRoomDetail(1L, 3L))
                .thenReturn(chatRoomDetailResponse());

        mockMvc.perform(get(REQUEST_MAPPING_URL + "/{roomId}", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("CHAT_ROOM_DETAIL",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("roomId").description("채팅방 식별 번호")),
                        responseFields(chatRoomDetailFields())
                ));
    }

    @Test
    @DisplayName("채팅 메시지 목록 조회 문서")
    void getChatMessages() throws Exception {
        when(chatMessageRetriever.retrieveChatMessages(1L, 3L, 100L, 50))
                .thenReturn(new ChatMessagesResponse(
                        List.of(new ChatMessagesResponse.ChatMessageResponse(
                                99L, 1L, "550e8400-e29b-41d4-a716-446655440000",
                                "홍길동", "안녕하세요.", LocalDateTime.of(2026, 6, 24, 10, 30),
                                "/api/employees/1/files/7/preview"
                        )),
                        99L,
                        true
                ));

        mockMvc.perform(get(REQUEST_MAPPING_URL + "/{roomId}/messages", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("cursor", "100")
                        .queryParam("size", "50"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("CHAT_MESSAGES",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("roomId").description("채팅방 식별 번호")),
                        queryParameters(
                                parameterWithName("cursor").optional().description("이전 페이지 기준 메시지 식별 번호"),
                                parameterWithName("size").optional().description("조회할 메시지 수, 기본값 50")
                        ),
                        responseFields(chatMessagesResponseFields())
                ));
    }

    @Test
    @DisplayName("채팅방 생성 문서")
    void createChatRoom() throws Exception {
        ChatCommandApi.RoomMemberIdsRequest request = new ChatCommandApi.RoomMemberIdsRequest(Set.of(2L, 3L));
        when(chatRoomManagement.makeRoom(eq(1L), eq(Set.of(2L, 3L)), any(LocalDateTime.class)))
                .thenReturn(3L);

        mockMvc.perform(post(REQUEST_MAPPING_URL)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(document("CHAT_ROOM_CREATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        requestFields(roomMemberIdsRequestFields()),
                        responseFields(fieldWithPath("id").type(JsonFieldType.NUMBER)
                                .attributes(destinationType("Number"))
                                .description("생성된 채팅방 식별 번호"))
                ));
    }

    @Test
    @DisplayName("채팅방 멤버 초대 문서")
    void inviteMembers() throws Exception {
        ChatCommandApi.RoomMemberIdsRequest request = new ChatCommandApi.RoomMemberIdsRequest(Set.of(4L, 5L));

        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{roomId}/invite", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNoContent())
                .andDo(document("CHAT_ROOM_INVITE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("roomId").description("채팅방 식별 번호")),
                        requestFields(roomMemberIdsRequestFields())
                ));
    }

    @Test
    @DisplayName("채팅방 표시명 수정 문서")
    void updateRoomDisplayName() throws Exception {
        ChatCommandApi.RoomNameRequest request = new ChatCommandApi.RoomNameRequest("업무 채팅방");

        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{roomId}/name", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNoContent())
                .andDo(document("CHAT_ROOM_NAME_UPDATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("roomId").description("채팅방 식별 번호")),
                        requestFields(fieldWithPath("name").type(JsonFieldType.STRING)
                                .attributes(destinationType("String"), key("constraints").value("필수, 공백 불가, 20자 이하"))
                                .description("내 채팅방 표시명"))
                ));
    }

    @Test
    @DisplayName("채팅방 나가기 문서")
    void leaveChatRoom() throws Exception {
        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{roomId}/leave", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isNoContent())
                .andDo(document("CHAT_ROOM_LEAVE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("roomId").description("채팅방 식별 번호"))
                ));
    }

    @Test
    @DisplayName("채팅방 즐겨찾기 문서")
    void bookmarkChatRoom() throws Exception {
        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{roomId}/bookmark", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isNoContent())
                .andDo(document("CHAT_ROOM_BOOKMARK",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("roomId").description("채팅방 식별 번호"))
                ));
    }

    @Test
    @DisplayName("채팅방 즐겨찾기 해제 문서")
    void unbookmarkChatRoom() throws Exception {
        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{roomId}/unbookmark", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isNoContent())
                .andDo(document("CHAT_ROOM_UNBOOKMARK",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("roomId").description("채팅방 식별 번호"))
                ));
    }

    @Test
    @DisplayName("마지막 읽은 채팅 갱신 문서")
    void updateReadPosition() throws Exception {
        ChatCommandApi.LastReadIdRequest request = new ChatCommandApi.LastReadIdRequest(99L);

        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/{roomId}/read-position", 3L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNoContent())
                .andDo(document("CHAT_ROOM_READ_POSITION_UPDATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("roomId").description("채팅방 식별 번호")),
                        requestFields(fieldWithPath("lastReadMessageId").type(JsonFieldType.NUMBER)
                                .attributes(destinationType("Number"), key("constraints").value("필수"))
                                .description("마지막으로 읽은 채팅 메시지 식별 번호"))
                ));
    }

    private ChatRoomDetailResponse chatRoomDetailResponse() {
        return new ChatRoomDetailResponse(
                3L,
                "업무방",
                true,
                99L,
                List.of(
                        new ChatRoomDetailResponse.ChatRoomMember(
                                1L, "개발팀", "홍길동", "/api/employees/1/files/7/preview"
                        ),
                        new ChatRoomDetailResponse.ChatRoomMember(
                                2L, "기획팀", "김영희", "/api/employees/2/files/8/preview"
                        )
                )
        );
    }

    private org.springframework.restdocs.payload.FieldDescriptor[] chatRoomDetailFields() {
        return new org.springframework.restdocs.payload.FieldDescriptor[]{
                fieldWithPath("roomId").type(JsonFieldType.NUMBER).attributes(destinationType("Number")).description("채팅방 식별 번호"),
                fieldWithPath("roomName").type(JsonFieldType.STRING).attributes(destinationType("String")).optional().description("내 채팅방 표시명"),
                fieldWithPath("isGroup").type(JsonFieldType.BOOLEAN).attributes(destinationType("Boolean")).description("그룹 채팅방 여부"),
                fieldWithPath("lastReadMessageId").type(JsonFieldType.NUMBER).attributes(destinationType("Number")).optional().description("마지막으로 읽은 채팅 메시지 식별 번호"),
                fieldWithPath("members").type(JsonFieldType.ARRAY).attributes(destinationType("Array")).description("현재 참여자 목록"),
                fieldWithPath("members[].memberId").type(JsonFieldType.NUMBER).attributes(destinationType("Number")).description("참여자 사원 식별 번호"),
                fieldWithPath("members[].deptName").type(JsonFieldType.STRING).attributes(destinationType("String")).optional().description("참여자 주 소속 부서명"),
                fieldWithPath("members[].memberName").type(JsonFieldType.STRING).attributes(destinationType("String")).description("참여자 이름"),
                fieldWithPath("members[].profileImageUrl").type(JsonFieldType.STRING).attributes(destinationType("String")).optional().description("참여자 프로필 이미지 미리보기 URL")
        };
    }

    private org.springframework.restdocs.payload.FieldDescriptor[] chatMessagesResponseFields() {
        return new org.springframework.restdocs.payload.FieldDescriptor[]{
                fieldWithPath("messages").type(JsonFieldType.ARRAY).attributes(destinationType("Array")).description("채팅 메시지 목록"),
                fieldWithPath("messages[].id").type(JsonFieldType.NUMBER).attributes(destinationType("Number")).description("채팅 메시지 식별 번호"),
                fieldWithPath("messages[].senderId").type(JsonFieldType.NUMBER).attributes(destinationType("Number")).description("발신자 사원 식별 번호"),
                fieldWithPath("messages[].clientMessageId").type(JsonFieldType.STRING).attributes(destinationType("String")).description("클라이언트 메시지 UUID"),
                fieldWithPath("messages[].senderName").type(JsonFieldType.STRING).attributes(destinationType("String")).description("발신자 이름"),
                fieldWithPath("messages[].content").type(JsonFieldType.STRING).attributes(destinationType("String")).description("메시지 내용"),
                fieldWithPath("messages[].sentAt").type(JsonFieldType.STRING).attributes(destinationType("String")).description("메시지 발송 일시"),
                fieldWithPath("messages[].profileImageUrl").type(JsonFieldType.STRING).attributes(destinationType("String")).optional().description("발신자 프로필 이미지 미리보기 URL"),
                fieldWithPath("nextCursor").type(JsonFieldType.NUMBER).attributes(destinationType("Number")).optional().description("다음 페이지 요청에 사용할 cursor"),
                fieldWithPath("hasNext").type(JsonFieldType.BOOLEAN).attributes(destinationType("Boolean")).description("다음 페이지 존재 여부")
        };
    }

    private org.springframework.restdocs.payload.FieldDescriptor[] roomMemberIdsRequestFields() {
        return new org.springframework.restdocs.payload.FieldDescriptor[]{
                fieldWithPath("memberIds").type(JsonFieldType.ARRAY)
                        .attributes(destinationType("Array"), key("constraints").value("필수, 빈 배열 불가"))
                        .description("대상 사원 식별 번호 목록")
        };
    }

    private org.springframework.restdocs.snippet.Attributes.Attribute destinationType(String destinationType) {
        return key("destinationType").value(destinationType);
    }
}
