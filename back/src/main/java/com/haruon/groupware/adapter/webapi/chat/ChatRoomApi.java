package com.haruon.groupware.adapter.webapi.chat;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.chat.provided.forRetrieve.ChatRoomRetriever;
import com.haruon.groupware.application.chat.service.query.dto.ChatRoomDetailResponse;
import com.haruon.groupware.application.chat.service.query.dto.MyChatRoomsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class ChatRoomApi {

    private final ChatRoomRetriever chatRoomRetriever;

    // 내가 참여중인 채팅방 조회 - 오래된 채팅방 여부, 즐겨찾기 필드도 넣을 것
    @GetMapping
    public ResponseEntity<List<MyChatRoomsResponse>> getMyJoinedChatRooms(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean isBookmark
    ) {
        List<MyChatRoomsResponse> responses = chatRoomRetriever
                .retrieveChatRooms(details.getEmpId(), keyword, isBookmark);

        return ResponseEntity.ok().body(responses);
    }

    // 채팅방 상세 조회
    @GetMapping("/{roomId}")
    public ResponseEntity<ChatRoomDetailResponse> getRoomDetail(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long roomId
    ) {
        ChatRoomDetailResponse response = chatRoomRetriever
                .retrieveChatRoomDetail(details.getEmpId(), roomId);

        return ResponseEntity.ok().body(response);
    }





}
