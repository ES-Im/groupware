package com.haruon.groupware.adapter.webapi.chat;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.chat.provided.forRetrieve.ChatMessageRetriever;
import com.haruon.groupware.application.chat.provided.forRetrieve.ChatRoomRetriever;
import com.haruon.groupware.application.chat.service.query.dto.ChatMessagesResponse;
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
public class ChatQueryApi {

    private final ChatMessageRetriever chatMessageRetriever;
    private final ChatRoomRetriever chatRoomRetriever;

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<ChatMessagesResponse> getChatMessages(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long roomId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "50") Integer size
    ) {
        ChatMessagesResponse response = chatMessageRetriever
                .retrieveChatMessages(details.getEmpId(), roomId, cursor, size);

        return ResponseEntity.ok().body(response);
    }


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
